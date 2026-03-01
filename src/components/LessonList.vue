<script setup lang="ts">
import type { LessonDefinition } from '@/types'
import { useAdaptive } from '@/composables/useAdaptive'

const props = defineProps<{
  lessons: LessonDefinition[]
  currentLessonId: string | null
}>()

const emit = defineEmits<{
  select: [lesson: LessonDefinition]
}>()

const { isLessonUnlocked, isLessonCompleted, getSuccessRate } = useAdaptive()
</script>

<template>
  <div class="lesson-list">
    <h3>📚 Parcours</h3>
    <div class="lesson-items">
      <div
        v-for="lesson in lessons"
        :key="lesson.id"
        class="lesson-item"
        :class="{
          active: lesson.id === currentLessonId,
          completed: isLessonCompleted(lesson.id),
          locked: !isLessonUnlocked(lesson),
        }"
        @click="isLessonUnlocked(lesson) && emit('select', lesson)"
      >
        <span class="lesson-icon">
          {{ isLessonCompleted(lesson.id) ? '✅' : !isLessonUnlocked(lesson) ? '🔒' : '○' }}
        </span>
        <span class="lesson-name">{{ lesson.title }}</span>
        <span class="lesson-status">
          <template v-if="isLessonCompleted(lesson.id)">
            {{ Math.round(getSuccessRate(lesson.id) * 100) }}%
          </template>
          <template v-else-if="!isLessonUnlocked(lesson)">
            Niv. {{ lesson.unlockLevel }}
          </template>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lesson-list h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.lesson-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lesson-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
}

.lesson-item:hover:not(.locked) {
  background: var(--bg-card-hover);
  border-color: var(--primary);
}

.lesson-item.active {
  border-color: var(--primary);
  background: rgba(108, 92, 231, 0.1);
}

.lesson-item.completed {
  border-color: var(--success);
  opacity: 0.8;
}

.lesson-item.locked {
  opacity: 0.4;
  cursor: not-allowed;
}

.lesson-icon {
  font-size: 1.2rem;
  width: 28px;
  text-align: center;
}

.lesson-name {
  flex: 1;
  font-weight: 500;
}

.lesson-status {
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>
