export function formatIsraelDateTime(isoDate: string): string {
  const date = new Date(isoDate);

  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jerusalem"
  }).format(date);
}
