import type { Plant } from '../types/plant'

export function mainPhoto(plant: Plant): string | undefined {
  return plant.photos.find((photo) => photo.isMain)?.url ?? plant.photos[0]?.url
}

export function plantMatchesQuery(plant: Plant, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [plant.name, plant.species, plant.botanicalFamily, plant.identification, plant.notes]
    .join(' ')
    .toLowerCase()
    .includes(q)
}
