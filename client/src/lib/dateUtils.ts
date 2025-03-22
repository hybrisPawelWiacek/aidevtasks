import { format, formatDistanceToNow, isToday, isYesterday, isTomorrow } from 'date-fns';

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);

    if (isToday(date)) {
      return `Today`;
    }

    if (isTomorrow(date)) {
      return `Tomorrow`;
    }

    if (isYesterday(date)) {
      return `Yesterday`;
    }

    return format(date, "MMM d, yyyy");
  } catch (error) {
    // Return the original string if parsing fails
    return dateString;
  }
}

export function formatRelativeDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return dateString;
  }
}

export function isDateInPast(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return date < new Date();
  } catch (error) {
    return false;
  }
}

export function formatDateForInput(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, "yyyy-MM-dd");
  } catch (error) {
    return dateString;
  }
}

export function formatDateRelative(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isToday(dateObj)) {
    return 'Today';
  } else if (isYesterday(dateObj)) {
    return 'Yesterday';
  } else if (isTomorrow(dateObj)) {
    return 'Tomorrow';
  } else {
    return format(dateObj, 'MMM d');
  }
}