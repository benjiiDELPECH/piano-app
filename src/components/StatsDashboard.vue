<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Stats, AdaptiveState } from '@/types'

const props = defineProps<{
  stats: Stats
  history: AdaptiveState['history']
}>()

const canvas = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  drawChart()
})

function drawChart() {
  if (!canvas.value) return
  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  const history = props.history
  if (history.length < 2) return

  const width = canvas.value.width
  const height = canvas.value.height
  ctx.clearRect(0, 0, width, height)

  // Sliding success rate
  const windowSize = 5
  const rates: number[] = []
  for (let i = windowSize; i <= history.length; i++) {
    const win = history.slice(i - windowSize, i)
    rates.push(win.filter(a => a.correct).length / win.length)
  }

  if (rates.length < 2) return

  const padding = 30
  const chartW = width - padding * 2
  const chartH = height - padding * 2

  // Grid lines
  ctx.strokeStyle = '#2a2a3e'
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = padding + (chartH / 4) * i
    ctx.beginPath()
    ctx.moveTo(padding, y)
    ctx.lineTo(width - padding, y)
    ctx.stroke()
  }

  // Labels
  ctx.fillStyle = '#8888a8'
  ctx.font = '11px Inter'
  ctx.textAlign = 'right'
  ctx.fillText('100%', padding - 5, padding + 4)
  ctx.fillText('50%', padding - 5, padding + chartH / 2 + 4)
  ctx.fillText('0%', padding - 5, padding + chartH + 4)

  // Line
  ctx.beginPath()
  ctx.strokeStyle = '#6c5ce7'
  ctx.lineWidth = 2.5
  ctx.lineJoin = 'round'

  rates.forEach((rate, i) => {
    const x = padding + (i / (rates.length - 1)) * chartW
    const y = padding + (1 - rate) * chartH
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()

  // Gradient fill
  const gradient = ctx.createLinearGradient(0, padding, 0, padding + chartH)
  gradient.addColorStop(0, 'rgba(108, 92, 231, 0.3)')
  gradient.addColorStop(1, 'rgba(108, 92, 231, 0.0)')

  ctx.lineTo(padding + chartW, padding + chartH)
  ctx.lineTo(padding, padding + chartH)
  ctx.closePath()
  ctx.fillStyle = gradient
  ctx.fill()

  // Title
  ctx.fillStyle = '#e8e8f0'
  ctx.font = '12px Inter'
  ctx.textAlign = 'center'
  ctx.fillText('Progression du taux de réussite', width / 2, height - 5)
}
</script>

<template>
  <section class="stats-dashboard">
    <h3>📊 Tableau de bord</h3>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">Niveau</div>
        <div class="value">{{ stats.level }}</div>
      </div>
      <div class="stat-card">
        <div class="label">XP Total</div>
        <div class="value">{{ stats.totalXp }}</div>
      </div>
      <div class="stat-card">
        <div class="label">Taux de réussite</div>
        <div class="value">{{ Math.round(stats.overallRate * 100) }}%</div>
      </div>
      <div class="stat-card">
        <div class="label">Meilleure série</div>
        <div class="value">{{ stats.bestStreak }} 🔥</div>
      </div>
      <div class="stat-card">
        <div class="label">Leçons complétées</div>
        <div class="value">{{ stats.lessonsCompleted }} / {{ stats.totalLessons }}</div>
      </div>
      <div class="stat-card">
        <div class="label">Total exercices</div>
        <div class="value">{{ stats.totalAttempts }}</div>
      </div>
      <div class="stat-card">
        <div class="label">Sessions</div>
        <div class="value">{{ stats.sessionsCount }}</div>
      </div>
      <div class="stat-card">
        <div class="label">Difficulté</div>
        <div class="value">{{ '⭐'.repeat(stats.difficulty) }}</div>
      </div>
    </div>
    <canvas ref="canvas" width="600" height="200" />
  </section>
</template>

<style scoped>
.stats-dashboard {
  padding: 24px 28px;
  border-top: 1px solid var(--border);
}

.stats-dashboard h3 {
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 16px;
  text-align: center;
}

.stat-card .label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-card .value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--primary-light);
  margin-top: 4px;
}

canvas {
  width: 100%;
  max-width: 600px;
  display: block;
  margin: 0 auto;
}
</style>
