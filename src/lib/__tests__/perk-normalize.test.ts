import { describe, it, expect } from '@jest/globals';
import { toSnapshot, fromDatabaseRow } from '../perk/normalize';

describe('Perk Participant Normalization', () => {
  const samplePerkParticipant = {
    id: 12345,
    email: 'fan@bluejackets.com',
    first_name: 'John',
    last_name: 'Hockey',
    points: 250,
    unused_points: 125,
    status: 'active',
    tier: 'Season Ticket Holder',
    tag_list: ['vip', 'season_ticket', 'premium'],
    profile_attributes: {
      seat_section: '110',
      favorite_player: 'Johnny Gaudreau',
      years_as_fan: 8,
    },
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-08-12T15:45:00Z',
  };

  const sampleDbRow = {
    program_id: 'program-123',
    perk_participant_id: 12345,
    email: 'fan@bluejackets.com',
    points: 250,
    unused_points: 125,
    tier: 'Season Ticket Holder',
    status: 'active',
    fname: 'John',
    lname: 'Hockey',
    tag_list: ['vip', 'season_ticket', 'premium'],
    profile_attributes: {
      seat_section: '110',
      favorite_player: 'Johnny Gaudreau',
    },
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-08-12T15:45:00Z',
  };

  describe('toSnapshot', () => {
    it('should normalize full Perk participant data', () => {
      const snapshot = toSnapshot(samplePerkParticipant);

      expect(snapshot).toEqual({
        perk_participant_id: 12345,
        email: 'fan@bluejackets.com',
        points: 250,
        unused_points: 125,
        status: 'active',
        tier: 'Season Ticket Holder',
        fname: 'John',
        lname: 'Hockey',
        tag_list: ['vip', 'season_ticket', 'premium'],
        profile: {
          seat_section: '110',
          favorite_player: 'Johnny Gaudreau',
          years_as_fan: 8,
        },
      });
    });

    it('should use status as tier fallback when tier is null', () => {
      const participantWithoutTier = {
        ...samplePerkParticipant,
        tier: null,
        status: 'premium',
      };

      const snapshot = toSnapshot(participantWithoutTier);
      expect(snapshot.tier).toBe('premium');
    });

    it('should handle missing optional fields', () => {
      const minimalParticipant = {
        id: 12345,
        email: 'test@example.com',
      };

      const snapshot = toSnapshot(minimalParticipant);

      expect(snapshot).toEqual({
        perk_participant_id: 12345,
        email: 'test@example.com',
        points: 0,
        unused_points: 0,
        status: null,
        tier: null,
        fname: null,
        lname: null,
        tag_list: [],
        profile: {},
      });
    });

    it('should handle webhook participant schema', () => {
      const webhookParticipant = {
        id: 12345,
        email: 'fan@bluejackets.com',
        points: 250,
        unused_points: 125,
        status: 'active',
      };

      const snapshot = toSnapshot(webhookParticipant);

      expect(snapshot.perk_participant_id).toBe(12345);
      expect(snapshot.email).toBe('fan@bluejackets.com');
      expect(snapshot.points).toBe(250);
      expect(snapshot.unused_points).toBe(125);
      expect(snapshot.status).toBe('active');
    });
  });

  describe('fromDatabaseRow', () => {
    it('should normalize database row to snapshot', () => {
      const snapshot = fromDatabaseRow(sampleDbRow);

      expect(snapshot).toEqual({
        perk_participant_id: 12345,
        email: 'fan@bluejackets.com',
        points: 250,
        unused_points: 125,
        status: 'active',
        tier: 'Season Ticket Holder',
        fname: 'John',
        lname: 'Hockey',
        tag_list: ['vip', 'season_ticket', 'premium'],
        profile: {
          seat_section: '110',
          favorite_player: 'Johnny Gaudreau',
        },
      });
    });

    it('should use status as tier fallback in database row', () => {
      const rowWithoutTier = {
        ...sampleDbRow,
        tier: null,
        status: 'bronze',
      };

      const snapshot = fromDatabaseRow(rowWithoutTier);
      expect(snapshot.tier).toBe('bronze');
    });

    it('should handle missing profile attributes', () => {
      const rowWithoutProfile = {
        ...sampleDbRow,
        fname: null,
        lname: null,
        tag_list: null,
        profile_attributes: null,
      };

      const snapshot = fromDatabaseRow(rowWithoutProfile);

      expect(snapshot.fname).toBe(null);
      expect(snapshot.lname).toBe(null);
      expect(snapshot.tag_list).toEqual([]);
      expect(snapshot.profile).toEqual({});
    });
  });
});