<script setup lang="ts">
import { computed } from 'vue'
import StarRating from './StarRating.vue'
import ConfettiCanvas from './ConfettiCanvas.vue'

const props = defineProps<{
  correct: number
  total: number
  stars: number
  leveledUp: boolean
  xpEarned: number
  newLevel: number
  streak: number
}>()

const emit = defineEmits<{
  next: []
  home: []
}>()

const pct = computed(() => (props.total > 0 ? Math.round((props.correct / props.total) * 100) : 0))

const verdictEmoji = computed(() => {
  if (pct.value >= 90) return '🏆'
  if (pct.value >= 70) return '🎉'
  if (pct.value >= 50) return '💪'
  return '🔁'
})

const verdictText = computed(() => {
  if (pct.value >= 90) return 'Parfait !'
  if (pct.value >= 70) return 'Bien joué !'
  if (pct.value >= 50) return 'Pas mal !'
  return 'Continue !'
})
</script>

<template>
  <div class="victory-screen">
    <!-- Confetti on ≥70% -->
    <ConfettiCanvas v-if="pct >= 70" />

    <!-- Score circle -->
    <div class="score-section">
      <div class="verdict-emoji">{{ verdictEmoji }}</div>
      <h2 class="verdict-text">{{ verdictText }}</h2>

      <div class="score-circle" :class="{ perfect: pct >= 90 }">
        <svg viewBox="0 0 120 120">
          <circle class="track" cx="60" cy="60" r="52" />
          <circle
            class="progress"
            cx="60" cy="60" r="52"
            :stroke-dasharray="`${(pct / 100) * 327} 327`"
          />
        </svg>
        <div class="score-text">
          <span class="score-number">{{ pct }}</span>
          <span class="score-pct">%</span>
        </div>
      </div>

      <p class="score-detail">
        {{ correct }} / {{ total }} bonnes réponses
      </p>
    </div>

    <!-- Stars -->
    <StarRating v-if="stars > 0" :count="stars" />

    <!-- Level up callout -->
    <div v-if="leveledUp" class="levelup-callout">
      <span class="levelup-icon">⬆️</span>
      <div>
        <div class="levelup-title">Niveau {{ newLevel }} débloqué !</div>
        <div class="levelup-sub">De nouvelles leçons t'attendent</div>
      </div>
    </div>

    <!-- Rewards -->
    <div class="rewards-row">
      <div class="reward-badge">
        <span class="reward-icon">⚡</span>
        <span class="reward-value">+{{ xpEarned }} XP</span>
      </div>
      <div v-if="streak >= 2" class="reward-badge streak">
        <span class="reward-icon">🔥</span>
        <span class="reward-value">{{ streak }} série</span>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="action-buttons">
      <button class="btn-primary" @click="emit('next')">
        ▶ Leçon suivante
      </button>
      <button class="btn-secondary" @click="emit('home')">
        🏠 Accueil
      </button>
    </div>
  </div>
</template>

<style scoped>
.victory-screen {
  max-width: 440px;
  margin: 0 auto;
  padding: 40px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  position: relative;
  animation: victory-in 0.6s ease;
}

@keyframes victory-in {
  from { transform: scale(0.9); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}

/* Score section */
.score-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.verdict-emoji {
  font-size: 3rem;
  animation: bounce-emoji 0.6s ease 0.3s;
}

@keyframes bounce-emoji {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-14px); }
}

.verdict-text {
  font-size: 1.6rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary-light), var(--success));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Score circle */
.score-circle {
  position: relative;
  width: 130px;
  height: 130px;
  margin: 8px 0;
}

.score-circle svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.score-circle .track {
  fill: none;
  stroke: var(--border);
  stroke-width: 8;
}

.score-circle .progress {
  fill: none;
  stroke: var(--primary);
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dasharray 1.5s ease 0.5s;
}

.score-circle.perfect .progress {
  stroke: var(--success);
}

.score-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.score-number {
  font-size: 2.4rem;
  font-weight: 900;
  color: var(--primary-light);
}

.score-pct {
  font-size: 1rem;
  color: var(--text-muted);
  margin-left: 2px;
}

.score-detail {
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* Level up */
.levelup-callout {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, rgba(0, 206, 201, 0.15), rgba(108, 92, 231, 0.1));
  border: 1px solid var(--success);
  border-radius: var(--radius-sm);
  padding: 14px 20px;
  animation: glow-pulse 1.5s ease infinite;
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 4px rgba(0, 206, 201, 0.2); }
  50%      { box-shadow: 0 0 20px rgba(0, 206, 201, 0.5); }
}

.levelup-icon {
  font-size: 1.6rem;
}

.levelup-title {
  font-weight: 700;
  font-size: 0.95rem;
}

.levelup-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* Rewards */
.rewards-row {
  display: flex;
  gap: 12px;
}

.reward-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 8px 14px;
  font-size: 0.85rem;
  font-weight: 600;
}

.reward-badge.streak {
  border-color: var(--warning);
  background: var(--warning-bg);
}

.reward-icon {
  font-size: 1.1rem;
}

.reward-value {
  color: var(--primary-light);
}

.reward-badge.streak .reward-value {
  color: var(--warning);
}

/* Buttons */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 320px;
  margin-top: 8px;
}

.btn-primary {
  padding: 14px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(108, 92, 231, 0.4);
}

.btn-secondary {
  padding: 12px;
  background: var(--bg-card);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.btn-secondary:hover {
  border-color: var(--primary);
  background: var(--bg-card-hover);
}
</style>
