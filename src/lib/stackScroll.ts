const inertia = new WeakMap<HTMLElement, number>()

export function stopStackInertia(node: HTMLElement) {
  const frame = inertia.get(node)
  if (frame) cancelAnimationFrame(frame)
  inertia.delete(node)
}

export function startStackInertia(node: HTMLElement, vyPxPerMs: number) {
  stopStackInertia(node)
  let velocity = Math.max(-2.8, Math.min(2.8, vyPxPerMs))
  if (Math.abs(velocity) < 0.08) return
  let last = performance.now()
  const tick = (now: number) => {
    const dt = Math.min(32, now - last)
    last = now
    node.scrollTop -= velocity * dt
    velocity *= Math.exp(-dt / 260)
    if (Math.abs(velocity) < 0.04) {
      inertia.delete(node)
      return
    }
    inertia.set(node, requestAnimationFrame(tick))
  }
  inertia.set(node, requestAnimationFrame(tick))
}

export function closestPlantStack(node: Element | null): HTMLElement | null {
  return node?.closest('.plant-stack') ?? null
}
