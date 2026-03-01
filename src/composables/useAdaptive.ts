// ============================================================
// PianoFlow — Adaptive Learning Engine Composable
// Reactive state with localStorage persistence
// ============================================================

import { reactive } from 'vue'
import type {
  AdaptiveState, AdaptiveConfig, AttemptResult,
  AdaptiveMessage, Stats, LessonDefinition,
} from '@/types'
import { useLessons } from './useLessons'

const STORAGE_KEY = 'pianoflow_progress'

const CONFIG: AdaptiveConfig = {
  windowSize: 10,
  promoteThreshold: 0.80,
  demoteThreshold: 0.40,
  xpPerCorrect: 10,
  xpBonusStreak: 5,
  xpPerLevel: 100,
  maxDifficulty: 5,
}

function defaultState(): AdaptiveState {
  return {
    level: 1,
    xp: 0,
    totalXp: 0,
    streak: 0,
    bestStreak: 0,
    difficulty: 1,
    lessonsCompleted: [],
    lessonScores: {},
    history: [],
    sessionsCount: 0,
    totalCorrect: 0,
    totalAttempts: 0,
    lastSessionDate: null,
    dailyStreak: 0,
  }
}

// Singleton reactive state
const state = reactive<AdaptiveState>(defaultState())

// ---- Persistence ----

function save(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('Could not save progress:', e)
  }
}

function load(): void {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<AdaptiveState>
      Object.assign(state, { ...defaultState(), ...parsed })
    }
  } catch (e) {
    console.warn('Could not load progress:', e)
    Object.assign(state, defaultState())
  }
}

function reset(): void {
  Object.assign(state, defaultState())
  save()
}

// ---- Core Logic ----

function recordAttempt(lessonId: string, correct: boolean, responseTimeMs = 0): AttemptResult {
  const attempt = {
    lessonId,
    correct,
    responseTimeMs,
    timestamp: Date.now(),
    difficulty: state.difficulty,
  }

  // Global history
  state.history.push(attempt)
  if (state.history.length > 100) {
    state.history = state.history.slice(-100)
  }

  // Per-lesson stats
  if (!state.lessonScores[lessonId]) {
    state.lessonScores[lessonId] = { attempts: [], bestScore: 0, totalCorrect: 0, totalAttempts: 0 }
  }
  const lessonScore = state.lessonScores[lessonId]
  lessonScore.attempts.push(attempt)
  lessonScore.totalAttempts++
  if (correct) lessonScore.totalCorrect++

  if (lessonScore.attempts.length > 50) {
    lessonScore.attempts = lessonScore.attempts.slice(-50)
  }

  // Global stats
  state.totalAttempts++
  let xpGained = 0

  if (correct) {
    state.totalCorrect++
    state.streak++
    if (state.streak > state.bestStreak) {
      state.bestStreak = state.streak
    }

    xpGained = CONFIG.xpPerCorrect + Math.min(state.streak, 10) * CONFIG.xpBonusStreak
    state.xp += xpGained
    state.totalXp += xpGained

    while (state.xp >= CONFIG.xpPerLevel) {
      state.xp -= CONFIG.xpPerLevel
      state.level++
    }
  } else {
    state.streak = 0
  }

  adaptDifficulty(lessonId)
  save()

  return {
    correct,
    streak: state.streak,
    xp: state.xp,
    totalXp: state.totalXp,
    level: state.level,
    xpGained,
  }
}

function adaptDifficulty(lessonId: string): void {
  const recentAttempts = state.history
    .filter(a => a.lessonId === lessonId)
    .slice(-CONFIG.windowSize)

  if (recentAttempts.length < 3) return

  const successRate = recentAttempts.filter(a => a.correct).length / recentAttempts.length

  if (successRate >= CONFIG.promoteThreshold && state.difficulty < CONFIG.maxDifficulty) {
    state.difficulty++
  } else if (successRate <= CONFIG.demoteThreshold && state.difficulty > 1) {
    state.difficulty--
  }
}

function completeLesson(lessonId: string, score: number): void {
  if (!state.lessonsCompleted.includes(lessonId)) {
    state.lessonsCompleted.push(lessonId)
  }
  if (state.lessonScores[lessonId]) {
    const best = state.lessonScores[lessonId].bestScore
    state.lessonScores[lessonId].bestScore = Math.max(best, score)
  }
  state.sessionsCount++
  save()
}

function getSuccessRate(lessonId: string | null = null): number {
  let attempts
  if (lessonId) {
    attempts = state.history.filter(a => a.lessonId === lessonId).slice(-CONFIG.windowSize)
  } else {
    attempts = state.history.slice(-CONFIG.windowSize)
  }
  if (attempts.length === 0) return 0
  return attempts.filter(a => a.correct).length / attempts.length
}

function getAdaptiveMessage(): AdaptiveMessage {
  const rate = getSuccessRate()
  if (state.history.length < 3) {
    return { icon: '🧠', text: "Adaptatif : le contenu s'ajuste à ton niveau" }
  }
  if (rate >= 0.9) return { icon: '🚀', text: `Excellent ! ${Math.round(rate * 100)}% de réussite — difficulté augmentée` }
  if (rate >= 0.7) return { icon: '👍', text: `Bien joué ! ${Math.round(rate * 100)}% — tu progresses bien` }
  if (rate >= 0.5) return { icon: '💪', text: `Continue ! ${Math.round(rate * 100)}% — la pratique paye` }
  return { icon: '🎯', text: `Pas de stress ! ${Math.round(rate * 100)}% — difficulté ajustée pour toi` }
}

function isLessonUnlocked(lesson: LessonDefinition): boolean {
  return state.level >= lesson.unlockLevel
}

function isLessonCompleted(lessonId: string): boolean {
  return state.lessonsCompleted.includes(lessonId)
}

function getRecommendedLesson(): LessonDefinition | null {
  const { getAllLessons } = useLessons()
  const allLessons = getAllLessons()

  // First: unlocked but not completed
  const available = allLessons.filter(l => isLessonUnlocked(l) && !isLessonCompleted(l.id))
  if (available.length > 0) return available[0]!

  // Fallback: weakest lesson for review
  const unlocked = allLessons.filter(l => isLessonUnlocked(l))
  if (unlocked.length === 0) return allLessons[0] ?? null

  let worst: LessonDefinition = unlocked[0]!
  let worstRate = 1
  for (const l of unlocked) {
    const rate = getSuccessRate(l.id)
    if (rate < worstRate) {
      worstRate = rate
      worst = l
    }
  }
  return worst
}

function getStats(): Stats {
  const { getAllLessons } = useLessons()
  return {
    level: state.level,
    xp: state.xp,
    totalXp: state.totalXp,
    xpToNextLevel: CONFIG.xpPerLevel - state.xp,
    streak: state.streak,
    bestStreak: state.bestStreak,
    difficulty: state.difficulty,
    totalCorrect: state.totalCorrect,
    totalAttempts: state.totalAttempts,
    overallRate: state.totalAttempts > 0 ? state.totalCorrect / state.totalAttempts : 0,
    lessonsCompleted: state.lessonsCompleted.length,
    totalLessons: getAllLessons().length,
    sessionsCount: state.sessionsCount,
  }
}

export function useAdaptive() {
  return {
    state,
    config: CONFIG,
    load,
    save,
    reset,
    recordAttempt,
    completeLesson,
    getSuccessRate,
    getAdaptiveMessage,
    isLessonUnlocked,
    isLessonCompleted,
    getRecommendedLesson,
    getStats,
  }
}
