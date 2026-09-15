import { Link } from 'react-router-dom'
import { mainPhoto } from '../lib/plant'
import type { Plant } from '../types/plant'
import { HeartIcon } from './Icons'
import { ProtectedPhoto } from './ProtectedPhoto'

type PhotoGridProps = {
  plants: Plant[]
  emptyTitle: string
  emptyText: string
}

type Tile = {
  key: string
  plant: Plant
  src: string
  alt: string
}

export function PhotoGrid({ plants, emptyTitle, emptyText }: PhotoGridProps) {
  const tiles: Tile[] = plants.flatMap((plant) => {
    const photos = plant.photos.map((photo, index) => ({
      key: `${plant.id}-${photo.id}`,
      plant,
      src: photo.url,
      alt: `${plant.name} · foto ${index + 1}`,
    }))
    if (photos.length === 0) {
      const src = mainPhoto(plant)
      if (!src) return []
      return [
        {
          key: `${plant.id}-main`,
          plant,
          src,
          alt: plant.name,
        },
      ]
    }
    return photos
  })

  if (tiles.length === 0) {
    return (
      <div className="empty">
        <h2>{emptyTitle}</h2>
        <p>{emptyText}</p>
      </div>
    )
  }

  return (
    <section className="photo-grid">
      {tiles.map((tile) => (
        <Link key={tile.key} className="photo-tile" to={`/plantas/${tile.plant.id}`}>
          <ProtectedPhoto className="is-fill" src={tile.src} alt={tile.alt} />
          {tile.plant.favorite ? (
            <span className="photo-tile__fav">
              <HeartIcon filled />
            </span>
          ) : null}
        </Link>
      ))}
    </section>
  )
}