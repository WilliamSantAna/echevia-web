import { useEffect } from 'react'

type ProtectedPhotoProps = {
  src: string
  alt: string
  className?: string
  watermark?: boolean
}

export function ProtectedPhoto({ src, alt, className = '', watermark = false }: ProtectedPhotoProps) {
  useEffect(() => {
    const prevent = (event: Event) => event.preventDefault()
    document.addEventListener('dragstart', prevent)
    return () => document.removeEventListener('dragstart', prevent)
  }, [])

  return (
    <figure
      className={`protected-photo ${className}`.trim()}
      onContextMenu={(event) => event.preventDefault()}
    >
      <img
        className="protected-photo__img"
        src={src}
        alt={alt}
        draggable={false}
        decoding="async"
      />
      <div className="protected-photo__shield" aria-hidden="true" />
      {watermark ? <span className="watermark">Echevia</span> : null}
    </figure>
  )
}
