import { useEffect, useState } from 'react'
import { captureVideoPoster } from '../lib/media'
import { isStoredPoster, readDevicePoster, writeDevicePoster } from '../lib/videoPoster'
import { ProtectedPhoto } from './ProtectedPhoto'

type VideoStillProps = {
  src: string
  videoId?: string
  poster?: string
  alt: string
  className?: string
}

function resolvePoster(videoId: string | undefined, poster?: string): string {
  if (isStoredPoster(poster) && !poster?.startsWith('blob:')) return poster ?? ''
  return videoId ? readDevicePoster(videoId) : ''
}

export function VideoStill({ src, videoId, poster, alt, className = '' }: VideoStillProps) {
  const [frame, setFrame] = useState(() => resolvePoster(videoId, poster))

  useEffect(() => {
    const stored = resolvePoster(videoId, poster)
    if (stored) {
      setFrame(stored)
      return
    }

    let cancelled = false
    void captureVideoPoster(src).then((url) => {
      if (cancelled || !url) return
      if (videoId) writeDevicePoster(videoId, url)
      setFrame(url)
    })
    return () => {
      cancelled = true
    }
  }, [src, videoId, poster])

  if (frame) {
    return <ProtectedPhoto className={`video-still ${className}`.trim()} src={frame} alt={alt} />
  }

  return (
    <figure
      className={`protected-photo video-still ${className}`.trim()}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span className="photo-tile__fallback" aria-hidden="true" />
      <div className="protected-photo__shield" aria-hidden="true" />
    </figure>
  )
}
