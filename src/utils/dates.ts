export function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function periodToDates(value: string): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (value === 'today') {
    const s = toDateStr(today);
    return { from: s, to: s };
  }
  if (value === 'yesterday') {
    const y = new Date(today); y.setDate(y.getDate() - 1);
    const s = toDateStr(y);
    return { from: s, to: s };
  }
  if (value === '7d') {
    const f = new Date(today); f.setDate(f.getDate() - 6);
    return { from: toDateStr(f), to: toDateStr(today) };
  }
  if (value === '30d') {
    const f = new Date(today); f.setDate(f.getDate() - 29);
    return { from: toDateStr(f), to: toDateStr(today) };
  }
  return { from: '', to: '' };
}
