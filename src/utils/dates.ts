export function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
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
