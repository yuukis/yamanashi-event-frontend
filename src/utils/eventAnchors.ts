export function formatEventDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getEventDateAnchorId(dateKey: string): string {
  return `event-${dateKey.replace(/-/g, '')}`;
}

export function getEventAnchorId(uid: string): string {
  return `event-item-${uid}`;
}
