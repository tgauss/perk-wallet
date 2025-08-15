import { supabase } from './supabase';
import { ParticipantSnapshot } from './perk/normalize';
import { resolveTags, replaceTags, MergeTagContext } from './mergeTags';

// Notification rule types
export type NotificationRule = 'manual' | 'points_updated' | 'reward_earned' | 'location_enter';

export interface NotificationEvent {
  id: string;
  program_id: string;
  participant_uuid: string;
  rule: NotificationRule;
  data: {
    points_before?: number;
    points_after?: number;
    unused_points_before?: number;
    unused_points_after?: number;
    reward?: any;
    location?: any;
    [key: string]: any;
  };
  timestamp: string;
}

export interface NotificationBuffer {
  participant_uuid: string;
  rule: NotificationRule;
  events: NotificationEvent[];
  first_event_time: string;
  last_event_time: string;
  merge_window_ends: string;
}

export interface NotificationSettings {
  merge_window_sec?: number; // Default 120
  throttle_sec?: number; // Default 300
  points_display?: 'points' | 'unused_points'; // Default 'unused_points'
}

// In-memory buffer for merging events
const eventBuffer = new Map<string, NotificationBuffer>();

// Track last notification sent per participant+rule for throttling
const lastNotificationSent = new Map<string, string>();

function getBufferKey(participant_uuid: string, rule: NotificationRule): string {
  return `${participant_uuid}:${rule}`;
}

function getThrottleKey(participant_uuid: string, rule: NotificationRule): string {
  return `${participant_uuid}:${rule}`;
}

/**
 * Queue a notification event for processing
 * Events are buffered and merged within the merge window
 */
export async function queueNotificationEvent(event: NotificationEvent, settings?: NotificationSettings) {
  const mergeWindow = settings?.merge_window_sec || 120;
  const bufferKey = getBufferKey(event.participant_uuid, event.rule);
  
  const now = new Date();
  const mergeWindowEnds = new Date(now.getTime() + mergeWindow * 1000).toISOString();
  
  let buffer = eventBuffer.get(bufferKey);
  
  if (!buffer) {
    // Create new buffer
    buffer = {
      participant_uuid: event.participant_uuid,
      rule: event.rule,
      events: [event],
      first_event_time: event.timestamp,
      last_event_time: event.timestamp,
      merge_window_ends: mergeWindowEnds,
    };
    eventBuffer.set(bufferKey, buffer);
    
    // Schedule flush after merge window
    setTimeout(() => {
      flushBuffer(bufferKey, settings);
    }, mergeWindow * 1000);
  } else {
    // Add to existing buffer if within merge window
    const bufferEnds = new Date(buffer.merge_window_ends);
    if (now < bufferEnds) {
      buffer.events.push(event);
      buffer.last_event_time = event.timestamp;
    } else {
      // Buffer expired, flush it and create new one
      await flushBuffer(bufferKey, settings);
      
      // Create new buffer for this event
      buffer = {
        participant_uuid: event.participant_uuid,
        rule: event.rule,
        events: [event],
        first_event_time: event.timestamp,
        last_event_time: event.timestamp,
        merge_window_ends: mergeWindowEnds,
      };
      eventBuffer.set(bufferKey, buffer);
      
      // Schedule flush
      setTimeout(() => {
        flushBuffer(bufferKey, settings);
      }, mergeWindow * 1000);
    }
  }
}

/**
 * Flush a buffer and send the merged notification
 */
export async function flushBuffer(bufferKey: string, settings?: NotificationSettings) {
  const buffer = eventBuffer.get(bufferKey);
  if (!buffer || buffer.events.length === 0) {
    eventBuffer.delete(bufferKey);
    return;
  }
  
  const throttle = settings?.throttle_sec || 300;
  const throttleKey = getThrottleKey(buffer.participant_uuid, buffer.rule);
  
  // Check throttle
  const lastSent = lastNotificationSent.get(throttleKey);
  if (lastSent) {
    const lastSentTime = new Date(lastSent);
    const now = new Date();
    const timeSinceLast = (now.getTime() - lastSentTime.getTime()) / 1000;
    
    if (timeSinceLast < throttle) {
      console.log(`Throttled notification for ${throttleKey}. Last sent ${timeSinceLast}s ago, throttle is ${throttle}s`);
      eventBuffer.delete(bufferKey);
      return;
    }
  }
  
  // Process the merged events
  if (buffer.rule === 'points_updated') {
    await sendPointsUpdatedNotification(buffer, settings);
  } else {
    // Handle other notification types
    await sendGenericNotification(buffer);
  }
  
  // Update throttle tracker
  lastNotificationSent.set(throttleKey, new Date().toISOString());
  
  // Clear buffer
  eventBuffer.delete(bufferKey);
}

