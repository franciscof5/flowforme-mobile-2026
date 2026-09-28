export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / Math.pow(1024, exponent);
  const decimals = value >= 10 || exponent === 0 ? 0 : 1;

  return `${value.toFixed(decimals)} ${units[exponent]}`;
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'Data desconhecida';

  const day = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const time = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${day} às ${time}`;
}
