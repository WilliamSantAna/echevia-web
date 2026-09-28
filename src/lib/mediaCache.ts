import type { Plant } from '../types/plant'

export const MEDIA_CACHE = 'echevia-media-v1'
export const PREFETCH_SPAN = 2

function isCacheable(url: string): boolean {
  return Boolean(url) && !url.startsWith('data:') && !url.startsWith('blob:')
}

function isLikelyImage(url: string): boolean {
  return /\.(jpe?g|png|webp|gif|avif|svg)(\?|$)/i.test(url) || url.includes('/plants/photo')
}

export function plantImageUrls(plant: Plant): string[] {
  return [
    ...plant.photos.map((photo) => photo.url),
    ...plant.videos.map((video) => video.posterUrl),
  ].filter(isCacheable)
}

function decodeImage(url: string) {
  const image = new Image()
  image.decoding = 'async'
  image.src = url
  void image.decode?.().catch(() => undefined)
}

async function putInCache(url: string) {
  if (!('caches' in window)) {
    decodeImage(url)
    return
  }
  try {
    const cache = await caches.open(MEDIA_CACHE)
    if (await cache.match(url)) return
    const response = await fetch(url, { credentials: 'omit', mode: 'cors' })
    if (response.ok) {
      await cache.put(url, response)
      return
    }
  } catch {
    // CORS or offline: still warm the HTTP cache.
  }
  if (isLikelyImage(url)) decodeImage(url)
}

export function prefetchUrls(urls: string[], decode = false) {
  const unique = [...new Set(urls.filter(isCacheable))]
  for (const url of unique) {
    void putInCache(url)
    if (decode && isLikelyImage(url)) decodeImage(url)
  }
}

export function nearbyPlants(plants: Plant[], currentId: string, span = PREFETCH_SPAN): Plant[] {
  if (plants.length === 0) return []
  const index = plants.findIndex((plant) => plant.id === currentId)
  if (index < 0) return plants.slice(0, span * 2 + 1)
  const count = plants.length
  const nearby: Plant[] = []
  for (let offset = -span; offset <= span; offset += 1) {
    nearby.push(plants[((index + offset) % count + count) % count])
  }
  return nearby
}

export function prefetchNearbyPlantMedia(plants: Plant[], currentId: string, span = PREFETCH_SPAN) {
  prefetchUrls(nearbyPlants(plants, currentId, span).flatMap(plantImageUrls), true)
  prefetchUrls(nearbyPlants(plants, currentId, span + 2).flatMap(plantImageUrls), false)
}

export async function cacheAllPlantImages(plants: Plant[]) {
  const urls = [...new Set(plants.flatMap(plantImageUrls))]
  for (let index = 0; index < urls.length; index += 3) {
    await Promise.all(urls.slice(index, index + 3).map(putInCache))
  }
}
