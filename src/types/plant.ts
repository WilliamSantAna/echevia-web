export type PlantPhoto = {
  id: string
  url: string
  isMain: boolean
  key?: string | null
}

export type PlantVideo = {
  id: string
  url: string
  posterUrl: string
  durationSeconds: number
  key?: string | null
  posterKey?: string | null
}

export type Plant = {
  id: string
  name: string
  species: string
  botanicalFamily: string
  identification: string
  notes: string
  favorite: boolean
  photos: PlantPhoto[]
  videos: PlantVideo[]
  createdAt: string
  updatedAt: string
}

export type PlantDraft = {
  name: string
  species: string
  botanicalFamily: string
  identification: string
  notes: string
  photos: PlantPhoto[]
  videos: PlantVideo[]
}

export const MAX_PHOTOS = 6
export const MAX_VIDEO_SECONDS = 30
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024
export const STORAGE_BLOCK_RATIO = 0.99
