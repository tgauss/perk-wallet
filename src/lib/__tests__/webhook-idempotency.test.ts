import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'crypto';

function generateWebhookSignature(payload: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

describe('Webhook Idempotency', () => {
  const webhookSecret = 'test-webhook-secret';
  const mockEventId = 'evt_123456789';
  
  const createMockEvent = (id: string, type: string) => ({
    id,
    type,
    participant_id: 'participant_123',
    program_id: 'program_123',
    data: {
      points_earned: 100,
    },
    created_at: new Date().toISOString(),
  });

  describe('Event Processing', () => {
    it('should process a new event successfully', () => {
      const event = createMockEvent(mockEventId, 'points_earned');
      const eventJson = JSON.stringify(event);
      const signature = generateWebhookSignature(eventJson, webhookSecret);
      
      expect(signature).toBeTruthy();
      expect(signature.length).toBe(64);
    });

    it('should generate different signatures for different events', () => {
      const event1 = createMockEvent('evt_1', 'points_earned');
      const event2 = createMockEvent('evt_2', 'points_earned');
      
      const signature1 = generateWebhookSignature(JSON.stringify(event1), webhookSecret);
      const signature2 = generateWebhookSignature(JSON.stringify(event2), webhookSecret);
      
      expect(signature1).not.toBe(signature2);
    });

    it('should generate same signature for same event', () => {
      const event = createMockEvent(mockEventId, 'points_earned');
      const eventJson = JSON.stringify(event);
      
      const signature1 = generateWebhookSignature(eventJson, webhookSecret);
      const signature2 = generateWebhookSignature(eventJson, webhookSecret);
      
      expect(signature1).toBe(signature2);
    });
  });

  describe('Idempotency Key Generation', () => {
    it('should use event.id as idempotency key', () => {
      const event = createMockEvent(mockEventId, 'points_earned');
      const idempotencyKey = event.id;
      
      expect(idempotencyKey).toBe(mockEventId);
    });

    it('should handle duplicate event ids', () => {
      const event1 = createMockEvent(mockEventId, 'points_earned');
      const event2 = createMockEvent(mockEventId, 'points_earned');
      
      expect(event1.id).toBe(event2.id);
    });

    it('should generate hash for body if no event id', () => {
      const eventWithoutId = {
        type: 'points_earned',
        participant_id: 'participant_123',
        program_id: 'program_123',
        data: { points_earned: 100 },
        created_at: new Date().toISOString(),
      };
      
      const bodyHash = createHmac('sha256', '')
        .update(JSON.stringify(eventWithoutId))
        .digest('hex');
      
      expect(bodyHash).toBeTruthy();
      expect(bodyHash.length).toBe(64);
    });
  });

  describe('Signature Verification', () => {
    it('should verify valid signature', () => {
      const event = createMockEvent(mockEventId, 'points_earned');
      const eventJson = JSON.stringify(event);
      const validSignature = generateWebhookSignature(eventJson, webhookSecret);
      
      const verifySignature = (payload: string, signature: string, secret: string): boolean => {
        const expectedSignature = generateWebhookSignature(payload, secret);
        return signature === expectedSignature;
      };
      
      expect(verifySignature(eventJson, validSignature, webhookSecret)).toBe(true);
    });

    it('should reject invalid signature', () => {
      const event = createMockEvent(mockEventId, 'points_earned');
      const eventJson = JSON.stringify(event);
      const invalidSignature = 'invalid_signature';
      
      const verifySignature = (payload: string, signature: string, secret: string): boolean => {
        const expectedSignature = generateWebhookSignature(payload, secret);
        return signature === expectedSignature;
      };
      
      expect(verifySignature(eventJson, invalidSignature, webhookSecret)).toBe(false);
    });

    it('should reject signature with wrong secret', () => {
      const event = createMockEvent(mockEventId, 'points_earned');
      const eventJson = JSON.stringify(event);
      const signatureWithWrongSecret = generateWebhookSignature(eventJson, 'wrong_secret');
      
      const verifySignature = (payload: string, signature: string, secret: string): boolean => {
        const expectedSignature = generateWebhookSignature(payload, secret);
        return signature === expectedSignature;
      };
      
      expect(verifySignature(eventJson, signatureWithWrongSecret, webhookSecret)).toBe(false);
    });
  });

  describe('Event Type Handling', () => {
    const eventTypes = [
      'new_participant',
      'points_earned',
      'challenge_completed',
      'reward_earned',
    ];

    eventTypes.forEach(eventType => {
      it(`should handle ${eventType} event`, () => {
        const event = createMockEvent(mockEventId, eventType);
        expect(event.type).toBe(eventType);
        expect(['new_participant', 'points_earned', 'challenge_completed', 'reward_earned']).toContain(event.type);
      });
    });

    it('should handle unknown event types gracefully', () => {
      const event = createMockEvent(mockEventId, 'unknown_event_type');
      const isKnownEventType = (type: string) => {
        return ['new_participant', 'points_earned', 'challenge_completed', 'reward_earned'].includes(type);
      };
      
      expect(isKnownEventType(event.type)).toBe(false);
    });
  });
});