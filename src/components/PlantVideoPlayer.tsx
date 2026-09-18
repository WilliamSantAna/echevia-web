import { useEffect, useRef, useState } from 'react'
import type { PlantVideo } from '../types/plant'
import { MuteIcon, PauseIcon, PlayIcon } from './Icons'
import { SwipePager } from './SwipePager'
import { VideoStill } from './VideoStill'

type PlantVideoPlayerProps = {
  videos: PlantVideo[]
  plantName: string
  active: number
  onActiveChange: (index: number) => void
}

function applyMute(node: HTMLVideoElement, muted: boolean) {
  node.muted = muted
  node.defaultMuted = muted
  node.volume = muted ? 0 : 1
}

export function PlantVideoPlayer({
  videos,
  plantName,
  active,
  onActiveChange,
}: PlantVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)
  const [muted, setMuted] = useState(true)
  const mutedRef = useRef(muted)
  mutedRef.current = muted
  const canSlide = videos.length >= 2

  useEffect(() => {
    setPlaying(false)
    setStarted(false)
    const wrap = wrapRef.current
    if (!wrap) return
    for (const node of wrap.querySelectorAll<HTMLVideoElement>('video.plant-video__media')) {
      node.pause()
      try {
        node.currentTime = 0.1
      } catch {
        node.currentTime = 0
      }
      applyMute(node, mutedRef.current)
    }
  }, [active])

  useEffect(() => {
    const node = videoRef.current
    if (node) applyMute(node, muted)
  }, [muted])

  const togglePlay = () => {
    const node = videoRef.current
    if (!node) return
    if (node.paused) {
      applyMute(node, muted)
      void node.play().catch(() => undefined)
    } else {
      node.pause()
    }
  }

  return (
    <div className="carousel-wrap" aria-label={plantName} ref={wrapRef}>
      <SwipePager
        className={`carousel plant-video${canSlide ? ' is-slides' : ''}`}
        index={active}
        count={videos.length}
        onIndexChange={onActiveChange}
        allowVerticalScroll
        onTap={togglePlay}
      >
        {videos.map((video, index) => (
          <div key={video.id} className="swipe-pager__slide plant-video__slide">
            <video
              ref={index === active ? videoRef : undefined}
              className="plant-video__media"
              src={video.url}
              muted={muted}
              playsInline
              preload="auto"
              onContextMenu={(event) => event.preventDefault()}
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              onLoadedData={(event) => {
                const node = event.currentTarget
                if (node.currentTime >= 0.04) return
                try {
                  const duration = node.duration
                  node.currentTime =
                    Number.isFinite(duration) && duration > 0
                      ? Math.min(0.12, Math.max(0.04, duration * 0.02))
                      : 0.1
                } catch {
                  // Seek may fail until the video is ready.
                }
              }}
              onPlay={() => {
                if (index === active) {
                  setPlaying(true)
                  setStarted(true)
                }
              }}
              onPause={() => {
                if (index === active) setPlaying(false)
              }}
              onEnded={() => {
                if (index === active) {
                  setPlaying(false)
                  setStarted(false)
                }
              }}
            />
            {index === active && started ? null : (
              <div className="plant-video__still">
                <VideoStill
                  className="is-fill"
                  src={video.url}
                  videoId={video.id}
                  poster={video.posterUrl}
                  alt=""
                />
              </div>
            )}
          </div>
        ))}
      </SwipePager>
      <button
        type="button"
        className="plant-video__toggle"
        aria-label={playing ? 'Pausar' : 'Reproduzir'}
        onClick={(event) => {
          event.stopPropagation()
          togglePlay()
        }}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <button
        type="button"
        className={`plant-video__mute${muted ? '' : ' is-on'}`}
        aria-label={muted ? 'Ativar som' : 'Silenciar'}
        aria-pressed={!muted}
        onClick={(event) => {
          event.stopPropagation()
          const next = !muted
          const node = videoRef.current
          if (node) {
            applyMute(node, next)
            if (!next && playing) void node.play().catch(() => undefined)
          }
          setMuted(next)
        }}
      >
        <MuteIcon muted={muted} />
      </button>
      {canSlide ? (
        <div className="carousel-dots" role="tablist" aria-label="Vídeos">
          {videos.map((video, index) => (
            <button
              key={video.id}
              type="button"
              role="tab"
              aria-selected={index === active}
              className={index === active ? 'is-active' : ''}
              onClick={() => onActiveChange(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
