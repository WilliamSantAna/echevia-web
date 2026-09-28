import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { nearbyPlants, PREFETCH_SPAN, prefetchNearbyPlantMedia } from '../lib/mediaCache'
import type { Plant } from '../types/plant'

type PlantStackProps = {
  plants: Plant[]
  currentId: string
  onCurrentIdChange: (id: string) => void
  children: (plant: Plant) => ReactNode
}

type Drag = {
  id: number
  startX: number
  startY: number
  startScroll: number
  lastY: number
  lastT: number
  vy: number
  axis: 'x' | 'y' | null
  ignore: boolean
}

function notesStealVertical(target: EventTarget | null, dy: number) {
  const body = target instanceof Element ? target.closest('.plant-body') : null
  if (!(body instanceof HTMLElement)) return false
  if (body.scrollHeight - body.clientHeight <= 4) return false
  const atTop = body.scrollTop <= 0
  const atBottom = body.scrollTop + body.clientHeight >= body.scrollHeight - 1
  if (dy > 0 && atTop) return false
  if (dy < 0 && atBottom) return false
  return true
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
    }, behavior === 'smooth' ? 420 : 80)
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

    const dragRef: { current: Drag | null } = { current: null }
    let touchBound = false

    const onTouchMove = (event: TouchEvent) => {
      const drag = dragRef.current
      if (drag?.axis === 'y' && !drag.ignore && event.cancelable) event.preventDefault()
    }

    const bindYTouch = () => {
      if (touchBound) return
      touchBound = true
      node.addEventListener('touchmove', onTouchMove, { capture: true, passive: false })
    }

    const unbindYTouch = () => {
      if (!touchBound) return
      touchBound = false
      node.removeEventListener('touchmove', onTouchMove, true)
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') return
      if (document.querySelector('.lightbox, .sheet')) return
      dragRef.current = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startScroll: node.scrollTop,
        lastY: event.clientY,
        lastT: performance.now(),
        vy: 0,
        axis: null,
        ignore: false,
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || event.pointerId !== drag.id || drag.ignore) return
      const dx = event.clientX - drag.startX
      const dy = event.clientY - drag.startY
      if (!drag.axis) {
        if (Math.hypot(dx, dy) < 10) return
        drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
        if (drag.axis === 'x' || notesStealVertical(event.target, dy)) {
          drag.ignore = true
          return
        }
        bindYTouch()
        node.classList.add('is-dragging')
      }
      if (drag.axis !== 'y') return
      const now = performance.now()
      const elapsed = now - drag.lastT
      if (elapsed > 0) drag.vy = (event.clientY - drag.lastY) / elapsed
      drag.lastY = event.clientY
      drag.lastT = now
      node.scrollTop = drag.startScroll - dy
    }

    const endDrag = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || event.pointerId !== drag.id) return
      dragRef.current = null
      unbindYTouch()
      node.classList.remove('is-dragging')
      if (drag.axis !== 'y' || drag.ignore) return
      const height = node.clientHeight || 1
      let next = Math.round(node.scrollTop / height)
      if (drag.vy < -0.35) next += 1
      if (drag.vy > 0.35) next -= 1
      next = Math.max(0, Math.min(slides.length - 1, next))
      jumpingRef.current = true
      node.scrollTo({ top: next * height, behavior: 'smooth' })
      window.setTimeout(() => {
        jumpingRef.current = false
        settle()
      }, 420)
    }

    node.addEventListener('scroll', onScroll, { passive: true })
    node.addEventListener('scrollend', settle)
    node.addEventListener('pointerdown', onPointerDown)
    node.addEventListener('pointermove', onPointerMove)
    node.addEventListener('pointerup', endDrag)
    node.addEventListener('pointercancel', endDrag)
    window.addEventListener('keydown', onKey)
    return () => {
      node.removeEventListener('scroll', onScroll)
      node.removeEventListener('scrollend', settle)
      node.removeEventListener('pointerdown', onPointerDown)
      node.removeEventListener('pointermove', onPointerMove)
      node.removeEventListener('pointerup', endDrag)
      node.removeEventListener('pointercancel', endDrag)
      window.removeEventListener('keydown', onKey)
      unbindYTouch()
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
