import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ProtectedPhoto } from './ProtectedPhoto'
import { SwipePager } from './SwipePager'

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
  const [active, setActive] = useState(() => Math.max(0, Math.min(items.length - 1, index)))
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    setActive(Math.max(0, Math.min(items.length - 1, index)))
  }, [index, items.length])

  useEffect(() => {
    const nearby = [active - 1, active, active + 1]
    nearby.forEach((itemIndex) => {
      const src = items[itemIndex]?.src
      if (!src) return
      const image = new Image()
      image.src = src
    })
  }, [active, items])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
      if (event.key === 'ArrowRight') setActive((current) => Math.min(items.length - 1, current + 1))
      if (event.key === 'ArrowLeft') setActive((current) => Math.max(0, current - 1))
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [items.length])

  if (items.length === 0) return null

  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={label}>
      <SwipePager
        className="lightbox__pager"
        index={active}
        count={items.length}
        onIndexChange={setActive}
        onTap={() => {
          onCloseRef.current()
        }}
      >
        {items.map((item, itemIndex) => (
          <div className="swipe-pager__slide lightbox__slide" key={`${item.src}-${itemIndex}`}>
            <ProtectedPhoto className="lightbox__photo" src={item.src} alt={item.alt} />
          </div>
        ))}
      </SwipePager>
    </div>,
    document.body,
  )
}
