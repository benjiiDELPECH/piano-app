<script setup lang="ts">
import { computed } from 'vue'
import type { LessonDefinition } from '@/types'
import { useAdaptive } from '@/composables/useAdaptive'

const props = defineProps<{
  recommendedLesson: LessonDefinition | null
  allLessons: LessonDefinition[]
}>()

const emit = defineEmits<{
  start: [lesson: LessonDefinition]
  selectLesson: [lesson: LessonDefinition]
}>()

const adaptive = useAdaptive()
const stats = computed(() => adaptive.getStats())

function getCategoryIcon(cat: string): string {
  const map: Record<string, string> = {
    notes: '🎵', intervals: '📏', scales: '🎶',
    chords: '🎸', melodies: '🎼', ear: '👂',
  }
  return map[cat] ?? '🎵'
}
</script>

<template>
  <div class="home-screen">
    <!-- Hero section -->
    <div class="hero">
      <div class="hero-greeting">
        <h2>Prêt à jouer ? 🎹</h2>
        <p class="hero-sub">Progresse à ton rythme avec l'apprentissage adaptatif</p>
      </div>

      <!-- Daily stats -->
      <div class="daily-stats">
        <div class="daily-stat">
          <span class="daily-value">{{ stats.level }}</span>
          <span class="daily-label">Niveau</span>
        </div>
        <div class="daily-stat highlight">
          <span class="daily-value">{{ stats.streak }} 🔥</span>
          <span class="daily-label">Série</span>
        </div>
        <div class="daily-stat">
          <span class="daily-value">{{ stats.totalXp }}</span>
          <span class="daily-label">XP</span>
        </div>
        <div class="daily-stat">
          <span class="daily-value">{{ stats.lessonsCompleted }}</span>
          <span class="daily-label">Leçons</span>
        </div>
      </div>
    </div>

    <!-- Recommended lesson CTA -->
    <div v-if="recommendedLesson" class="recommended-card" @click="emit('start', recommendedLesson!)">
      <div class="rec-badge">Recommandé</div>
      <div class="rec-content">
        <h3>{{ recommendedLesson.title }}</h3>
        <p>{{ recommendedLesson.description }}</p>
        <div class="rec-meta">
          <span>{{ recommendedLesson.exerciseCount }} exercices</span>
          <span>{{ getCategoryIcon(recommendedLesson.category) }} {{ recommendedLesson.category }}</span>
        </div>
      </div>
      <button class="play-btn">
        <span class="play-icon">▶</span>
        Jouer
      </button>
    </div>

    <!-- XP Progress -->
    <div class="xp-bar-section">
      <div class="xp-bar-header">
        <span>Niveau {{ stats.level }}</span>
        <span>{{ stats.xp }} / {{ stats.xp + stats.xpToNextLevel }} XP</span>
      </div>
      <div class="xp-bar">
        <div
          class="xp-bar-fill"
          :style="{ width: `${(stats.xp / (stats.xp + stats.xpToNextLevel)) * 100}%` }"
        />
      </div>
    </div>

    <!-- Lesson grid -->
    <div class="lessons-section">
      <h3>📚 Parcours</h3>
      <div class="lesson-grid">
        <div
          v-for="lesson in allLessons"
          :key="lesson.id"
          class="lesson-card"
          :class="{
            completed: adaptive.isLessonCompleted(lesson.id),
            locked: !adaptive.isLessonUnlocked(lesson),
            recommended: lesson.id === recommendedLesson?.id,
          }"
          @click="adaptive.isLessonUnlocked(lesson) && emit('selectLesson', lesson)"
        >
          <div class="lesson-card-icon">
            {{ adaptive.isLessonCompleted(lesson.id) ? '✅' : !adaptive.isLessonUnlocked(lesson) ? '🔒' : getCategoryIcon(lesson.category) }}
          </div>
          <div class="lesson-card-title">{{ lesson.title }}</div>
          <div v-if="adaptive.isLessonCompleted(lesson.id)" class="lesson-card-score">
            {{ Math.round(adaptive.getSuccessRate(lesson.id) * 100) }}%
          </div>
          <div v-else-if="!adaptive.isLessonUnlocked(lesson)" class="lesson-card-lock">
            Niv. {{ lesson.unlockLevel }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-screen {
  max-width: 700px;
  margin: 0 auto;
  padding: 24px 20px 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Hero */
.hero {
  text-align: center;
}

.hero h2 {
  font-size: 1.8rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary-light), var(--success));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 6px;
}

.hero-sub {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-bottom: 20px;
}

.daily-stats {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.daily-stat {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 18px;
  min-width: 80px;
  text-align: center;
}

.daily-stat.highlight {
  border-color: var(--warning);
  background: var(--warning-bg);
}

.daily-value {
  display: block;
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--primary-light);
}

.daily-stat.highlight .daily-value {
  color: var(--warning);
}

.daily-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}

/* Recommended card */
.recommended-card {
  background: linear-gradient(135deg, rgba(108, 92, 231, 0.15), rgba(0, 206, 201, 0.1));
  border: 2px solid var(--primary);
  border-radius: var(--radius);
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.recommended-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(108, 92, 231, 0.3);
  border-color: var(--primary-light);
}

.rec-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: var(--primary);
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 12px;
  letter-spacing: 0.5px;
}

.rec-content h3 {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.rec-content p {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 10px;
}

.rec-meta {
  display: flex;
  gap: 16px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.play-btn {
  margin-top: 16px;
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.2s;
  font-family: inherit;
}

.play-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(108, 92, 231, 0.4);
}

.play-icon {
  font-size: 1.3rem;
}

/* XP bar */
.xp-bar-section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 14px 18px;
}

.xp-bar-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.xp-bar {
  height: 8px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
}

.xp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--success));
  border-radius: 4px;
  transition: width 0.6s ease;
}

/* Lessons grid */
.lessons-section h3 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 14px;
}

.lesson-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

.lesson-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.lesson-card:hover:not(.locked) {
  border-color: var(--primary);
  background: var(--bg-card-hover);
  transform: translateY(-1px);
}

.lesson-card.completed {
  border-color: var(--success);
  opacity: 0.85;
}

.lesson-card.locked {
  opacity: 0.35;
  cursor: not-allowed;
}

.lesson-card.recommended {
  border-color: var(--primary);
  box-shadow: 0 0 0 1px var(--primary);
}

.lesson-card-icon {
  font-size: 1.6rem;
  margin-bottom: 6px;
}

.lesson-card-title {
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.3;
}

.lesson-card-score {
  font-size: 0.7rem;
  color: var(--success);
  font-weight: 700;
  margin-top: 4px;
}

.lesson-card-lock {
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-top: 4px;
}

@media (max-width: 600px) {
  .daily-stats { flex-wrap: wrap; }
  .daily-stat { min-width: 70px; padding: 8px 12px; }
  .lesson-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
