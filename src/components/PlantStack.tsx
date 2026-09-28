import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'

type PlantStackProps = {
  currentId: string
  looping: boolean
  onCommit: (slot: 0 | 2) => void
  children: ReactNode
}

export function PlantStack({ currentId, looping, onCommit, children }: PlantStackProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const tyRef = useRef(0)
  const heightRef = useRef(1)
  const indexRef = useRef(looping ? 1 : 0)
  const loopingRef = useRef(looping)
  const onCommitRef = useRef(onCommit)
  const lockedRef = useRef(false)
  const dragRef = useRef<{
    id: number
    startY: number
    startX: number
    startTy: number
    lastY: number
    lastT: number
    vy: number
    axis: 'x' | 'y' | null
    captured: boolean
  } | null>(null)

  loopingRef.current = looping
  onCommitRef.current = onCommit
  const restIndex = looping ? 1 : 0

  const applyTy = (value: number, animate: boolean) => {
    tyRef.current = value
    const track = trackRef.current
    if (!track) return
    track.style.transition = animate ? 'transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)' : 'none'
    track.style.transform = `translate3d(0px, ${value}px, 0px)`
  }

  const layoutSlides = (height: number) => {
    const track = trackRef.current
    if (!track) return
    const total = loopingRef.current ? 3 : 1
    track.style.height = `${total * height}px`
    for (const child of Array.from(track.children)) {
      const slide = child as HTMLElement
      slide.style.flex = `0 0 ${height}px`
      slide.style.height = `${height}px`
      slide.style.minHeight = `${height}px`
      slide.style.maxHeight = `${height}px`
    }
  }

  const snapTo = (index: number, animate: boolean) => {
    indexRef.current = index
    applyTy(-index * heightRef.current, animate)
  }

  const goToSlot = (slot: 0 | 2) => {
    if (!loopingRef.current || lockedRef.current) return
    lockedRef.current = true
    snapTo(slot, true)
    window.setTimeout(() => {
      onCommitRef.current(slot)
    }, 380)
  }

  useLayoutEffect(() => {
    const node = viewportRef.current
    if (!node) return
    const measure = () => {
      const height = node.clientHeight
      if (height < 8) return
      heightRef.current = height
      layoutSlides(height)
      if (!dragRef.current) applyTy(-indexRef.current * height, false)
    }
    measure()
    const frame = requestAnimationFrame(measure)
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [looping, currentId])

  useLayoutEffect(() => {
    lockedRef.current = false
    snapTo(restIndex, false)
  }, [currentId, restIndex])

  useEffect(() => {
    const node = viewportRef.current
    if (!node || !looping) return

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      const target = event.target as HTMLElement | null
      if (target?.closest('.sheet, .lightbox, .carousel-dots, button, a')) return
      if (!target?.closest('.carousel-wrap')) return
      dragRef.current = {
        id: event.pointerId,
        startY: event.clientY,
        startX: event.clientX,
        startTy: -indexRef.current * heightRef.current,
        lastY: event.clientY,
        lastT: performance.now(),
        vy: 0,
        axis: null,
        captured: false,
      }
      applyTy(tyRef.current, false)
    }

    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || event.pointerId !== drag.id) return
      const dx = event.clientX - drag.startX
      const dy = event.clientY - drag.startY
      if (!drag.axis) {
        if (Math.hypot(dx, dy) < 10) return
        drag.axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x'
        if (drag.axis === 'x') {
          dragRef.current = null
          return
        }
      }
      if (drag.axis !== 'y' || lockedRef.current) return
      if (event.cancelable) event.preventDefault()
      if (!drag.captured) {
        node.setPointerCapture(event.pointerId)
        drag.captured = true
      }
      node.classList.add('is-dragging')
      const now = performance.now()
      const elapsed = now - drag.lastT
      if (elapsed > 0) drag.vy = (event.clientY - drag.lastY) / elapsed
      drag.lastY = event.clientY
      drag.lastT = now
      const min = -2 * heightRef.current
      applyTy(Math.min(0, Math.max(min, drag.startTy + dy)), false)
    }

    const endDrag = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || event.pointerId !== drag.id) return
      dragRef.current = null
      node.classList.remove('is-dragging')
      if (drag.axis !== 'y' || lockedRef.current) return
      const height = heightRef.current
      let next = Math.round(-tyRef.current / height)
      if (drag.vy < -0.35) next += 1
      if (drag.vy > 0.35) next -= 1
      next = Math.max(0, Math.min(2, next))
      if (next === 0 || next === 2) {
        goToSlot(next)
        return
      }
      snapTo(1, true)
    }

    const onTouchMove = (event: TouchEvent) => {
      if (dragRef.current?.axis === 'y' && event.cancelable) event.preventDefault()
    }

    const onKey = (event: KeyboardEvent) => {
      if (document.querySelector('.lightbox, .sheet')) return
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        goToSlot(2)
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        goToSlot(0)
      }
    }

    node.addEventListener('pointerdown', onPointerDown)
    node.addEventListener('pointermove', onPointerMove)
    node.addEventListener('pointerup', endDrag)
    node.addEventListener('pointercancel', endDrag)
    node.addEventListener('lostpointercapture', endDrag)
    node.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('keydown', onKey)

    return () => {
      node.removeEventListener('pointerdown', onPointerDown)
      node.removeEventListener('pointermove', onPointerMove)
      node.removeEventListener('pointerup', endDrag)
      node.removeEventListener('pointercancel', endDrag)
      node.removeEventListener('lostpointercapture', endDrag)
      node.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKey)
    }
  }, [looping])

  return (
    <div
      ref={viewportRef}
      className={`plant-stack${looping ? ' is-looping' : ''}`}
      aria-label="Detalhe da planta"
    >
      <div ref={trackRef} className="plant-stack__track">
        {children}
      </div>
    </div>
  )
}
