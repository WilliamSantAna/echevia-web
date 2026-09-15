const formatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function formatDate(iso: string): string {
  return formatter.format(new Date(iso)).replace('.', '')
}

export function nowIso(): string {
  return new Date().toISOString()
}
