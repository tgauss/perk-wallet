import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PerkClient } from '../perk-client';

global.fetch = vi.fn();

describe('PerkClient', () => {
  let client: PerkClient;
  const mockApiKey = 'test-api-key';
  const mockBaseUrl = 'https://api.test.com';

  beforeEach(() => {
    client = new PerkClient(mockApiKey, mockBaseUrl);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('429 Rate Limit Handling', () => {
    it('should retry on 429 with exponential backoff', async () => {
      const mockParticipant = {
        id: '123',
        email: 'test@example.com',
        uuid: 'test-uuid',
        points: 100,
        tier: 'gold',
        status: 'active',
        profile_attributes: {},
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      let callCount = 0;
      (global.fetch as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            status: 429,
            headers: new Headers(),
            ok: false,
          });
        }
        return Promise.resolve({
          status: 200,
          ok: true,
          json: () => Promise.resolve({ participant: mockParticipant }),
        });
      });

      const start = Date.now();
      const result = await client.getParticipantById('123');
      const duration = Date.now() - start;

      expect(result).toEqual(mockParticipant);
      expect(callCount).toBe(2);
      expect(duration).toBeGreaterThanOrEqual(1000);
    });

    it('should respect Retry-After header on 429', async () => {
      const mockParticipant = {
        id: '123',
        email: 'test@example.com',
        uuid: 'test-uuid',
        points: 100,
        profile_attributes: {},
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      let callCount = 0;
      (global.fetch as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            status: 429,
            headers: new Headers({ 'Retry-After': '2' }),
            ok: false,
          });
        }
        return Promise.resolve({
          status: 200,
          ok: true,
          json: () => Promise.resolve({ participant: mockParticipant }),
        });
      });

      const start = Date.now();
      const result = await client.getParticipantById('123');
      const duration = Date.now() - start;

      expect(result).toEqual(mockParticipant);
      expect(callCount).toBe(2);
      expect(duration).toBeGreaterThanOrEqual(2000);
    });

    it('should fail after max retries on 429', async () => {
      (global.fetch as any).mockResolvedValue({
        status: 429,
        headers: new Headers(),
        ok: false,
      });

      await expect(client.getParticipantById('123')).rejects.toThrow('Rate limit exceeded after max retries');
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('500 Server Error Handling', () => {
    it('should retry on 500 errors', async () => {
      const mockParticipant = {
        id: '123',
        email: 'test@example.com',
        uuid: 'test-uuid',
        points: 100,
        profile_attributes: {},
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      let callCount = 0;
      (global.fetch as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            status: 500,
            statusText: 'Internal Server Error',
            ok: false,
            text: () => Promise.resolve('Server error'),
          });
        }
        return Promise.resolve({
          status: 200,
          ok: true,
          json: () => Promise.resolve({ participant: mockParticipant }),
        });
      });

      const result = await client.getParticipantById('123');
      
      expect(result).toEqual(mockParticipant);
      expect(callCount).toBe(2);
    });

    it('should fail after max retries on persistent 500 errors', async () => {
      (global.fetch as any).mockResolvedValue({
        status: 500,
        statusText: 'Internal Server Error',
        ok: false,
        text: () => Promise.resolve('Server error'),
      });

      await expect(client.getParticipantById('123')).rejects.toThrow('API request failed: Internal Server Error');
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('Network Error Handling', () => {
    it('should retry on network errors', async () => {
      const mockParticipant = {
        id: '123',
        email: 'test@example.com',
        uuid: 'test-uuid',
        points: 100,
        profile_attributes: {},
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      let callCount = 0;
      (global.fetch as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          status: 200,
          ok: true,
          json: () => Promise.resolve({ participant: mockParticipant }),
        });
      });

      const result = await client.getParticipantById('123');
      
      expect(result).toEqual(mockParticipant);
      expect(callCount).toBe(2);
    });
  });

  describe('API Methods', () => {
    it('should create a participant', async () => {
      const mockParticipant = {
        id: '123',
        email: 'test@example.com',
        uuid: 'test-uuid',
        points: 0,
        profile_attributes: {},
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      (global.fetch as any).mockResolvedValue({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ participant: mockParticipant }),
      });

      const result = await client.createParticipant({
        email: 'test@example.com',
      });

      expect(result).toEqual(mockParticipant);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v2/participants`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            participant: { email: 'test@example.com' },
          }),
        })
      );
    });

    it('should return null for 404 on getParticipantByEmail', async () => {
      (global.fetch as any).mockResolvedValue({
        status: 404,
        statusText: 'Not Found',
        ok: false,
        text: () => Promise.resolve('Not found'),
      });

      const result = await client.getParticipantByEmail('nonexistent@example.com');
      
      expect(result).toBeNull();
    });

    it('should update participant points', async () => {
      const mockParticipant = {
        id: '123',
        email: 'test@example.com',
        uuid: 'test-uuid',
        points: 150,
        profile_attributes: {},
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      (global.fetch as any).mockResolvedValue({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ participant: mockParticipant }),
      });

      const result = await client.updateParticipantPoints('123', 150, 'set');

      expect(result.points).toBe(150);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v2/participants/points`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            participant_id: '123',
            points: 150,
            operation: 'set',
          }),
        })
      );
    });
  });
});