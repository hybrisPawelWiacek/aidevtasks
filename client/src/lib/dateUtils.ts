import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, parseISO, formatDistance } from "date-fns";

export function formatDate(dateString: string): string {
  try {
    const date = parseISO(dateString);

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
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return dateString;
  }
}

export function isDateInPast(dateString: string): boolean {
  try {
    const date = parseISO(dateString);
    return date < new Date();
  } catch (error) {
    return false;
  }
}

export function formatDateForInput(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, "yyyy-MM-dd");
  } catch (error) {
    return dateString;
  }
}

export function formatDateRelative(date: string | Date): string {
  if (!date) return "";
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true });
}