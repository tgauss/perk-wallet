import { flushBuffer, flushAllNotifications } from './notify';

/**
 * Background worker to flush notification buffers
 * This can be called periodically to ensure buffers are flushed
 */
export async function runNotificationFlush() {
  console.log('🔄 Running notification flush...');
  
  try {
    await flushAllNotifications();
    console.log('✅ Notification flush completed');
  } catch (error) {
    console.error('❌ Notification flush failed:', error);
    throw error;
  }
}

/**
 * Schedule periodic flush (e.g., every 30 seconds)
 */
export function schedulePeriodicFlush(intervalMs: number = 30000) {
  setInterval(async () => {
    await runNotificationFlush();
  }, intervalMs);
  
  console.log(`📅 Scheduled notification flush every ${intervalMs}ms`);
}