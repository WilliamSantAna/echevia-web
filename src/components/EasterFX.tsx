import { useEffect, useRef } from 'react'
import { useEaster } from '../store/easter'

type Spark = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  hue: number
  size: number
}

const HUES = [0, 12, 32, 48, 88, 122]

export function EasterFX() {
  const { celebrating } = useEaster()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!celebrating) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const sparks: Spark[] = []
    let frame = 0
    let running = true
    let lastBurst = 0

    const resize = () => {
      const parent = canvas.parentElement
      canvas.width = parent?.clientWidth ?? 430
      canvas.height = parent?.clientHeight ?? 800
    }
    resize()

    const burst = (x: number, y: number) => {
      const hue = HUES[Math.floor(Math.random() * HUES.length)]
      for (let i = 0; i < 42; i += 1) {
        const angle = (Math.PI * 2 * i) / 42 + Math.random() * 0.2
        const speed = 1.6 + Math.random() * 3.4
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          hue,
          size: 1.6 + Math.random() * 2.2,
        })
      }
    }

    const draw = (time: number) => {
      if (!running) return
      if (time - lastBurst > 280) {
        lastBurst = time
        burst(40 + Math.random() * (canvas.width - 80), 50 + Math.random() * (canvas.height * 0.55))
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const spark = sparks[i]
        spark.x += spark.vx
        spark.y += spark.vy
        spark.vy += 0.04
        spark.life -= 0.016
        if (spark.life <= 0) {
          sparks.splice(i, 1)
          continue
        }
        ctx.beginPath()
        ctx.fillStyle = `hsla(${spark.hue}, 95%, 58%, ${spark.life})`
        ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2)
        ctx.fill()
      }
      frame = window.requestAnimationFrame(draw)
    }

    frame = window.requestAnimationFrame(draw)
    return () => {
      running = false
      window.cancelAnimationFrame(frame)
    }
  }, [celebrating])

  if (!celebrating) return null

  return (
    <div className="egg-celebrate" aria-live="assertive">
      <canvas ref={canvasRef} className="egg-fireworks" aria-hidden="true" />
      <p className="egg-congrats">Parabens, voce achou a suculenta mais bonita do mundo</p>
    </div>
  )
}
