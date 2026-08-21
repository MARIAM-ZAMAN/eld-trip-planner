// src/utils/time.js
// Shared time-formatting utilities used across scheduling components.

/**
 * Formats a duration given in minutes into a human-readable "Xh Ym" string.
 * @param {number} minutes - Total minutes (fractional values are truncated/rounded).
 * @returns {string}  e.g. "2h 30m"
 */
export function formatMinutesToHM(minutes = 0) {
  const m = Math.max(0, Math.round(minutes));
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

/**
 * Formats a duration given in minutes into a verbose "X hr Y min" string.
 * Used in ELD log cards where the longer label is desired.
 * @param {number} minutes
 * @returns {string}  e.g. "2 hr 30 min"
 */
export function formatMinutesToHrMin(minutes = 0) {
  const m = Math.max(0, Math.round(minutes));
  return `${Math.floor(m / 60)} hr ${m % 60} min`;
}

/**
 * Formats a fractional-hours value into "Xh Ym".
 * @param {number} hours  e.g. 2.5
 * @returns {string}  e.g. "2h 30m"
 */
export function formatHoursHM(hours = 0) {
  return formatMinutesToHM(hours * 60);
}

/**
 * Formats a minute-of-day into a zero-padded HH:MM clock string.
 * @param {number} minuteOfDay  0–1440
 * @returns {string}  e.g. "14:05"
 */
export function minuteToHHMM(minuteOfDay = 0) {
  const m = Math.max(0, Math.round(minuteOfDay));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
