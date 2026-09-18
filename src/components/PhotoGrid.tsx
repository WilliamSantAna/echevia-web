import { Link } from 'react-router-dom'
import { mainPhoto } from '../lib/plant'
import { videoPosterSrc } from '../lib/videoPoster'
import type { Plant } from '../types/plant'
import { ProtectedPhoto } from './ProtectedPhoto'
import { VideoStill } from './VideoStill'

type PhotoGridProps = {
  plants: Plant[]
  emptyTitle: string
  emptyText: string
}

type Tile = {
  key: string
  plant: Plant
  src: string
  poster?: string
  videoId?: string
  alt: string
  kind: 'photo' | 'video'
}

export function PhotoGrid({ plants, emptyTitle, emptyText }: PhotoGridProps) {
  const tiles: Tile[] = plants.flatMap((plant) => {
    const photoSrc = mainPhoto(plant)
    const photoTiles: Tile[] = photoSrc
      ? [
          {
            key: `photo-${plant.id}`,
            plant,
            src: photoSrc,
            alt: plant.name,
            kind: 'photo',
          },
        ]
      : []
    const videoTiles: Tile[] = plant.videos.map((video) => ({
      key: `video-${video.id}`,
      plant,
      src: video.url,
      poster: videoPosterSrc(video),
      videoId: video.id,
      alt: `Vídeo de ${plant.name}`,
      kind: 'video',
    }))
    return [...photoTiles, ...videoTiles]
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
        <Link
          key={tile.key}
          className={`photo-tile${tile.kind === 'video' ? ' is-video' : ''}`}
          to={tile.kind === 'video' ? `/plantas/${tile.plant.id}?midia=video` : `/plantas/${tile.plant.id}`}
        >
          {tile.kind === 'video' ? (
            <VideoStill
              className="is-fill"
              src={tile.src}
              videoId={tile.videoId}
              poster={tile.poster}
              alt={tile.alt}
            />
          ) : (
            <ProtectedPhoto className="is-fill" src={tile.src} alt={tile.alt} />
          )}
        </Link>
      ))}
    </section>
  )
}
