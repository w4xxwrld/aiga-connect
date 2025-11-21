/**
 * Timezone utility functions
 */

/**
 * Get the device's timezone as an IANA timezone string
 * @returns IANA timezone string (e.g., "Asia/Almaty", "America/New_York")
 */
export const getDeviceTimezone = (): string => {
  try {
    // Try to get timezone using Intl API (works in modern JavaScript environments)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (timezone) {
      return timezone;
    }

    // Fallback to UTC if unable to detect
    console.warn('Unable to detect device timezone, falling back to UTC');
    return 'UTC';
  } catch (error) {
    console.error('Error detecting timezone:', error);
    return 'UTC';
  }
};

/**
 * Get current date and time in the device's timezone
 * @returns Current Date object
 */
export const getCurrentDateTimeInDeviceTimezone = (): Date => {
  return new Date();
};

/**
 * Format timezone for display
 * @param timezone IANA timezone string
 * @returns Formatted timezone string
 */
export const formatTimezone = (timezone: string): string => {
  try {
    const date = new Date();
    const offset = date.toLocaleString('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    return offset;
  } catch (error) {
    return timezone;
  }
};

/**
 * Get timezone offset in hours
 * @param timezone IANA timezone string
 * @returns Offset in hours (e.g., +6 for Asia/Almaty)
 */
export const getTimezoneOffset = (timezone: string): number => {
  try {
    const date = new Date();
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
  } catch (error) {
    return 0;
  }
};
