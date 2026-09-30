import { useEffect, useRef, type ReactNode } from 'react'
import { closestPlantStack, startStackInertia, stopStackInertia } from '../lib/stackScroll'

type SwipePagerProps = {
  index: number
  count: number
  onIndexChange: (index: number) => void
  className?: string
  allowVerticalScroll?: boolean
  onTap?: () => void
  children: ReactNode
}

export function SwipePager({
  index,
  count,
  onIndexChange,
  className = '',
  allowVerticalScroll = false,
  onTap,
  children,
}: SwipePagerProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const txRef = useRef(0)
  const indexRef = useRef(index)
  const widthRef = useRef(1)
  const countRef = useRef(count)
  const allowYRef = useRef(allowVerticalScroll)
  const onIndexChangeRef = useRef(onIndexChange)
  const onTapRef = useRef(onTap)
  const skipTap = useRef(false)
  const dragRef = useRef<{
    id: number
    startX: number
    startY: number
    startTx: number
    startScroll: number
    lastX: number
    lastY: number
    lastT: number
    vx: number
    vy: number
    axis: 'x' | 'y' | null
    captured: boolean
    stack: HTMLElement | null
  } | null>(null)

  indexRef.current = index
  countRef.current = count
  allowYRef.current = allowVerticalScroll
  onIndexChangeRef.current = onIndexChange
  onTapRef.current = onTap

  const applyTx = (value: number, animate: boolean) => {
    txRef.current = value
    const track = trackRef.current
    if (!track) return
    track.style.transition = animate ? 'transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)' : 'none'
    track.style.transform = `translate3d(${value}px, 0px, 0px)`
  }

  const layoutSlides = (width: number) => {
    const track = trackRef.current
    if (!track) return
    const total = Math.max(countRef.current, 1)
    track.style.width = `${total * width}px`
    for (const child of Array.from(track.children)) {
      const slide = child as HTMLElement
      slide.style.flex = `0 0 ${width}px`
      slide.style.width = `${width}px`
    }
  }

  useEffect(() => {
    const node = viewportRef.current
    if (!node) return
    const measure = () => {
      const width = node.clientWidth
      if (width < 8) return
      widthRef.current = width
      layoutSlides(width)
      if (!dragRef.current) applyTx(-indexRef.current * width, false)
    }
    measure()
    const frame = requestAnimationFrame(measure)
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    window.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('resize', measure)
    }
  }, [count])

  useEffect(() => {
    if (dragRef.current) return
    applyTx(-index * widthRef.current, true)
  }, [index])

  useEffect(() => {
    const node = viewportRef.current
    if (!node) return

    let touchBound = false
    const onTouchMove = (event: TouchEvent) => {
      const axis = dragRef.current?.axis
      if ((axis === 'x' || axis === 'y') && event.cancelable) event.preventDefault()
    }
    const bindTouch = () => {
      if (touchBound) return
      touchBound = true
      node.addEventListener('touchmove', onTouchMove, { passive: false })
    }
    const unbindTouch = () => {
      if (!touchBound) return
      touchBound = false
      node.removeEventListener('touchmove', onTouchMove)
    }

    const capturePointer = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || drag.captured) return
      try {
        node.setPointerCapture(event.pointerId)
        drag.captured = true
      } catch {
        // Pointer already released.
      }
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      skipTap.current = false
      const stack = allowYRef.current ? closestPlantStack(node) : null
      if (stack) stopStackInertia(stack)
      dragRef.current = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startTx: -indexRef.current * widthRef.current,
        startScroll: stack?.scrollTop ?? 0,
        lastX: event.clientX,
        lastY: event.clientY,
        lastT: performance.now(),
        vx: 0,
        vy: 0,
        axis: allowYRef.current || countRef.current < 2 ? null : 'x',
        captured: false,
        stack,
      }
      applyTx(txRef.current, false)
      if (event.pointerType !== 'mouse') capturePointer(event)
    }

    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || event.pointerId !== drag.id) return
      const dx = event.clientX - drag.startX
      const dy = event.clientY - drag.startY
      if (!drag.axis) {
        if (Math.hypot(dx, dy) < 10) return
        drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
        if (drag.axis === 'x' && countRef.current < 2) drag.axis = 'y'
        if (drag.axis === 'x' && !allowYRef.current && countRef.current < 2) {
          dragRef.current = null
          return
        }
        capturePointer(event)
        bindTouch()
      }
      if (Math.hypot(dx, dy) > 8) skipTap.current = true
      const now = performance.now()
      const elapsed = now - drag.lastT
      if (drag.axis === 'y') {
        if (!drag.stack) return
        if (event.cancelable) event.preventDefault()
        if (elapsed > 0) drag.vy = (event.clientY - drag.lastY) / elapsed
        drag.lastY = event.clientY
        drag.lastT = now
        drag.stack.scrollTop = drag.startScroll - dy
        return
      }
      if (drag.axis !== 'x') return
      if (event.cancelable) event.preventDefault()
      if (!drag.captured && event.pointerType === 'mouse') capturePointer(event)
      node.classList.add('is-dragging')
      if (elapsed > 0) drag.vx = (event.clientX - drag.lastX) / elapsed
      drag.lastX = event.clientX
      drag.lastT = now
      const min = -(countRef.current - 1) * widthRef.current
      applyTx(Math.min(0, Math.max(min, drag.startTx + dx)), false)
    }

    const endDrag = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || event.pointerId !== drag.id) return
      dragRef.current = null
      unbindTouch()
      node.classList.remove('is-dragging')
      if (drag.axis === 'y') {
        if (drag.stack) startStackInertia(drag.stack, drag.vy)
        return
      }
      if (drag.axis !== 'x') return
      const width = widthRef.current
      let next = Math.round(-txRef.current / width)
      if (drag.vx < -0.35) next += 1
      if (drag.vx > 0.35) next -= 1
      next = Math.max(0, Math.min(countRef.current - 1, next))
      applyTx(-next * width, true)
      if (next !== indexRef.current) onIndexChangeRef.current(next)
    }

    const onClick = () => {
      if (skipTap.current) return
      onTapRef.current?.()
    }

    node.addEventListener('pointerdown', onPointerDown)
    node.addEventListener('pointermove', onPointerMove)
    node.addEventListener('pointerup', endDrag)
    node.addEventListener('pointercancel', endDrag)
    node.addEventListener('lostpointercapture', endDrag)
    node.addEventListener('click', onClick)

    return () => {
      node.removeEventListener('pointerdown', onPointerDown)
      node.removeEventListener('pointermove', onPointerMove)
      node.removeEventListener('pointerup', endDrag)
      node.removeEventListener('pointercancel', endDrag)
      node.removeEventListener('lostpointercapture', endDrag)
      node.removeEventListener('click', onClick)
      unbindTouch()
    }
  }, [])

  return (
    <div ref={viewportRef} className={`swipe-pager${className ? ` ${className}` : ''}`}>
      <div ref={trackRef} className="swipe-pager__track">
        {children}
      </div>
    </div>
  )
}
