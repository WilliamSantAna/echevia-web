import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ProtectedPhoto } from './ProtectedPhoto'

type LightboxProps = {
  src: string
  alt: string
  label: string
  onClose: () => void
}

export function Lightbox({ src, alt, label, onClose }: LightboxProps) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={() => onCloseRef.current()}
    >
      <ProtectedPhoto className="lightbox__photo" src={src} alt={alt} />
    </div>,
    document.body,
  )
}
