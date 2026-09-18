import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { relocateMockVideoUrl, withoutSeedPlants } from '../data/seed'
import { nowIso } from '../lib/dates'
import { createId } from '../lib/id'
import { isHttpUrl, captureVideoPoster } from '../lib/media'
import {
  createPlant,
  deletePlant,
  fetchPlants,
  materializeMediaUrl,
  patchFavorite,
  preparePlantMedia,
  updatePlant,
} from '../lib/plantsApi'
import { isStoredPoster, readDevicePoster, writeDevicePoster } from '../lib/videoPoster'
import type { Plant, PlantDraft } from '../types/plant'

const STORAGE_KEY = 'echevia.plants.v6'

function relocateMockAsset(url: string): string {
  if (!url.startsWith('/mock/')) return url
  return `${import.meta.env.BASE_URL}${url.replace(/^\//, '')}`
}

function normalizePlants(plants: Plant[]): Plant[] {
  return plants.map((plant) => ({
    ...plant,
    photos: plant.photos.map((photo) => ({
      ...photo,
      url: relocateMockAsset(photo.url),
    })),
    videos: plant.videos.map((video) => ({
      ...video,
      url: relocateMockVideoUrl(video.url),
      posterUrl: relocateMockAsset(video.posterUrl),
    })),
  }))
}

function loadPlants(): Plant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Plant[]
    if (!Array.isArray(parsed)) return []
    return withoutSeedPlants(normalizePlants(parsed))
  } catch {
    return []
  }
}

function persist(plants: Plant[]) {
  const serializable = plants.map((plant) => ({
    ...plant,
    videos: plant.videos.filter(
      (video) => isHttpUrl(video.url) || video.url.includes('/mock/'),
    ),
  }))
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
  } catch {
    // Quota: cache is best-effort after media lives on R2.
  }
}

async function persistVideoPoster(video: Plant['videos'][number]): Promise<Plant['videos'][number] | null> {
  if (isStoredPoster(video.posterUrl) && isHttpUrl(video.posterUrl)) return null

  let poster = isStoredPoster(video.posterUrl) ? video.posterUrl : readDevicePoster(video.id)
  if (!poster) {
    poster = await captureVideoPoster(video.url)
    if (poster) writeDevicePoster(video.id, poster)
  }
  if (!poster) return null
  if (isHttpUrl(poster)) {
    return poster === video.posterUrl ? null : { ...video, posterUrl: poster }
  }

  const remote = await materializeMediaUrl(poster, 'photo')
  if (!remote.url) return null
  writeDevicePoster(video.id, remote.url)
  return {
    ...video,
    posterUrl: remote.url,
    posterKey: remote.key ?? video.posterKey ?? null,
  }
}

function plantsSignature(plants: Plant[]): string {
  return JSON.stringify(
    plants.map((plant) => ({
      id: plant.id,
      name: plant.name,
      species: plant.species,
      botanicalFamily: plant.botanicalFamily,
      identification: plant.identification,
      notes: plant.notes,
      favorite: plant.favorite,
      updatedAt: plant.updatedAt,
      photos: plant.photos.map((photo) => [photo.id, photo.url, photo.isMain]),
      videos: plant.videos.map((video) => [video.id, video.url, video.posterUrl]),
    })),
  )
}

type PlantsContextValue = {
  plants: Plant[]
  photoCount: number
  videoCount: number
  getById: (id: string) => Plant | undefined
  getByIdentification: (identification: string) => Plant | undefined
  identificationTaken: (identification: string, ignoreId?: string) => boolean
  toggleFavorite: (id: string) => void
  savePlant: (draft: PlantDraft, id?: string) => Promise<Plant>
  removePlant: (id: string) => void
  refreshPlants: () => Promise<void>
}

const PlantsContext = createContext<PlantsContextValue | null>(null)

