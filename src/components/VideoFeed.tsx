import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sharePlant } from '../lib/share'
import type { Plant } from '../types/plant'
import { MuteIcon, ShareIcon } from './Icons'

type VideoFeedProps = {
  plants: Plant[]
}

export function VideoFeed({ plants }: VideoFeedProps) {
  const items = useMemo(
    () => plants.flatMap((plant) => plant.videos.map((video) => ({ plant, video }))),
    [plants],
  )
  const looping = items.length > 1
  const slides = useMemo(
    () => (looping ? [items[items.length - 1], ...items, items[0]] : items),
    [items, looping],
  )
  const scrollerRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()

  useLayoutEffect(() => {
    const node = scrollerRef.current
    if (!node || !looping) return
    const firstReal = node.children[1] as HTMLElement | undefined
    if (firstReal) node.scrollTop = firstReal.offsetTop
  }, [looping, items.length])

  useEffect(() => {
    const node = scrollerRef.current
    if (!node || !looping) return

    let jumping = false

    const cards = () => Array.from(node.children) as HTMLElement[]

    const nearestIndex = () => {
      const y = node.scrollTop
      let best = 0
      let dist = Infinity
      cards().forEach((card, index) => {
        const delta = Math.abs(card.offsetTop - y)
        if (delta < dist) {
          dist = delta
          best = index
        }
      })
      return best
    }

    const settle = () => {
      if (jumping) return
      const list = cards()
      const last = list.length - 1
      if (last < 2) return
      const index = nearestIndex()
      if (index !== 0 && index !== last) return
      const target = list[index === 0 ? last - 1 : 1]
      if (!target) return
      jumping = true
      node.scrollTop = target.offsetTop
      requestAnimationFrame(() => {
        jumping = false
      })
    }

    node.addEventListener('scrollend', settle)
    let timer = 0
    const onScroll = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(settle, 80)
    }
    node.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      node.removeEventListener('scrollend', settle)
      node.removeEventListener('scroll', onScroll)
      window.clearTimeout(timer)
    }
  }, [looping, items.length])

  if (items.length === 0) {
    return (
      <div className="empty">
        <h2>Nenhum vídeo ainda</h2>
        <p>Cadastre um vídeo curto de até 30 segundos na ficha da planta.</p>
      </div>
    )
  }

  return (
    <section className="videos" ref={scrollerRef}>
      {slides.map((item, index) => (
        <VideoCard
          key={`${item.video.id}-${index}`}
          plant={item.plant}
          src={item.video.url}
          poster={item.video.posterUrl}
          onOpen={() => navigate(`/plantas/${item.plant.id}`)}
        />
      ))}
    </section>
  )
}

function notesPreview(notes: string, max = 88) {
  const text = notes.trim().replace(/\s+/g, ' ')
  if (!text) return ''
  if (text.length <= max) return text
  const slice = text.slice(0, max)
  const lastSpace = slice.lastIndexOf(' ')
  return (lastSpace > 40 ? slice.slice(0, lastSpace) : slice).trim()
}

type VideoCardProps = {
  plant: Plant
  src: string
  poster: string
  onOpen: () => void
}

function VideoCard({ plant, src, poster, onOpen }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)
  const [failed, setFailed] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const fullNotes = plant.notes.trim().replace(/\s+/g, ' ')
  const preview = notesPreview(fullNotes)
  const truncated = Boolean(fullNotes) && preview !== fullNotes

  useEffect(() => {
    const node = videoRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void node.play().catch(() => undefined)
        } else {
          node.pause()
          setExpanded(false)
        }
      },
      { threshold: 0.65 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <article className={`video-card${expanded ? ' is-expanded' : ''}`}>
      {failed ? (
        <div className="video-card__fallback" style={{ backgroundImage: `url("${poster}")` }} />
      ) : (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted={muted}
          playsInline
          loop
          onContextMenu={(event) => event.preventDefault()}
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          onError={() => setFailed(true)}
        />
      )}
      <div className="video-card__scrim" />
      <div className="video-card__meta">
        <button type="button" className="video-card__open" onClick={onOpen}>
          <div className="video-card__id">{plant.identification}</div>
          <h2>{plant.name}</h2>
          <p className="video-card__species">{plant.species}</p>
          {plant.botanicalFamily ? <p className="video-card__family">{plant.botanicalFamily}</p> : null}
        </button>
        {fullNotes ? (
          <p className="video-card__notes">
            {expanded || !truncated ? fullNotes : preview}
            {truncated ? (
              <>
                {expanded ? ' ' : '... '}
                <button
                  type="button"
                  className="video-card__more"
                  onClick={() => setExpanded((value) => !value)}
                >
                  {expanded ? 'Ver menos' : 'Ver Mais'}
                </button>
              </>
            ) : null}
          </p>
        ) : null}
      </div>
      <div className="video-card__actions">
        <button
          type="button"
          onClick={() => {
            void sharePlant(plant.name, plant.identification)
          }}
        >
          <ShareIcon />
        </button>
        <button type="button" onClick={() => setMuted((value) => !value)}>
          <MuteIcon muted={muted} />
        </button>
      </div>
    </article>
  )
}
