import { useState } from 'react'
import type { PlantPhoto } from '../types/plant'
import { Lightbox } from './Lightbox'
import { ProtectedPhoto } from './ProtectedPhoto'
import { SwipePager } from './SwipePager'

type PhotoCarouselProps = {
  photos: PlantPhoto[]
  plantName: string
  active: number
  onActiveChange: (index: number) => void
  priority?: boolean
}

export function PhotoCarousel({
  photos,
  plantName,
  active,
  onActiveChange,
  priority = false,
}: PhotoCarouselProps) {
  const [lightbox, setLightbox] = useState(false)
  const canSlide = photos.length >= 2
  const current = photos[active] ?? photos[0]
  if (photos.length === 0) return null

  return (
    <div className="carousel-wrap">
      <SwipePager
        className={`carousel${canSlide ? ' is-slides' : ''}`}
        index={active}
        count={photos.length}
        onIndexChange={onActiveChange}
        allowVerticalScroll
        onTap={() => {
          if (current) setLightbox(true)
        }}
      >
        {photos.map((photo, index) => (
          <ProtectedPhoto
            key={photo.id}
            className="swipe-pager__slide"
            src={photo.url}
            alt={`${plantName} · foto ${index + 1}`}
            loading={priority ? 'eager' : 'lazy'}
          />
        ))}
      </SwipePager>
      {canSlide ? (
        <div className="carousel-dots" role="tablist" aria-label="Fotos">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              role="tab"
              aria-selected={index === active}
              className={index === active ? 'is-active' : ''}
              onClick={() => onActiveChange(index)}
            />
          ))}
        </div>
      ) : null}
      {lightbox ? (
        <Lightbox
          items={photos.map((photo, index) => ({
            src: photo.url,
            alt: `${plantName} · foto ${index + 1}`,
          }))}
          index={active}
          label={`${plantName} em tela cheia`}
          onClose={() => setLightbox(false)}
        />
      ) : null}
    </div>
  )
}
