/**
 * Analytics service – sends errors, accuracy, and events to Supabase.
 * Used by Admin Dashboard for error analysis, accuracy tracking, dataset monitoring, user behavior.
 * All calls are fire-and-forget (non-blocking); failures are logged only.
 */
import {getSupabase, getCurrentUser} from '../lib/supabase';

const SOURCE_APP = 'app';

export type ErrorSource = 'app' | 'backend' | 'ocr' | 'sync';

/** Log an error for admin error analysis */
export async function logError(
  source: ErrorSource,
  message: string,
  errorCode?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const user = await getCurrentUser();
    const supabase = getSupabase();
    if (!supabase) return;
    const {error} = await supabase.from('analytics_errors').insert({
      user_id: user?.id ?? null,
      source,
      error_code: errorCode ?? null,
      message,
      metadata: metadata ?? {},
    });
    if (error) console.warn('[Analytics] logError failed:', error.message);
  } catch (e) {
    console.warn('[Analytics] logError exception:', e);
  }
}

/** Log accuracy metric (OCR confidence, edit distance, etc.) */
export async function logAccuracy(
  metricName: string,
  value: number,
  noteId?: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const user = await getCurrentUser();
    const supabase = getSupabase();
    if (!supabase) return;
    const {error} = await supabase.from('analytics_accuracy').insert({
      user_id: user?.id ?? null,
      note_id: noteId ?? null,
      metric_name: metricName,
      value,
      metadata: metadata ?? {},
    });
    if (error) console.warn('[Analytics] logAccuracy failed:', error.message);
  } catch (e) {
    console.warn('[Analytics] logAccuracy exception:', e);
  }
}

/** Log user behavior event */
export async function logEvent(
  eventName: string,
  payload?: Record<string, unknown>,
): Promise<void> {
  try {
    const user = await getCurrentUser();
    const supabase = getSupabase();
    if (!supabase) return;
    const {error} = await supabase.from('analytics_events').insert({
      user_id: user?.id ?? null,
      event_name: eventName,
      payload: payload ?? {},
    });
    if (error) console.warn('[Analytics] logEvent failed:', error.message);
  } catch (e) {
    console.warn('[Analytics] logEvent exception:', e);
  }
}

/** Fire-and-forget wrappers so UI never waits */
export function trackError(
  source: ErrorSource,
  message: string,
  errorCode?: string,
  metadata?: Record<string, unknown>,
): void {
  logError(source, message, errorCode, metadata).catch(() => {});
}

export function trackAccuracy(
  metricName: string,
  value: number,
  noteId?: string | null,
  metadata?: Record<string, unknown>,
): void {
  logAccuracy(metricName, value, noteId, metadata).catch(() => {});
}

export function trackEvent(eventName: string, payload?: Record<string, unknown>): void {
  logEvent(eventName, payload).catch(() => {});
}
