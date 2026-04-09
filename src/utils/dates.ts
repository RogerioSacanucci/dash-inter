export function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function formatDateWithOffset(iso: string, utcOffset?: number): { date: string; time: string } {
  const offset = utcOffset ?? getStoredUtcOffset();
  const adjusted = new Date(new Date(iso).getTime() + offset * 60 * 60 * 1000);
  const date = adjusted.toLocaleDateString('pt-PT', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = adjusted.toLocaleTimeString('pt-PT', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

export function getStoredUtcOffset(): number {
  const stored = localStorage.getItem('utc_offset');
  if (stored !== null) {
    const parsed = Number(stored);
    if (!Number.isNaN(parsed) && parsed >= -12 && parsed <= 14) return parsed;
  }
  return -3;
}

export function periodToDates(value: string, utcOffset: number = 0): { from: string; to: string } {
  const now = new Date(Date.now() + utcOffset * 60 * 60 * 1000);
  const toStr = (d: Date) => d.toISOString().slice(0, 10);

  if (value === 'today') {
    const s = toStr(now);
    return { from: s, to: s };
  }
  if (value === 'yesterday') {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return { from: toStr(y), to: toStr(y) };
  }
  if (value === '7d') {
    const f = new Date(now);
    f.setDate(f.getDate() - 6);
    return { from: toStr(f), to: toStr(now) };
  }
  if (value === '30d') {
    const f = new Date(now);
    f.setDate(f.getDate() - 29);
    return { from: toStr(f), to: toStr(now) };
  }
  return { from: '', to: '' };
}
