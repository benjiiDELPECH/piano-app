<script setup lang="ts">
import type { Stats } from '@/types'

defineProps<{
  score: number
  correct: number
  total: number
  stats: Stats
}>()

const emit = defineEmits<{
  next: []
}>()
</script>

<template>
  <div class="lesson-complete fade-in">
    <div class="complete-icon">🎉</div>
    <h3>Leçon terminée !</h3>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">Score</div>
        <div class="value">{{ Math.round(score * 100) }}%</div>
      </div>
      <div class="stat-card">
        <div class="label">Réussies</div>
        <div class="value">{{ correct }}/{{ total }}</div>
      </div>
      <div class="stat-card">
        <div class="label">Niveau</div>
        <div class="value">{{ stats.level }}</div>
      </div>
      <div class="stat-card">
        <div class="label">XP Total</div>
        <div class="value">{{ stats.totalXp }}</div>
      </div>
    </div>
    <button class="btn-primary" @click="emit('next')">Leçon suivante →</button>
  </div>
</template>

<style scoped>
.lesson-complete {
  text-align: center;
  padding: 24px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.complete-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.lesson-complete h3 {
  font-size: 1.3rem;
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 20px;
}

.stat-card {
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  padding: 12px;
}

.stat-card .label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.stat-card .value {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--primary-light);
}

.btn-primary {
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(108, 92, 231, 0.4);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fadeIn 0.3s ease forwards;
}
</style>
