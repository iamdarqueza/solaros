/**
 * Converts minutes to a human-readable format (hours and minutes)
 * @param minutes - Duration in minutes
 * @returns Formatted string like "2h 30m" or "45m" or "0m"
 */
export function formatDuration(minutes: number): string {
  if (!minutes || minutes < 0) return '0m';
  
  const roundedMinutes = Math.round(minutes);
  
  if (roundedMinutes < 60) {
    return `${roundedMinutes}m`;
  }
  
  const hours = Math.floor(roundedMinutes / 60);
  const remainingMinutes = roundedMinutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Converts minutes to a more verbose human-readable format
 * @param minutes - Duration in minutes
 * @returns Formatted string like "2 hours 30 minutes" or "45 minutes"
 */
export function formatDurationVerbose(minutes: number): string {
  if (!minutes || minutes < 0) return '0 minutes';
  
  const roundedMinutes = Math.round(minutes);
  
  if (roundedMinutes < 60) {
    return roundedMinutes === 1 ? '1 minute' : `${roundedMinutes} minutes`;
  }
  
  const hours = Math.floor(roundedMinutes / 60);
  const remainingMinutes = roundedMinutes % 60;
  
  const hourText = hours === 1 ? '1 hour' : `${hours} hours`;
  
  if (remainingMinutes === 0) {
    return hourText;
  }
  
  const minuteText = remainingMinutes === 1 ? '1 minute' : `${remainingMinutes} minutes`;
  return `${hourText} ${minuteText}`;
} 