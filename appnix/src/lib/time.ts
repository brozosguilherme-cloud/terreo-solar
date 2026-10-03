export function timeAgo(date: Date | null | undefined, now = new Date()): string {
  if (!date) return 'agora';
  const s = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  if (s < 60) return 'agora';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w} sem`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function formatPoints(n: number): string {
  return n.toLocaleString('pt-BR');
}

export function startOfWeek(now = new Date()): Date {
  const d = new Date(now);
  const day = (d.getDay() + 6) % 7; // segunda-feira = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}
