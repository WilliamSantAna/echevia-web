import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { ProtectedPhoto } from './ProtectedPhoto'

export type LightboxItem = {
  src: string
  alt: string
}

type LightboxProps = {
  items: LightboxItem[]
  index?: number
  label: string
  onClose: () => void
}

export function Lightbox({ items, index = 0, label, onClose }: LightboxProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startScroll: number } | null>(null)
  const originRef = useRef<{ x: number; y: number } | null>(null)
  const skipClose = useRef(false)
  const onCloseRef = useRef(onClose)
  const [dragging, setDragging] = useState(false)
  const [active, setActive] = useState(() => Math.max(0, Math.min(items.length - 1, index)))
  onCloseRef.current = onClose

  useEffect(() => {
    const node = trackRef.current
    const start = Math.max(0, Math.min(items.length - 1, index))
    setActive(start)
    if (node) node.scrollLeft = node.clientWidth * start
  }, [index, items.length])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }
      const node = trackRef.current
      if (!node) return
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        const delta = event.key === 'ArrowRight' ? 1 : -1
        const next = Math.max(0, Math.min(items.length - 1, Math.round(node.scrollLeft / Math.max(node.clientWidth, 1)) + delta))
        node.scrollTo({ left: node.clientWidth * next, behavior: 'smooth' })
        setActive(next)
      }
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [items.length])

  const snapTo = (nextIndex: number) => {
    const node = trackRef.current
    if (!node || items.length === 0) return
    const next = Math.max(0, Math.min(items.length - 1, nextIndex))
    node.scrollTo({ left: node.clientWidth * next, behavior: 'smooth' })
    setActive(next)
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    skipClose.current = false
    originRef.current = { x: event.clientX, y: event.clientY }
    if (items.length < 2 || (event.pointerType === 'mouse' && event.button !== 0)) return
    const node = trackRef.current
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
      skipClose.current = true
    }
    const drag = dragRef.current
    const node = trackRef.current
    if (!drag || !node || event.pointerId !== drag.pointerId) return
    node.scrollLeft = drag.startScroll - (event.clientX - drag.startX)
  }

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    const node = trackRef.current
    if (!drag || !node || event.pointerId !== drag.pointerId) return
    dragRef.current = null
    setDragging(false)
    snapTo(Math.round(node.scrollLeft / Math.max(node.clientWidth, 1)))
  }

  if (items.length === 0) return null

  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={() => {
        if (skipClose.current) return
        onCloseRef.current()
      }}
    >
      <div
        className={`lightbox__track${dragging ? ' is-dragging' : ''}`}
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onScroll={(event) => {
          const node = event.currentTarget
          const next = Math.round(node.scrollLeft / Math.max(node.clientWidth, 1))
          if (next !== active) setActive(next)
        }}
      >
        {items.map((item) => (
          <div className="lightbox__slide" key={`${item.src}-${item.alt}`}>
            <ProtectedPhoto className="lightbox__photo" src={item.src} alt={item.alt} />
          </div>
        ))}
      </div>
    </div>,
    document.body,
  )
}
