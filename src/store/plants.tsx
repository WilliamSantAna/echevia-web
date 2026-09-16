import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { seedPlants } from '../data/seed'
import { nowIso } from '../lib/dates'
import { createId } from '../lib/id'
import { isHttpUrl } from '../lib/media'
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
      posterUrl: relocateMockAsset(video.posterUrl),
    })),
  }))
}

function loadPlants(): Plant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedPlants
    const parsed = JSON.parse(raw) as Plant[]
    if (!Array.isArray(parsed) || parsed.length === 0) return seedPlants
    return normalizePlants(parsed)
  } catch {
    return seedPlants
  }
}

function persist(plants: Plant[]) {
  const serializable = plants.map((plant) => ({
    ...plant,
    videos: plant.videos.filter((video) => isHttpUrl(video.url)),
  }))
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
  } catch {
    // Storage quota is a mock-only constraint (photos as data URLs).
  }
}

type PlantsContextValue = {
  plants: Plant[]
  photoCount: number
  videoCount: number
  getById: (id: string) => Plant | undefined
  getByIdentification: (identification: string) => Plant | undefined
  identificationTaken: (identification: string, ignoreId?: string) => boolean
  toggleFavorite: (id: string) => void
  savePlant: (draft: PlantDraft, id?: string) => Plant
  removePlant: (id: string) => void
}

const PlantsContext = createContext<PlantsContextValue | null>(null)

export function PlantsProvider({ children }: { children: ReactNode }) {
  const [plants, setPlants] = useState<Plant[]>(loadPlants)

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
        write((current) =>
          current.map((plant) =>
            plant.id === id
              ? { ...plant, favorite: !plant.favorite, updatedAt: nowIso() }
              : plant,
          ),
        )
      },
      savePlant: (draft, id) => {
        const photos = draft.photos.map((photo, index) => ({
          ...photo,
          isMain: draft.photos.some((item) => item.isMain)
            ? photo.isMain
            : index === 0,
        }))

        if (id) {
          const existing = plants.find((plant) => plant.id === id)
          if (!existing) {
            throw new Error('Planta não encontrada')
          }
          const saved: Plant = {
            ...existing,
            ...draft,
            photos,
            updatedAt: nowIso(),
          }
          write((current) => current.map((plant) => (plant.id === id ? saved : plant)))
          return saved
        }

        const saved: Plant = {
          id: createId(),
          favorite: false,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          ...draft,
          photos,
        }
        write((current) => [saved, ...current])
        return saved
      },
      removePlant: (id) => {
        write((current) => current.filter((plant) => plant.id !== id))
      },
    }
  }, [plants])

  return <PlantsContext.Provider value={value}>{children}</PlantsContext.Provider>
}

export function usePlants(): PlantsContextValue {
  const ctx = useContext(PlantsContext)
  if (!ctx) {
    throw new Error('usePlants deve ser usado dentro de PlantsProvider')
  }
  return ctx
}
