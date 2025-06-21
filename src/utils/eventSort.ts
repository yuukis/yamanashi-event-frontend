export function sortByStartedAtAsc(a: any, b: any) {
  return new Date(a.started_at).getTime() - new Date(b.started_at).getTime();
}

export function sortByStartedAtDesc(a: any, b: any) {
  return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
}