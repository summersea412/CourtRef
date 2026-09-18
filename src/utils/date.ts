export function formatDateTime(value: string): string {
  const date = new Date(value);
  const now = new Date();
  const time = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(date);
  if (date.toDateString() === now.toDateString()) return `今天 ${time}`;
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `昨天 ${time}`;
  return `${new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' }).format(date)} ${time}`;
}
