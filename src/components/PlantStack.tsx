import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { nearbyPlants, PREFETCH_SPAN, prefetchNearbyPlantMedia } from '../lib/mediaCache'
import type { Plant } from '../types/plant'

type PlantStackProps = {
  plants: Plant[]
  currentId: string
  onCurrentIdChange: (id: string) => void
  children: (plant: Plant) => ReactNode
}

export function PlantStack({ plants, currentId, onCurrentIdChange, children }: PlantStackProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const jumpingRef = useRef(false)
  const currentIdRef = useRef(currentId)
  const onChangeRef = useRef(onCurrentIdChange)
  currentIdRef.current = currentId
  onChangeRef.current = onCurrentIdChange

  const looping = plants.length > 1
  const uniqueKeys = plants.length >= PREFETCH_SPAN * 2 + 1
  const slides = useMemo(
    () => (looping ? nearbyPlants(plants, currentId, PREFETCH_SPAN) : plants.slice(0, 1)),
    [plants, currentId, looping],
  )
  const restIndex = looping ? PREFETCH_SPAN : 0

  const snapToRest = (behavior: ScrollBehavior = 'auto') => {
    const node = viewportRef.current
    if (!node) return
    const height = node.clientHeight
    if (height < 8) return
    jumpingRef.current = true
    node.scrollTo({ top: restIndex * height, behavior })
    window.setTimeout(() => {
      jumpingRef.current = false
    }, 80)
  }

  useLayoutEffect(() => {
    const node = viewportRef.current
    if (!node) return
    snapToRest('auto')
    if (node.clientHeight >= 8) return
    const frame = requestAnimationFrame(() => snapToRest('auto'))
    return () => cancelAnimationFrame(frame)
  }, [currentId, restIndex, slides.length])

  useEffect(() => {
    prefetchNearbyPlantMedia(plants, currentId)
  }, [plants, currentId])

  useEffect(() => {
    const node = viewportRef.current
    if (!node || !looping) return

    const nearestIndex = () => {
      const y = node.scrollTop
      const height = node.clientHeight || 1
      return Math.max(0, Math.min(slides.length - 1, Math.round(y / height)))
    }

    const settle = () => {
      if (jumpingRef.current) return
      const index = nearestIndex()
      const next = slides[index]
      if (!next) return
      if (next.id !== currentIdRef.current) {
        onChangeRef.current(next.id)
        return
      }
      if (index !== restIndex) snapToRest('auto')
    }

    let timer = 0
    const onScroll = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(settle, 80)
    }

    const onKey = (event: KeyboardEvent) => {
      if (document.querySelector('.lightbox, .sheet')) return
      const height = node.clientHeight
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        node.scrollTo({ top: node.scrollTop + height, behavior: 'smooth' })
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        node.scrollTo({ top: node.scrollTop - height, behavior: 'smooth' })
      }
    }

    node.addEventListener('scroll', onScroll, { passive: true })
    node.addEventListener('scrollend', settle)
    window.addEventListener('keydown', onKey)
    return () => {
      node.removeEventListener('scroll', onScroll)
      node.removeEventListener('scrollend', settle)
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(timer)
    }
  }, [looping, restIndex, slides])

  return (
    <div
      ref={viewportRef}
      className={`plant-stack${looping ? ' is-looping' : ''}`}
      aria-label="Detalhe da planta"
    >
      {slides.map((plant, slot) => (
        <div
          key={uniqueKeys ? plant.id : `${slot}-${plant.id}`}
          className="plant-stack__slide"
        >
          {children(plant)}
        </div>
      ))}
    </div>
  )
}
