/**
 * Formats the clock part of a timestamp.
 *
 * English (US) reads a 12-hour clock with an AM/PM marker, while the Chinese
 * UI expects a 24-hour clock — showing "6:36:04 早上" reads as untranslated.
 */
export function timeFormatFor(locale: string, withSeconds = true) {
  const uses24HourClock = locale === "zh-CN";
  if (withSeconds) return uses24HourClock ? "HH:mm:ss" : "h:mm:ss A";
  return uses24HourClock ? "HH:mm" : "h:mm A";
}
