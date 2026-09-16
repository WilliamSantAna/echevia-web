import { useEffect, useRef, type ReactNode } from 'react'

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
    lastX: number
    lastT: number
    vx: number
    axis: 'x' | 'y' | null
    captured: boolean
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
      widthRef.current = Math.max(node.clientWidth, 1)
      layoutSlides(widthRef.current)
      if (!dragRef.current) applyTx(-indexRef.current * widthRef.current, false)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [count])

  useEffect(() => {
    if (dragRef.current) return
    applyTx(-index * widthRef.current, true)
  }, [index])

  useEffect(() => {
    const node = viewportRef.current
    if (!node) return

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      skipTap.current = false
      dragRef.current = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startTx: -indexRef.current * widthRef.current,
        lastX: event.clientX,
        lastT: performance.now(),
        vx: 0,
        axis: allowYRef.current || countRef.current < 2 ? null : 'x',
        captured: false,
      }
      applyTx(txRef.current, false)
    }

    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || event.pointerId !== drag.id) return
      const dx = event.clientX - drag.startX
      const dy = event.clientY - drag.startY
      if (!drag.axis) {
        if (Math.hypot(dx, dy) < 10) return
        drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
        if (drag.axis === 'y' || countRef.current < 2) {
          dragRef.current = null
          return
        }
      }
      if (drag.axis !== 'x') return
      if (event.cancelable) event.preventDefault()
      if (!drag.captured && event.pointerType === 'mouse') {
        node.setPointerCapture(event.pointerId)
        drag.captured = true
      }
      node.classList.add('is-dragging')
      if (Math.hypot(dx, dy) > 8) skipTap.current = true
      const now = performance.now()
      const elapsed = now - drag.lastT
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
      node.classList.remove('is-dragging')
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

    const onTouchMove = (event: TouchEvent) => {
      if (dragRef.current?.axis === 'x' && event.cancelable) event.preventDefault()
    }

    node.addEventListener('pointerdown', onPointerDown)
    node.addEventListener('pointermove', onPointerMove)
    node.addEventListener('pointerup', endDrag)
    node.addEventListener('pointercancel', endDrag)
    node.addEventListener('lostpointercapture', endDrag)
    node.addEventListener('click', onClick)
    node.addEventListener('touchmove', onTouchMove, { passive: false })

    return () => {
      node.removeEventListener('pointerdown', onPointerDown)
      node.removeEventListener('pointermove', onPointerMove)
      node.removeEventListener('pointerup', endDrag)
      node.removeEventListener('pointercancel', endDrag)
      node.removeEventListener('lostpointercapture', endDrag)
      node.removeEventListener('click', onClick)
      node.removeEventListener('touchmove', onTouchMove)
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
