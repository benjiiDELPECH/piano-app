<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const canvas = ref<HTMLCanvasElement | null>(null)
let animId = 0

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
  rotation: number
  rotSpeed: number
}

const COLORS = ['#6c5ce7', '#a29bfe', '#00cec9', '#feca57', '#ff6b6b', '#fd79a8', '#55efc4', '#fdcb6e']

function fire(cvs: HTMLCanvasElement) {
  const ctx = cvs.getContext('2d')!
  if (!ctx) return

  cvs.width = cvs.offsetWidth * 2
  cvs.height = cvs.offsetHeight * 2
  ctx.scale(2, 2)

  const w = cvs.offsetWidth
  const h = cvs.offsetHeight
  const particles: Particle[] = []

  for (let i = 0; i < 80; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 3 + Math.random() * 8
    particles.push({
      x: w / 2,
      y: h / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      size: 3 + Math.random() * 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
      alpha: 1,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
    })
  }

  let frame = 0
  const maxFrames = 120

  function animate() {
    if (frame >= maxFrames) {
      ctx.clearRect(0, 0, w, h)
      return
    }

    ctx.clearRect(0, 0, w, h)

    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.15 // gravity
      p.alpha -= 0.008
      p.rotation += p.rotSpeed
      p.vx *= 0.99

      if (p.alpha <= 0) continue

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.globalAlpha = Math.max(0, p.alpha)
      ctx.fillStyle = p.color

      // Mix of rectangles and circles
      if (p.size > 5) {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
      } else {
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
    }

    frame++
    animId = requestAnimationFrame(animate)
  }

  animate()
}

onMounted(() => {
  if (canvas.value) {
    setTimeout(() => fire(canvas.value!), 200)
  }
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
})
</script>

<template>
  <canvas ref="canvas" class="confetti-canvas" />
</template>

<style scoped>
.confetti-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 300;
}
</style>
