import type { PlantVideo } from '../types/plant'

const DEVICE_POSTERS_KEY = 'echevia.video-posters.v1'

function readAll(): Record<string, string> {
  try {
    const raw = localStorage.getItem(DEVICE_POSTERS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(posters: Record<string, string>) {
  try {
    localStorage.setItem(DEVICE_POSTERS_KEY, JSON.stringify(posters))
  } catch {
    // Quota: R2 remains the durable copy.
  }
}

export function isStoredPoster(url?: string | null): boolean {
  if (!url) return false
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:image/') ||
    url.startsWith('/') ||
    url.startsWith('blob:')
  )
}

export function readDevicePoster(videoId: string): string {
  if (!videoId) return ''
  return readAll()[videoId] ?? ''
}

export function writeDevicePoster(videoId: string, url: string) {
  if (!videoId || !url) return
  const posters = readAll()
  if (posters[videoId] === url) return
  posters[videoId] = url
  writeAll(posters)
}

export function clearDevicePoster(videoId: string) {
  if (!videoId) return
  const posters = readAll()
  if (!(videoId in posters)) return
  delete posters[videoId]
  writeAll(posters)
}

export function videoPosterSrc(video: Pick<PlantVideo, 'id' | 'posterUrl'>): string {
  if (isStoredPoster(video.posterUrl) && !video.posterUrl.startsWith('blob:')) {
    return video.posterUrl
  }
  return readDevicePoster(video.id)
}