/**
 * Send a points_updated notification with merged data
 */
async function sendPointsUpdatedNotification(buffer: NotificationBuffer, settings?: NotificationSettings) {
  const pointsDisplay = settings?.points_display || 'unused_points';
  
  // Calculate total delta from all events
  let totalDelta = 0;
  let pointsBefore = 0;
  let pointsAfter = 0;
  
  if (buffer.events.length > 0) {
    const firstEvent = buffer.events[0];
    const lastEvent = buffer.events[buffer.events.length - 1];
    
    if (pointsDisplay === 'unused_points') {
      pointsBefore = firstEvent.data.unused_points_before || 0;
      pointsAfter = lastEvent.data.unused_points_after || 0;
    } else {
      pointsBefore = firstEvent.data.points_before || 0;
      pointsAfter = lastEvent.data.points_after || 0;
    }
    
    totalDelta = pointsAfter - pointsBefore;
  }
  
  // Get participant and program data for merge tags
  const { data: participant } = await supabase
    .from('participants')
    .select('*')
    .eq('program_id', buffer.program_id)
    .eq('perk_participant_id', buffer.participant_id)
    .single();
  
  if (!participant) {
    console.error(`Participant not found: ${buffer.participant_uuid}`);
    return;
  }
  
  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('id', participant.program_id)
    .single();
  
  // Create notification message with merge tags
  const context: MergeTagContext = {
    snapshot: {
      perk_participant_id: parseInt(participant.perk_participant_id),
      perk_participant_id: participant.perk_participant_id,
      email: participant.email,
      points: participant.points,
      unused_points: participant.unused_points,
      status: participant.status,
      tier: participant.tier,
      fname: participant.fname,
      lname: participant.lname,
      tag_list: participant.tag_list || [],
      profile: participant.profile_attributes || {},
    },
    program: program ? {
      id: program.id,
      name: program.name,
      settings: program.settings,
    } : undefined,
    pointsDelta: totalDelta,
    newPoints: pointsAfter,
  };
  
  const tags = resolveTags(context);
  
  // Default message template
  let messageTemplate = 'Your points have been updated! You gained {points_delta} points. New balance: {new_points}';
  
  // TODO: Get custom template from notification rules
  
  const message = replaceTags(messageTemplate, tags);
  
  console.log(`📧 Sending notification to ${participant.email}: ${message}`);
  console.log(`   Merged ${buffer.events.length} events from ${buffer.first_event_time} to ${buffer.last_event_time}`);
  
  // TODO: Actually send the notification (email, push, etc.)
  // For now, just log it and record in jobs table
  await supabase
    .from('jobs')
    .insert({
      type: 'notification_sent',
      status: 'completed',
      payload: {
        participant_uuid: buffer.participant_uuid,
        rule: buffer.rule,
        message,
        events_merged: buffer.events.length,
        points_delta: totalDelta,
        new_points: pointsAfter,
      },
      result: { sent: true },
      attempts: 1,
      max_attempts: 1,
      scheduled_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });
}

/**
 * Send a generic notification for other rule types
 */
async function sendGenericNotification(buffer: NotificationBuffer) {
  console.log(`📧 Sending ${buffer.rule} notification for participant ${buffer.participant_uuid}`);
  console.log(`   Events: ${buffer.events.length}`);
  
  // TODO: Implement other notification types
  await supabase
    .from('jobs')
    .insert({
      type: 'notification_sent',
      status: 'completed',
      payload: {
        participant_uuid: buffer.participant_uuid,
        rule: buffer.rule,
        events_merged: buffer.events.length,
      },
      result: { sent: true },
      attempts: 1,
      max_attempts: 1,
      scheduled_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });
}

/**
 * Flush all pending notifications (for testing or shutdown)
 */
export async function flushAllNotifications(settings?: NotificationSettings) {
  const keys = Array.from(eventBuffer.keys());
  for (const key of keys) {
    await flushBuffer(key, settings);
  }
}