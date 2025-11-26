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
