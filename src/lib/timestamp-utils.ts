/**
 * Comprehensive timestamp utilities for audit log display
 * Handles various timestamp formats from different API sources
 */

export interface TimestampInfo {
  relative: string;
  absolute: string;
  iso: string;
  isValid: boolean;
  error?: string;
}

/**
 * Parse various timestamp formats into a standardized Date object
 */
export function parseTimestamp(timestamp: any): Date | null {
  if (!timestamp) return null;
  
  try {
    // Handle null, undefined, empty string
    if (timestamp === null || timestamp === undefined || timestamp === '') {
      return null;
    }
    
    // Handle already parsed Date objects
    if (timestamp instanceof Date) {
      return isNaN(timestamp.getTime()) ? null : timestamp;
    }
    
    // Convert to string for parsing
    const timestampStr = String(timestamp).trim();
    
    // Handle common invalid values
    if (timestampStr === 'null' || timestampStr === 'undefined' || timestampStr === '0') {
      return null;
    }
    
    // Try parsing different formats
    let date: Date;
    
    // Format 1: MySQL datetime format "YYYY-MM-DD HH:mm:ss"
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d{3})?$/.test(timestampStr)) {
      // MySQL datetime is typically in server timezone, assume UTC for consistency
      date = new Date(timestampStr + (timestampStr.includes('.') ? 'Z' : '.000Z'));
    }
    // Format 2: ISO 8601 with timezone
    else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?[Z+-]/.test(timestampStr)) {
      date = new Date(timestampStr);
    }
    // Format 3: ISO 8601 without timezone (assume UTC)
    else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?$/.test(timestampStr)) {
      date = new Date(timestampStr + 'Z');
    }
    // Format 4: Unix timestamp (seconds)
    else if (/^\d{10}$/.test(timestampStr)) {
      date = new Date(parseInt(timestampStr) * 1000);
    }
    // Format 5: Unix timestamp (milliseconds)
    else if (/^\d{13}$/.test(timestampStr)) {
      date = new Date(parseInt(timestampStr));
    }
    // Format 6: Try native Date parsing as fallback
    else {
      date = new Date(timestampStr);
    }
    
    // Validate the parsed date
    if (isNaN(date.getTime())) {
      return null;
    }
    
    // Sanity check: reject dates too far in the past or future
    const now = new Date();
    const yearsDiff = Math.abs(now.getFullYear() - date.getFullYear());
    if (yearsDiff > 10) {
      return null;
    }
    
    return date;
    
  } catch (error) {
    return null;
  }
}

/**
 * Format a date as a relative time string (e.g., "2h ago", "3d ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  // Handle future dates
  if (diffMs < 0) {
    const futureDiffMs = Math.abs(diffMs);
    const futureMins = Math.floor(futureDiffMs / (1000 * 60));
    const futureHours = Math.floor(futureMins / 60);
    const futureDays = Math.floor(futureHours / 24);
    
    if (futureMins < 1) return 'just now';
    if (futureMins < 60) return `in ${futureMins}m`;
    if (futureHours < 24) return `in ${futureHours}h`;
    if (futureDays < 7) return `in ${futureDays}d`;
    return `in ${Math.floor(futureDays / 7)}w`;
  }
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  if (diffSecs < 30) return 'just now';
  if (diffSecs < 60) return 'less than 1m ago';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${diffYears}y ago`;
}

/**
 * Format a date as an absolute time string for display
 */
export function formatAbsoluteTime(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === date.toDateString();
  const isThisYear = date.getFullYear() === now.getFullYear();
  
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  if (isToday) {
    return `Today at ${timeStr}`;
  }
  
  if (isYesterday) {
    return `Yesterday at ${timeStr}`;
  }
  
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: isThisYear ? undefined : 'numeric'
  });
  
  return `${dateStr} at ${timeStr}`;
}

/**
 * Get comprehensive timestamp information for display
 */
export function getTimestampInfo(timestamp: any): TimestampInfo {
  const date = parseTimestamp(timestamp);
  
  if (!date) {
    return {
      relative: 'unknown',
      absolute: 'Invalid date',
      iso: '',
      isValid: false,
      error: 'Could not parse timestamp'
    };
  }
  
  return {
    relative: formatRelativeTime(date),
    absolute: formatAbsoluteTime(date),
    iso: date.toISOString(),
    isValid: true
  };
}

/**
 * Validate if a timestamp is recent (within last 24 hours)
 */
export function isRecentTimestamp(timestamp: any): boolean {
  const date = parseTimestamp(timestamp);
  if (!date) return false;
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return diffMs >= 0 && diffMs < (24 * 60 * 60 * 1000);
}

/**
 * Get a debug string for timestamp troubleshooting
 */
export function debugTimestamp(timestamp: any): string {
  const info = getTimestampInfo(timestamp);
  return `Input: ${JSON.stringify(timestamp)} | Valid: ${info.isValid} | Relative: ${info.relative} | ISO: ${info.iso}`;
}