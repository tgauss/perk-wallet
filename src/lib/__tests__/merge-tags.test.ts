import { describe, it, expect } from '@jest/globals';
import { resolveTags, replaceTags, findUnknownTags, validateTemplate } from '../mergeTags';
import type { ParticipantSnapshot } from '../perk/normalize';

describe('Merge Tags', () => {
  const sampleSnapshot: ParticipantSnapshot = {
    perk_participant_id: 12345,
    perk_uuid: 'test-uuid',
    email: 'fan@bluejackets.com',
    points: 250,
    unused_points: 125,
    status: 'active',
    tier: 'Season Ticket Holder',
    fname: 'John',
    lname: 'Hockey',
    tag_list: ['vip', 'premium'],
    profile: {
      seat_section: '110',
      favorite_player: 'Johnny Gaudreau',
      years_as_fan: 8,
    },
  };

  const sampleProgram = {
    id: 'program-123',
    name: 'Blue Jackets Loyalty',
    settings: { points_display: 'unused_points' },
  };

  describe('resolveTags', () => {
    it('should resolve basic participant tags', () => {
      const tags = resolveTags({ snapshot: sampleSnapshot });

      expect(tags.get('points')).toBe('250');
      expect(tags.get('unused_points')).toBe('125');
      expect(tags.get('status')).toBe('active');
      expect(tags.get('tier')).toBe('Season Ticket Holder');
      expect(tags.get('email')).toBe('fan@bluejackets.com');
      expect(tags.get('fname')).toBe('John');
      expect(tags.get('lname')).toBe('Hockey');
      expect(tags.get('full_name')).toBe('John Hockey');
    });

    it('should resolve program tags', () => {
      const tags = resolveTags({ snapshot: sampleSnapshot, program: sampleProgram });

      expect(tags.get('program_name')).toBe('Blue Jackets Loyalty');
    });

    it('should resolve profile attribute tags', () => {
      const tags = resolveTags({ snapshot: sampleSnapshot });

      expect(tags.get('profile.seat_section')).toBe('110');
      expect(tags.get('profile.favorite_player')).toBe('Johnny Gaudreau');
      expect(tags.get('profile.years_as_fan')).toBe('8');
    });

    it('should resolve event-specific tags', () => {
      const tags = resolveTags({
        snapshot: sampleSnapshot,
        pointsDelta: 25,
        newPoints: 150,
      });

      expect(tags.get('points_delta')).toBe('+25');
      expect(tags.get('new_points')).toBe('150');
    });

    it('should handle negative points delta', () => {
      const tags = resolveTags({
        snapshot: sampleSnapshot,
        pointsDelta: -10,
        newPoints: 115,
      });

      expect(tags.get('points_delta')).toBe('-10');
      expect(tags.get('new_points')).toBe('115');
    });

    it('should use tier fallback to status', () => {
      const snapshotWithoutTier = {
        ...sampleSnapshot,
        tier: null,
        status: 'bronze',
      };

      const tags = resolveTags({ snapshot: snapshotWithoutTier });
      expect(tags.get('tier')).toBe('bronze');
    });

    it('should handle missing full name', () => {
      const snapshotNoName = {
        ...sampleSnapshot,
        fname: null,
        lname: null,
      };

      const tags = resolveTags({ snapshot: snapshotNoName });
      expect(tags.get('full_name')).toBe('');
    });
  });

  describe('replaceTags', () => {
    it('should replace single tags in template', () => {
      const tags = new Map([
        ['points', '250'],
        ['fname', 'John'],
      ]);

      const result = replaceTags('Hello {fname}, you have {points} points!', tags);
      expect(result).toBe('Hello John, you have 250 points!');
    });

    it('should replace multiple occurrences of same tag', () => {
      const tags = new Map([['name', 'John']]);

      const result = replaceTags('Hi {name}! Welcome back, {name}.', tags);
      expect(result).toBe('Hi John! Welcome back, John.');
    });

    it('should leave unknown tags unchanged', () => {
      const tags = new Map([['points', '250']]);

      const result = replaceTags('You have {points} points and {unknown} rewards.', tags);
      expect(result).toBe('You have 250 points and {unknown} rewards.');
    });
  });

  describe('findUnknownTags', () => {
    it('should identify unknown tags', () => {
      const template = 'Hello {fname}, you have {points} points and {unknown_field} rewards.';
      const unknownTags = findUnknownTags(template);

      expect(unknownTags).toEqual(['unknown_field']);
    });

    it('should not flag known tags as unknown', () => {
      const template = 'Hello {fname}, you have {points} points. Your tier is {tier}.';
      const unknownTags = findUnknownTags(template);

      expect(unknownTags).toEqual([]);
    });

    it('should not flag profile attributes as unknown', () => {
      const template = 'Your seat is in section {profile.seat_section}.';
      const unknownTags = findUnknownTags(template);

      expect(unknownTags).toEqual([]);
    });

    it('should not flag event-specific tags as unknown', () => {
      const template = 'You gained {points_delta} points! New balance: {new_points}';
      const unknownTags = findUnknownTags(template);

      expect(unknownTags).toEqual([]);
    });

    it('should handle multiple unknown tags', () => {
      const template = 'Hello {unknown1} and {unknown2}!';
      const unknownTags = findUnknownTags(template);

      expect(unknownTags).toEqual(['unknown1', 'unknown2']);
    });

    it('should deduplicate unknown tags', () => {
      const template = 'Hello {unknown} and {unknown} again!';
      const unknownTags = findUnknownTags(template);

      expect(unknownTags).toEqual(['unknown']);
    });
  });

  describe('validateTemplate', () => {
    it('should validate template with only known tags', () => {
      const template = 'Hello {fname}, you have {points} points in {program_name}.';
      const result = validateTemplate(template);

      expect(result.valid).toBe(true);
      expect(result.unknownTags).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('should invalidate template with unknown tags', () => {
      const template = 'Hello {fname}, you have {unknown_field} rewards.';
      const result = validateTemplate(template);

      expect(result.valid).toBe(false);
      expect(result.unknownTags).toEqual(['unknown_field']);
      expect(result.warnings).toEqual(['Unknown tags found: {unknown_field}']);
    });

    it('should handle templates with profile attributes', () => {
      const template = 'Your favorite player is {profile.favorite_player}.';
      const result = validateTemplate(template);

      expect(result.valid).toBe(true);
      expect(result.unknownTags).toEqual([]);
    });

    it('should handle templates with event-specific tags', () => {
      const template = 'You gained {points_delta} points! Total: {new_points}';
      const result = validateTemplate(template);

      expect(result.valid).toBe(true);
      expect(result.unknownTags).toEqual([]);
    });
  });
});