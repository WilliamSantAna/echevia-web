export function plantSharePath(identification: string): string {
  return `/p/${encodeURIComponent(identification)}`
}

export function plantShareUrl(identification: string): string {
  return `${window.location.origin}${plantSharePath(identification)}`
}

export async function sharePlant(
  name: string,
  identification: string,
): Promise<'shared' | 'copied' | 'cancelled'> {
  const url = plantShareUrl(identification)
  const payload = {
    title: `${name} · Echevia`,
    text: `Olha essa suculenta na Echevia: ${name}`,
    url,
  }

  if (navigator.share) {
    try {
      await navigator.share(payload)
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled'
      }
    }
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(`${payload.text}\n${url}`)
    return 'copied'
  }

  throw new Error('Compartilhamento indisponível neste dispositivo')
}