export function formatEventDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getEventDateAnchorId(dateKey: string): string {
  return `date-${dateKey.replace(/-/g, '')}`;
}

// uidはconnpassのメールアドレス風IDやアーカイブ元の長いslugなど
// 長さがまちまちで、そのまま使うと共有URLが長くなりすぎる。
// FNV-1aハッシュをbase36化した短い固定長の文字列に変換して使う。
function hashUid(uid: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < uid.length; i++) {
    hash ^= uid.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

export function getEventAnchorId(uid: string): string {
  return `event-${hashUid(uid)}`;
}
