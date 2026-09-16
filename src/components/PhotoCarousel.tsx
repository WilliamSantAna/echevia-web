import { useRef, useState, type PointerEvent, type RefObject } from 'react'
import type { PlantPhoto } from '../types/plant'
import { Lightbox } from './Lightbox'
import { ProtectedPhoto } from './ProtectedPhoto'

type PhotoCarouselProps = {
  photos: PlantPhoto[]
  plantName: string
  active: number
  onActiveChange: (index: number) => void
  scrollerRef?: RefObject<HTMLDivElement | null>
}

export function PhotoCarousel({
  photos,
  plantName,
  active,
  onActiveChange,
  scrollerRef,
}: PhotoCarouselProps) {
  const innerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startScroll: number } | null>(null)
  const originRef = useRef<{ x: number; y: number } | null>(null)
  const axisRef = useRef<'x' | 'y' | null>(null)
  const skipClick = useRef(false)
  const [dragging, setDragging] = useState(false)
  const [lightbox, setLightbox] = useState(false)
  const canSlide = photos.length >= 2
  const current = photos[active] ?? photos[0]

  const scroller = () => scrollerRef?.current ?? innerRef.current

  const snapTo = (index: number) => {
    const node = scroller()
    if (!node) return
    const next = Math.max(0, Math.min(photos.length - 1, index))
    node.scrollTo({ left: node.clientWidth * next, behavior: 'smooth' })
    onActiveChange(next)
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    skipClick.current = false
    originRef.current = { x: event.clientX, y: event.clientY }
    axisRef.current = null
    if (!canSlide || (event.pointerType === 'mouse' && event.button !== 0)) return
    const node = scroller()
    if (!node) return
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: node.scrollLeft,
    }
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const origin = originRef.current
    if (origin && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 8) {
      skipClick.current = true
    }
    const drag = dragRef.current
    const node = scroller()
    if (!drag || !node || event.pointerId !== drag.pointerId) return

    const dx = event.clientX - drag.startX
    const dy = origin ? event.clientY - origin.y : 0
    if (!axisRef.current) {
      if (Math.hypot(dx, dy) < 10) return
      axisRef.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (axisRef.current === 'y') {
        dragRef.current = null
        return
      }
      node.setPointerCapture(event.pointerId)
      setDragging(true)
    }
    if (axisRef.current !== 'x') return
    event.preventDefault()
    node.scrollLeft = drag.startScroll - dx
  }

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    const node = scroller()
    axisRef.current = null
    if (!drag || !node || event.pointerId !== drag.pointerId) return
    dragRef.current = null
    setDragging(false)
    snapTo(Math.round(node.scrollLeft / Math.max(node.clientWidth, 1)))
  }

  return (
    <div className="carousel-wrap">
      <div
        className={`carousel${dragging ? ' is-dragging' : ''}${canSlide ? ' is-slides' : ''}`}
        ref={scrollerRef ?? innerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={() => {
          if (skipClick.current || !current) return
          setLightbox(true)
        }}
        onScroll={(event) => {
          const node = event.currentTarget
          const index = Math.round(node.scrollLeft / Math.max(node.clientWidth, 1))
          if (index !== active) onActiveChange(index)
        }}
      >
        {photos.map((photo, index) => (
          <ProtectedPhoto
            key={photo.id}
            src={photo.url}
            alt={`${plantName} · foto ${index + 1}`}
          />
        ))}
      </div>
      {canSlide ? (
        <div className="carousel-dots" role="tablist" aria-label="Fotos">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              role="tab"
              aria-selected={index === active}
              className={index === active ? 'is-active' : ''}
              onClick={() => snapTo(index)}
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
