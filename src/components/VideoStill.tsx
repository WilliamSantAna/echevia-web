import { useEffect, useRef, useState } from 'react'
import { captureVideoPoster } from '../lib/media'

type VideoStillProps = {
  src: string
  alt: string
  className?: string
}

export function VideoStill({ src, alt, className = '' }: VideoStillProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [frame, setFrame] = useState('')

  useEffect(() => {
    let cancelled = false
    void captureVideoPoster(src).then((url) => {
      if (!cancelled && url) setFrame(url)
    })
    return () => {
      cancelled = true
    }
  }, [src])

  useEffect(() => {
    if (frame) return
    const node = videoRef.current
    if (!node) return

    const paint = () => {
      if (node.videoWidth < 2) return
      if (node.currentTime >= 0.04) return
      try {
        const duration = node.duration
        node.currentTime =
          Number.isFinite(duration) && duration > 0
            ? Math.min(0.12, Math.max(0.04, duration * 0.02))
            : 0.1
      } catch {
        // Some browsers reject seek before readyState is high enough.
      }
    }

    node.addEventListener('loadeddata', paint)
    node.addEventListener('loadedmetadata', paint)
    return () => {
      node.removeEventListener('loadeddata', paint)
      node.removeEventListener('loadedmetadata', paint)
    }
  }, [src, frame])

  return (
    <figure
      className={`protected-photo video-still ${className}`.trim()}
      onContextMenu={(event) => event.preventDefault()}
    >
      {frame ? (
        <img className="protected-photo__img" src={frame} alt={alt} draggable={false} decoding="async" />
      ) : (
        <video
          ref={videoRef}
          className="protected-photo__img"
          src={src}
          muted
          playsInline
          preload="auto"
          onContextMenu={(event) => event.preventDefault()}
        />
      )}
      <div className="protected-photo__shield" aria-hidden="true" />
    </figure>
  )
}
