<script setup lang="ts">
import type { Exercise } from '@/types'

const props = defineProps<{
  exercise: Exercise
  index: number
  total: number
  feedbackText: string
  feedbackClass: string
  animClass: string
}>()
</script>

<template>
  <div class="exercise-area" :class="animClass">
    <div class="exercise-prompt">{{ exercise.prompt }}</div>
    <div class="exercise-notation">
      {{ exercise.hideNotation ? '🔊 Écoute...' : exercise.notation }}
    </div>
    <div
      v-if="feedbackText"
      class="exercise-feedback"
      :class="feedbackClass"
    >
      {{ feedbackText }}
    </div>
    <div class="exercise-progress-bar">
      <div
        class="exercise-progress-fill"
        :style="{ width: `${(index / total) * 100}%` }"
      />
    </div>
    <p class="exercise-counter">{{ index + 1 }} / {{ total }}</p>
  </div>
</template>

<style scoped>
.exercise-area {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
}

.exercise-prompt {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 12px;
  min-height: 30px;
}

.exercise-notation {
  font-size: 2.5rem;
  font-weight: 800;
  text-align: center;
  padding: 20px;
  color: var(--primary-light);
  letter-spacing: 4px;
}

.exercise-feedback {
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  padding: 8px;
  margin-top: 8px;
  transition: all 0.3s ease;
}

.exercise-feedback.correct {
  background: var(--success-bg);
  color: var(--success);
}

.exercise-feedback.wrong {
  background: var(--error-bg);
  color: var(--error);
}

.exercise-progress-bar {
  width: 100%;
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  margin-top: 16px;
  overflow: hidden;
}

.exercise-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--success));
  border-radius: 3px;
  transition: width 0.4s ease;
}

.exercise-counter {
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 6px;
}

/* Animations */
@keyframes pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.anim-pop {
  animation: pop 0.3s ease;
}

.anim-shake {
  animation: shake 0.3s ease;
}
</style>