export function PlantsProvider({ children }: { children: ReactNode }) {
  const [plants, setPlants] = useState<Plant[]>(loadPlants)
  const refreshGen = useRef(0)
  const posterJobs = useRef(new Set<string>())

  const refreshPlants = useCallback(async () => {
    const gen = ++refreshGen.current
    try {
      const remote = await fetchPlants()
      if (gen !== refreshGen.current) return
      const next = withoutSeedPlants(normalizePlants(remote))
      setPlants((current) => {
        if (plantsSignature(current) === plantsSignature(next)) return current
        persist(next)
        return next
      })
    } catch {
      // Keep the local cache when the API is unreachable.
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const remote = await fetchPlants()
        if (cancelled) return

        const next = withoutSeedPlants(normalizePlants(remote))
        setPlants(next)
        persist(next)
      } catch {
        // Keep the local cache when the API is unreachable.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const missing = plants.flatMap((plant) =>
      plant.videos
        .filter((video) => !(isStoredPoster(video.posterUrl) && isHttpUrl(video.posterUrl)))
        .map((video) => video.id),
    )
    const pending = missing.filter((id) => !posterJobs.current.has(id))
    if (pending.length === 0) return

    void (async () => {
      const replacements = new Map<string, Plant>()
      for (const plant of plants) {
        if (cancelled) return
        let changed = false
        const videos = []
        for (const video of plant.videos) {
          if (isStoredPoster(video.posterUrl) && isHttpUrl(video.posterUrl)) {
            videos.push(video)
            continue
          }
          if (posterJobs.current.has(video.id)) {
            videos.push(video)
            continue
          }
          posterJobs.current.add(video.id)
          try {
            const nextVideo = await persistVideoPoster(video)
            if (nextVideo) {
              videos.push(nextVideo)
              changed = true
            } else {
              videos.push(video)
            }
          } catch {
            posterJobs.current.delete(video.id)
            videos.push(video)
          }
        }
        if (!changed) continue
        const draft: Plant = { ...plant, videos, updatedAt: nowIso() }
        try {
          replacements.set(plant.id, await updatePlant(draft))
        } catch {
          replacements.set(plant.id, draft)
        }
      }
      if (cancelled || replacements.size === 0) return
      setPlants((current) => {
        const next = current.map((plant) => replacements.get(plant.id) ?? plant)
        persist(next)
        return next
      })
    })()

    return () => {
      cancelled = true
    }
  }, [plants])

  const value = useMemo<PlantsContextValue>(() => {
    const photoCount = plants.reduce((sum, plant) => sum + plant.photos.length, 0)
    const videoCount = plants.reduce((sum, plant) => sum + plant.videos.length, 0)

    const write = (updater: (current: Plant[]) => Plant[]) => {
      setPlants((current) => {
        const next = updater(current)
        persist(next)
        return next
      })
    }

    return {
      plants,
      photoCount,
      videoCount,
      getById: (id) => plants.find((plant) => plant.id === id),
      getByIdentification: (identification) =>
        plants.find(
          (plant) => plant.identification.toLowerCase() === identification.toLowerCase(),
        ),
      identificationTaken: (identification, ignoreId) =>
        plants.some(
          (plant) =>
            plant.id !== ignoreId &&
            plant.identification.toLowerCase() === identification.toLowerCase(),
        ),
      toggleFavorite: (id) => {
        const current = plants.find((plant) => plant.id === id)
        if (!current) return
        const favorite = !current.favorite
        write((list) =>
          list.map((plant) =>
            plant.id === id ? { ...plant, favorite, updatedAt: nowIso() } : plant,
          ),
        )
        void patchFavorite(id, favorite).catch(() => {
          write((list) =>
            list.map((plant) =>
              plant.id === id ? { ...plant, favorite: current.favorite } : plant,
            ),
          )
        })
      },
      savePlant: async (draft, id) => {
        const media = await preparePlantMedia(draft)
        const photos = media.photos.map((photo, index) => ({
          ...photo,
          isMain: media.photos.some((item) => item.isMain) ? photo.isMain : index === 0,
        }))

        if (id) {
          const existing = plants.find((plant) => plant.id === id)
          if (!existing) {
            throw new Error('Planta não encontrada')
          }
          const saved: Plant = {
            ...existing,
            ...draft,
            ...media,
            photos,
            updatedAt: nowIso(),
          }
          const persisted = await updatePlant(saved)
          write((current) => current.map((plant) => (plant.id === id ? persisted : plant)))
          return persisted
        }

        const saved: Plant = {
          id: createId(),
          favorite: false,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          ...draft,
          ...media,
          photos,
        }
        const persisted = await createPlant(saved)
        write((current) => [persisted, ...current])
        return persisted
      },
      removePlant: (id) => {
        const snapshot = plants
        write((current) => current.filter((plant) => plant.id !== id))
        void deletePlant(id).catch(() => {
          write(() => snapshot)
        })
      },
      refreshPlants,
    }
  }, [plants, refreshPlants])

  return <PlantsContext.Provider value={value}>{children}</PlantsContext.Provider>
}

export function usePlants(): PlantsContextValue {
  const ctx = useContext(PlantsContext)
  if (!ctx) {
    throw new Error('usePlants deve ser usado dentro de PlantsProvider')
  }
  return ctx
}
