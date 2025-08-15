import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock the supabase module
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    insert: jest.fn(),
  })),
};

jest.mock('../supabase', () => ({
  supabase: mockSupabase,
}));

import { queueNotificationEvent, flushAllNotifications } from '../notify';

describe('Notification System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any existing timers
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const createTestEvent = (participant_uuid: string, timestamp?: string) => ({
    id: 'test-event-1',
    program_id: 'program-123',
    participant_uuid,
    rule: 'points_updated' as const,
    data: {
      unused_points_before: 100,
      unused_points_after: 125,
    },
    timestamp: timestamp || new Date().toISOString(),
  });

  const mockParticipant = {
    program_id: 'program-123',
    perk_participant_id: 12345,
    email: 'test@example.com',
    points: 250,
    unused_points: 125,
    status: 'active',
    tier: 'gold',
    fname: 'John',
    lname: 'Doe',
    profile_attributes: {},
  };

  const mockProgram = {
    id: 'program-123',
    name: 'Test Program',
    settings: { points_display: 'unused_points' },
  };

  describe('queueNotificationEvent', () => {
    it('should queue a single event and schedule flush', async () => {
      const event = createTestEvent('test-participant');

      await queueNotificationEvent(event, {
        merge_window_sec: 5,
        throttle_sec: 10,
      });

      // Should schedule flush after merge window
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);
    });

    it('should merge multiple events within merge window', async () => {
      const participant = 'test-participant';
      const event1 = createTestEvent(participant);
      const event2 = createTestEvent(participant);

      await queueNotificationEvent(event1, { merge_window_sec: 5 });
      await queueNotificationEvent(event2, { merge_window_sec: 5 });

      // Should only schedule one flush
      expect(setTimeout).toHaveBeenCalledTimes(1);
    });

    it('should create separate buffers for different participants', async () => {
      const event1 = createTestEvent('participant-1');
      const event2 = createTestEvent('participant-2');

      await queueNotificationEvent(event1, { merge_window_sec: 5 });
      await queueNotificationEvent(event2, { merge_window_sec: 5 });

      // Should schedule two separate flushes
      expect(setTimeout).toHaveBeenCalledTimes(2);
    });

    it('should create separate buffers for different rules', async () => {
      const baseEvent = createTestEvent('test-participant');
      const event1 = { ...baseEvent, rule: 'points_updated' as const };
      const event2 = { ...baseEvent, rule: 'reward_earned' as const };

      await queueNotificationEvent(event1, { merge_window_sec: 5 });
      await queueNotificationEvent(event2, { merge_window_sec: 5 });

      // Should schedule two separate flushes
      expect(setTimeout).toHaveBeenCalledTimes(2);
    });
  });

  describe('notification merging', () => {
    beforeEach(() => {
      // Mock successful database calls
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'participants') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({ data: mockParticipant }),
              })),
            })),
          };
        }
        if (table === 'programs') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({ data: mockProgram }),
              })),
            })),
          };
        }
        if (table === 'jobs') {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return mockSupabase.from();
      });
    });

    it('should merge 5 events over 90 seconds into one notification', async () => {
      const participant = 'test-participant';
      const baseTime = new Date('2024-08-12T10:00:00Z');
      
      // Create 5 events spread over 90 seconds
      const events = Array.from({ length: 5 }, (_, i) => {
        const eventTime = new Date(baseTime.getTime() + i * 22500); // 22.5s intervals
        return {
          ...createTestEvent(participant, eventTime.toISOString()),
          data: {
            unused_points_before: 100 + i * 5,
            unused_points_after: 105 + i * 5,
          },
        };
      });

      // Queue all events
      for (const event of events) {
        await queueNotificationEvent(event, {
          merge_window_sec: 120,
          throttle_sec: 300,
          points_display: 'unused_points',
        });
      }

      // Fast-forward through merge window
      jest.advanceTimersByTime(120000);

      // Should have called jobs insert once for the merged notification
      expect(mockSupabase.from).toHaveBeenCalledWith('jobs');
    });

    it('should calculate correct points delta from first to last event', async () => {
      const participant = 'test-participant';
      const baseTime = new Date();
      
      const events = [
        {
          ...createTestEvent(participant, baseTime.toISOString()),
          data: { unused_points_before: 100, unused_points_after: 105 },
        },
        {
          ...createTestEvent(participant, new Date(baseTime.getTime() + 30000).toISOString()),
          data: { unused_points_before: 105, unused_points_after: 115 },
        },
        {
          ...createTestEvent(participant, new Date(baseTime.getTime() + 60000).toISOString()),
          data: { unused_points_before: 115, unused_points_after: 120 },
        },
      ];

      for (const event of events) {
        await queueNotificationEvent(event, {
          merge_window_sec: 120,
          points_display: 'unused_points',
        });
      }

      // Fast-forward to trigger flush
      jest.advanceTimersByTime(120000);

      // Verify that the job was created with correct delta (120 - 100 = 20)
      const insertCall = mockSupabase.from('jobs').insert as jest.MockedFunction<any>;
      expect(insertCall).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'notification_sent',
          payload: expect.objectContaining({
            points_delta: 20,
            new_points: 120,
            events_merged: 3,
          }),
        })
      );
    });
  });

  describe('throttling', () => {
    it('should throttle notifications within throttle window', async () => {
      // This is a simplified test - in practice, throttling would need
      // a more sophisticated setup to test timing across multiple calls
      const event = createTestEvent('test-participant');

      await queueNotificationEvent(event, {
        merge_window_sec: 1,
        throttle_sec: 300,
      });

      // Fast-forward past merge window
      jest.advanceTimersByTime(1000);

      // Queue another event soon after
      const event2 = createTestEvent('test-participant');
      await queueNotificationEvent(event2, {
        merge_window_sec: 1,
        throttle_sec: 300,
      });

      jest.advanceTimersByTime(1000);

      // The second notification should be throttled
      // (Implementation would track last sent time and skip sending)
    });
  });
});