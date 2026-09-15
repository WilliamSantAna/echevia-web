export function createId(): string {
  return crypto.randomUUID()
}

export function slugifyIdentification(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
}
