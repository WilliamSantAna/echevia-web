import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { nearbyPlants, prefetchNearbyPlantMedia } from '../lib/mediaCache'
import type { Plant } from '../types/plant'

type PlantStackProps = {
  plants: Plant[]
  currentId: string
  onCurrentIdChange: (id: string) => void
  children: (plant: Plant, meta: { priority: boolean }) => ReactNode
}

type Slide = {
  plant: Plant
  kind: 'real' | 'clone-start' | 'clone-end'
}

function buildSlides(plants: Plant[]): Slide[] {
  if (plants.length <= 1) return plants.map((plant) => ({ plant, kind: 'real' as const }))
  return [
    { plant: plants[plants.length - 1], kind: 'clone-start' },
    ...plants.map((plant) => ({ plant, kind: 'real' as const })),
    { plant: plants[0], kind: 'clone-end' },
  ]
}

export function PlantStack({ plants, currentId, onCurrentIdChange, children }: PlantStackProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const jumpingRef = useRef(false)
  const fromScrollRef = useRef(false)
  const currentIdRef = useRef(currentId)
  const onChangeRef = useRef(onCurrentIdChange)
  currentIdRef.current = currentId
  onChangeRef.current = onCurrentIdChange

  const looping = plants.length > 1
  const slides = useMemo(() => buildSlides(plants), [plants])
  const priorityIds = useMemo(
    () => new Set(nearbyPlants(plants, currentId).map((plant) => plant.id)),
    [plants, currentId],
  )

  const slideEls = () => Array.from(viewportRef.current?.children ?? []) as HTMLElement[]

  const scrollToPlant = (id: string) => {
    const node = viewportRef.current
    if (!node) return
    const target = slideEls().find((slide) => slide.dataset.kind === 'real' && slide.dataset.plantId === id)
    if (!target) return
    jumpingRef.current = true
    node.scrollTop = target.offsetTop
    requestAnimationFrame(() => {
      jumpingRef.current = false
    })
  }

  useLayoutEffect(() => {
    if (fromScrollRef.current) {
      fromScrollRef.current = false
      return
    }
    scrollToPlant(currentId)
    if ((viewportRef.current?.clientHeight ?? 0) >= 8) return
    const frame = requestAnimationFrame(() => scrollToPlant(currentId))
    return () => cancelAnimationFrame(frame)
  }, [currentId, slides.length])

  useEffect(() => {
    prefetchNearbyPlantMedia(plants, currentId)
  }, [plants, currentId])

  useEffect(() => {
    const node = viewportRef.current
    if (!node) return

    const nearestIndex = () => {
      const y = node.scrollTop
      let best = 0
      let dist = Infinity
      slideEls().forEach((slide, index) => {
        const delta = Math.abs(slide.offsetTop - y)
        if (delta < dist) {
          dist = delta
          best = index
        }
      })
      return best
    }

    const emit = (id: string) => {
      if (id === currentIdRef.current) return
      fromScrollRef.current = true
      onChangeRef.current(id)
    }

    const jumpTo = (target: HTMLElement) => {
      jumpingRef.current = true
      node.scrollTop = target.offsetTop
      requestAnimationFrame(() => {
        jumpingRef.current = false
      })
    }

    const syncCurrent = () => {
      if (jumpingRef.current) return
      const index = nearestIndex()
      const slide = slides[index]
      if (!slide) return
      emit(slide.plant.id)
    }

    const settleLoop = () => {
      if (jumpingRef.current || !looping) return
      const list = slideEls()
      const last = list.length - 1
      if (last < 2) return
      const index = nearestIndex()
      if (index === 0) {
        const target = list[last - 1]
        if (target) jumpTo(target)
        return
      }
      if (index === last) {
        const target = list[1]
        if (target) jumpTo(target)
      }
    }

    let timer = 0
    const onScroll = () => {
      syncCurrent()
      window.clearTimeout(timer)
      timer = window.setTimeout(settleLoop, 80)
    }

    const onKey = (event: KeyboardEvent) => {
      if (document.querySelector('.lightbox, .sheet')) return
      const height = node.clientHeight
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        node.scrollBy({ top: height, behavior: 'smooth' })
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        node.scrollBy({ top: -height, behavior: 'smooth' })
      }
    }

    node.addEventListener('scroll', onScroll, { passive: true })
    node.addEventListener('scrollend', settleLoop)
    window.addEventListener('keydown', onKey)
    return () => {
      node.removeEventListener('scroll', onScroll)
      node.removeEventListener('scrollend', settleLoop)
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(timer)
    }
  }, [looping, slides])

  return (
    <div ref={viewportRef} className="plant-stack" aria-label="Detalhe da planta">
      {slides.map((slide, slot) => (
        <div
          key={`${slide.kind}-${slide.plant.id}-${slot}`}
          className="plant-stack__slide"
          data-plant-id={slide.plant.id}
          data-kind={slide.kind}
        >
          {children(slide.plant, { priority: priorityIds.has(slide.plant.id) })}
        </div>
      ))}
    </div>
  )
}
