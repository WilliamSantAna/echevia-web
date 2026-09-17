import type { Plant, PlantPhoto } from '../types/plant'

export function mainPhotoRecord(plant: Plant): PlantPhoto | undefined {
  return plant.photos.find((photo) => photo.isMain) ?? plant.photos[0]
}

export function mainPhoto(plant: Plant): string | undefined {
  return mainPhotoRecord(plant)?.url
}

export function plantMatchesQuery(plant: Plant, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return plant.name.toLowerCase().includes(q)
}
