import { useRef, useState, type PointerEvent } from 'react'
import type { Plant, PlantPhoto } from '../types/plant'
import { Lightbox } from './Lightbox'
import { ProtectedPhoto } from './ProtectedPhoto'

type FavoritesStripProps = {
  plants: Plant[]
}

type FavoriteTile = {
  key: string
  plant: Plant
  photo: PlantPhoto
}

export function FavoritesStrip({ plants }: FavoritesStripProps) {
  const tiles: FavoriteTile[] = plants.flatMap((plant) =>
    plant.favorite
      ? plant.photos.map((photo) => ({
          key: `${plant.id}-${photo.id}`,
          plant,
          photo,
        }))
      : [],
  )
  const scrollerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startScroll: number } | null>(null)
  const originRef = useRef<{ x: number; y: number } | null>(null)
  const skipClick = useRef(false)
  const [dragging, setDragging] = useState(false)
  const [active, setActive] = useState<FavoriteTile | null>(null)

  if (tiles.length === 0) return null

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    skipClick.current = false
    originRef.current = { x: event.clientX, y: event.clientY }
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    const node = scrollerRef.current
    if (!node) return
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: node.scrollLeft,
    }
    node.setPointerCapture(event.pointerId)
    setDragging(true)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const origin = originRef.current
    if (origin && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 8) {
      skipClick.current = true
    }
    const drag = dragRef.current
    const node = scrollerRef.current
    if (!drag || !node || event.pointerId !== drag.pointerId) return
    node.scrollLeft = drag.startScroll - (event.clientX - drag.startX)
  }

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || event.pointerId !== drag.pointerId) return
    dragRef.current = null
    setDragging(false)
  }

  return (
    <>
      <section
        className={`favorites-strip${dragging ? ' is-dragging' : ''}`}
        aria-label="Favoritas"
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {tiles.map((tile) => (
          <button
            key={tile.key}
            type="button"
            className="favorites-strip__item"
            aria-label={tile.plant.name}
            onClick={() => {
              if (skipClick.current) return
              setActive(tile)
            }}
          >
            <span className="favorites-strip__ring">
              <ProtectedPhoto className="favorites-strip__photo" src={tile.photo.url} alt="" />
            </span>
            <span className="favorites-strip__name">{tile.plant.name}</span>
          </button>
        ))}
      </section>
      {active ? (
        <Lightbox
          items={tiles.map((tile) => ({
            src: tile.photo.url,
            alt: tile.plant.name,
          }))}
          index={Math.max(
            0,
            tiles.findIndex((tile) => tile.key === active.key),
          )}
          label={`${active.plant.name} em tela cheia`}
          onClose={() => setActive(null)}
        />
      ) : null}
    </>
  )
}
