import type { Plant, PlantPhoto } from '../types/plant'

export function isUsablePhoto(photo: PlantPhoto): boolean {
  return Boolean(photo.url?.trim())
}

export function plantPhotos(plant: Plant): PlantPhoto[] {
  return plant.photos.filter(isUsablePhoto)
}

export function hasPlantPhoto(plant: Plant): boolean {
  return plant.photos.some(isUsablePhoto)
}

export function mainPhotoRecord(plant: Plant): PlantPhoto | undefined {
  const photos = plantPhotos(plant)
  return photos.find((photo) => photo.isMain) ?? photos[0]
}

export function mainPhoto(plant: Plant): string | undefined {
  return mainPhotoRecord(plant)?.url
}

export function plantMatchesQuery(plant: Plant, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return plant.name.toLowerCase().includes(q)
}
