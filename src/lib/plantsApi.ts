import { apiUrl, ApiError } from './api'
import { dataUrlToFile } from './media'
import type { Plant, PlantDraft, PlantPhoto, PlantVideo } from '../types/plant'

function isRemoteMediaUrl(url: string): boolean {
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('/') ||
    url.includes('/mock/')
  )
}

async function parseJson<T>(response: Response, fallback: string): Promise<T> {
  if (response.status === 204) {
    return undefined as T
  }
  const payload = (await response.json().catch(() => null)) as
    | (T & { message?: string; errors?: Record<string, string[]> })
    | { message?: string; errors?: Record<string, string[]> }
    | null
  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload && payload.message
        ? payload.message
        : payload && typeof payload === 'object' && 'errors' in payload && payload.errors
          ? Object.values(payload.errors)[0]?.[0]
          : undefined
    throw new ApiError(message || fallback)
  }
  if (payload == null) {
    throw new ApiError(fallback)
  }
  return payload as T
}

export async function fetchPlants(): Promise<Plant[]> {
  let response: Response
  try {
    response = await fetch(apiUrl('/api/plants'), { headers: { Accept: 'application/json' } })
  } catch {
    throw new ApiError('Não foi possível conectar à API da Echevia.')
  }
  const payload = await parseJson<{ plants?: Plant[] }>(response, 'Não foi possível carregar as plantas.')
  return Array.isArray(payload.plants) ? payload.plants : []
}

export async function createPlant(plant: Plant): Promise<Plant> {
  let response: Response
  try {
    response = await fetch(apiUrl('/api/plants'), {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(plant),
    })
  } catch {
    throw new ApiError('Não foi possível salvar a planta.')
  }
  return parseJson<Plant>(response, 'Não foi possível salvar a planta.')
}

export async function updatePlant(plant: Plant): Promise<Plant> {
  let response: Response
  try {
    response = await fetch(apiUrl(`/api/plants/${plant.id}`), {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(plant),
    })
  } catch {
    throw new ApiError('Não foi possível atualizar a planta.')
  }
  return parseJson<Plant>(response, 'Não foi possível atualizar a planta.')
}

export async function deletePlant(id: string): Promise<void> {
  let response: Response
  try {
    response = await fetch(apiUrl(`/api/plants/${id}/delete`), {
      method: 'POST',
      headers: { Accept: 'application/json' },
    })
  } catch {
    throw new ApiError('Não foi possível excluir a planta.')
  }
  await parseJson(response, 'Não foi possível excluir a planta.')
}

export async function patchFavorite(id: string, favorite: boolean): Promise<Plant> {
  let response: Response
  try {
    response = await fetch(apiUrl(`/api/plants/${id}/favorite`), {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ favorite }),
    })
  } catch {
    throw new ApiError('Não foi possível atualizar o favorito.')
  }
  return parseJson<Plant>(response, 'Não foi possível atualizar o favorito.')
}

export type StorageUsage = {
  usedBytes: number
  limitBytes: number
}

export function formatStorageUsed(usedBytes: number): string {
  const mb = usedBytes / (1024 * 1024)
  const amount =
    mb < 1
      ? mb.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
      : Math.round(mb).toLocaleString('pt-BR')
  return `${amount} MB de 10GB`
}

export async function fetchStorageUsage(): Promise<StorageUsage> {
  let response: Response
  try {
    response = await fetch(apiUrl('/api/storage'), { headers: { Accept: 'application/json' } })
  } catch {
    throw new ApiError('Não foi possível consultar o armazenamento.')
  }
  const payload = await parseJson<Partial<StorageUsage>>(
    response,
    'Não foi possível consultar o armazenamento.',
  )
  return {
    usedBytes: typeof payload.usedBytes === 'number' ? payload.usedBytes : 0,
    limitBytes: typeof payload.limitBytes === 'number' ? payload.limitBytes : 10 * 1024 * 1024 * 1024,
  }
}

export async function uploadMedia(file: File, kind: 'photo' | 'video'): Promise<{ url: string; key: string }> {
  const body = new FormData()
  body.append('file', file)
  body.append('kind', kind)

  let response: Response
  try {
    response = await fetch(apiUrl('/api/media'), {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body,
    })
  } catch {
    throw new ApiError('Não foi possível enviar a mídia.')
  }

  return parseJson<{ url: string; key: string }>(response, 'Não foi possível enviar a mídia.')
}

export async function materializeMediaUrl(
  url: string,
  kind: 'photo' | 'video',
): Promise<{ url: string; key?: string | null }> {
  if (!url) return { url: '' }
  if (url.startsWith('data:')) {
    const filename = kind === 'video' ? 'video.mp4' : 'planta.jpg'
    return uploadMedia(dataUrlToFile(url, filename), kind)
  }
  if (url.startsWith('blob:')) {
    const blob = await fetch(url).then((response) => response.blob())
    const type = blob.type || (kind === 'video' ? 'video/mp4' : 'image/jpeg')
    const file = new File([blob], kind === 'video' ? 'video.mp4' : 'planta.jpg', { type })
    return uploadMedia(file, kind)
  }
  if (isRemoteMediaUrl(url)) return { url }
  return { url }
}

export async function preparePlantMedia(draft: PlantDraft): Promise<Pick<Plant, 'photos' | 'videos'>> {
  const photos: PlantPhoto[] = await Promise.all(
    draft.photos.map(async (photo) => {
      const remote = await materializeMediaUrl(photo.url, 'photo')
      return {
        ...photo,
        url: remote.url,
        key: remote.key ?? photo.key ?? null,
      }
    }),
  )

  const videos: PlantVideo[] = await Promise.all(
    draft.videos.map(async (video) => {
      const remote = await materializeMediaUrl(video.url, 'video')
      let posterUrl = video.posterUrl
      let posterKey = video.posterKey ?? null
      if (posterUrl.startsWith('data:') || posterUrl.startsWith('blob:')) {
        const poster = await materializeMediaUrl(posterUrl, 'photo')
        posterUrl = poster.url
        posterKey = poster.key ?? null
      }
      return {
        ...video,
        url: remote.url,
        key: remote.key ?? video.key ?? null,
        posterUrl,
        posterKey,
      }
    }),
  )

  return { photos, videos }
}
