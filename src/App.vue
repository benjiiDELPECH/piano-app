<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { LessonDefinition, Exercise } from '@/types'
import { useAudio } from '@/composables/useAudio'
import { useAdaptive } from '@/composables/useAdaptive'
import { useLessons } from '@/composables/useLessons'
import { useMusicTheory } from '@/composables/useMusicTheory'

import AppHeader from '@/components/AppHeader.vue'
import PianoKeyboard from '@/components/PianoKeyboard.vue'
import ExerciseArea from '@/components/ExerciseArea.vue'
import LessonList from '@/components/LessonList.vue'
import LessonComplete from '@/components/LessonComplete.vue'
import StatsDashboard from '@/components/StatsDashboard.vue'

// ---- Composables ----
const audio = useAudio()
const adaptive = useAdaptive()
const lessons = useLessons()
const { isSameNote, noteFR } = useMusicTheory()

// ---- Refs ----
const pianoRef = ref<InstanceType<typeof PianoKeyboard> | null>(null)

// ---- State ----
const currentLesson = ref<LessonDefinition | null>(null)
const currentExercise = ref<Exercise | null>(null)
const exerciseIndex = ref(0)
const exerciseTotal = ref(0)
const sessionCorrect = ref(0)
const sessionTotal = ref(0)
const collectedNotes = ref<string[]>([])
const exerciseStartTime = ref(0)
const isExerciseActive = ref(false)
const showLessonComplete = ref(false)
const showStatsDashboard = ref(false)
const showExercise = ref(false)
const feedbackText = ref('')
const feedbackClass = ref('')
const exerciseAnimClass = ref('')

// Piano controls
const startOctave = ref(3)
const showLabels = ref(true)
const volume = ref(70)

// ---- View state ----
type ViewState = 'idle' | 'exercising' | 'complete'
const viewState = ref<ViewState>('idle')

// ---- Init ----
onMounted(() => {
  adaptive.load()
  audio.init()
  selectRecommendedLesson()
})

// ---- Lesson Selection ----
function selectLesson(lesson: LessonDefinition) {
  currentLesson.value = lesson
  viewState.value = 'idle'
  showExercise.value = false
  showLessonComplete.value = false
  isExerciseActive.value = false
  pianoRef.value?.clearAllHighlights()
}

function selectRecommendedLesson() {
  const recommended = adaptive.getRecommendedLesson()
  if (recommended) selectLesson(recommended)
}

// ---- Exercise Flow ----
function startCurrentLesson() {
  if (!currentLesson.value) return

  exerciseIndex.value = 0
  exerciseTotal.value = currentLesson.value.exerciseCount
  sessionCorrect.value = 0
  sessionTotal.value = 0
  viewState.value = 'exercising'
  showExercise.value = true
  showLessonComplete.value = false

  nextExercise()
}

function nextExercise() {
  if (exerciseIndex.value >= exerciseTotal.value) {
    finishLesson()
    return
  }

  const difficulty = adaptive.state.difficulty
  currentExercise.value = currentLesson.value!.generateExercise(difficulty)
  collectedNotes.value = []
  exerciseStartTime.value = Date.now()
  isExerciseActive.value = true
  feedbackText.value = ''
  feedbackClass.value = ''
  exerciseAnimClass.value = ''

  pianoRef.value?.clearAllHighlights()

  // Auto-play for ear training
  if (currentExercise.value.autoPlay) {
    setTimeout(() => {
      audio.playNote(currentExercise.value!.autoPlay!, 1.5)
    }, 500)
  }
}

function handleNoteInput(note: string) {
  if (!isExerciseActive.value || !currentExercise.value) return

  const type = currentExercise.value.type
  const expected = currentExercise.value.expectedNotes

  if (type === 'single') {
    handleSingleNote(note, expected[0]!)
  } else if (type === 'sequence') {
    handleSequenceNote(note, expected)
  } else if (type === 'chord') {
    handleChordNote(note, expected)
  }
}

function handleSingleNote(played: string, expected: string) {
  const correct = isSameNote(played, expected, false)

  if (correct) {
    showCorrectFeedback()
    pianoRef.value?.flashKey(played, 'correct', 600)
  } else {
    showWrongFeedback(expected)
    pianoRef.value?.flashKey(played, 'wrong', 600)
    setTimeout(() => pianoRef.value?.flashKey(expected, 'highlight', 800), 400)
  }

  const responseTime = Date.now() - exerciseStartTime.value
  adaptive.recordAttempt(currentLesson.value!.id, correct, responseTime)
  sessionTotal.value++
  if (correct) sessionCorrect.value++

  setTimeout(() => {
    exerciseIndex.value++
    nextExercise()
  }, correct ? 800 : 1500)
}

function handleSequenceNote(played: string, expectedSequence: string[]) {
  const currentIdx = collectedNotes.value.length
  const expected = expectedSequence[currentIdx]
  if (!expected) return

  const correct = isSameNote(played, expected, false)

  if (correct) {
    collectedNotes.value.push(played)
    pianoRef.value?.flashKey(played, 'correct', 400)

    // Update notation to show progress
    const notationParts = expectedSequence.map((n, i) => {
      if (i < collectedNotes.value.length) return '✓'
      if (i === collectedNotes.value.length) return `▸ ${noteFR(n)}`
      return noteFR(n)
    })
    if (currentExercise.value) {
      currentExercise.value = { ...currentExercise.value, notation: notationParts.join(' ') }
    }

    // Sequence complete?
    if (collectedNotes.value.length === expectedSequence.length) {
      showCorrectFeedback('Séquence complète !')
      const responseTime = Date.now() - exerciseStartTime.value
      adaptive.recordAttempt(currentLesson.value!.id, true, responseTime)
      sessionTotal.value++
      sessionCorrect.value++

      setTimeout(() => {
        exerciseIndex.value++
        nextExercise()
      }, 1000)
    }
  } else {
    pianoRef.value?.flashKey(played, 'wrong', 400)
    pianoRef.value?.flashKey(expected, 'highlight', 800)
    showWrongFeedback(expected)

    adaptive.recordAttempt(currentLesson.value!.id, false, Date.now() - exerciseStartTime.value)
    sessionTotal.value++

    // Reset sequence
    setTimeout(() => {
      collectedNotes.value = []
      const notationParts = expectedSequence.map((n, i) => {
        if (i === 0) return `▸ ${noteFR(n)}`
        return noteFR(n)
      })
      if (currentExercise.value) {
        currentExercise.value = { ...currentExercise.value, notation: notationParts.join(' ') }
      }
      feedbackText.value = ''
      feedbackClass.value = ''
      pianoRef.value?.clearAllHighlights()
    }, 1500)
  }
}

function handleChordNote(played: string, expectedChord: string[]) {
  if (!collectedNotes.value.includes(played)) {
    collectedNotes.value.push(played)
    pianoRef.value?.highlightKey(played, 'pressed')
  }

  if (collectedNotes.value.length >= expectedChord.length) {
    const allCorrect = expectedChord.every(expected =>
      collectedNotes.value.some(p => isSameNote(p, expected, false))
    )

    if (allCorrect) {
      showCorrectFeedback('Accord parfait !')
      expectedChord.forEach(n => pianoRef.value?.flashKey(n, 'correct', 600))
      adaptive.recordAttempt(currentLesson.value!.id, true, Date.now() - exerciseStartTime.value)
      sessionCorrect.value++
    } else {
      showWrongFeedback()
      collectedNotes.value.forEach(n => pianoRef.value?.flashKey(n, 'wrong', 600))
      setTimeout(() => {
        expectedChord.forEach(n => pianoRef.value?.flashKey(n, 'highlight', 1000))
      }, 400)
      adaptive.recordAttempt(currentLesson.value!.id, false, Date.now() - exerciseStartTime.value)
    }

    sessionTotal.value++

    setTimeout(() => {
      exerciseIndex.value++
      pianoRef.value?.clearAllHighlights()
      nextExercise()
    }, allCorrect ? 1000 : 1800)
  }
}

function showCorrectFeedback(message = 'Correct ! 🎉') {
  feedbackText.value = message
  feedbackClass.value = 'correct'
  exerciseAnimClass.value = 'anim-pop'
  setTimeout(() => { exerciseAnimClass.value = '' }, 300)
}

function showWrongFeedback(expectedNote?: string) {
  let msg = 'Pas tout à fait...'
  if (expectedNote) {
    msg += ` C'était ${noteFR(expectedNote)}`
  }
  feedbackText.value = msg
  feedbackClass.value = 'wrong'
  exerciseAnimClass.value = 'anim-shake'
  setTimeout(() => { exerciseAnimClass.value = '' }, 300)
}

function skipExercise() {
  if (!isExerciseActive.value) return
  adaptive.recordAttempt(currentLesson.value!.id, false, 0)
  sessionTotal.value++
  exerciseIndex.value++
  nextExercise()
}

function finishLesson() {
  isExerciseActive.value = false
  currentExercise.value = null
  pianoRef.value?.clearAllHighlights()

  const score = sessionTotal.value > 0 ? sessionCorrect.value / sessionTotal.value : 0
  adaptive.completeLesson(currentLesson.value!.id, score)

  viewState.value = 'complete'
  showExercise.value = false
  showLessonComplete.value = true
  showStatsDashboard.value = true
}

function startNextLesson() {
  showLessonComplete.value = false
  selectRecommendedLesson()
  startCurrentLesson()
}

function handleOctaveChange(e: Event) {
  startOctave.value = parseInt((e.target as HTMLSelectElement).value)
}

function handleVolumeChange(e: Event) {
  const v = parseInt((e.target as HTMLInputElement).value)
  volume.value = v
  audio.setVolume(v / 100)
}

function getAdaptiveMessage() {
  return adaptive.getAdaptiveMessage()
}

function getSessionScore() {
  return sessionTotal.value > 0 ? sessionCorrect.value / sessionTotal.value : 0
}
</script>

<template>
  <div id="pianoflow">
    <AppHeader />

    <main class="main-layout">
      <!-- Left panel -->
      <aside class="lesson-panel">
        <div class="lesson-header">
          <h2>{{ currentLesson?.title ?? 'Bienvenue' }}</h2>
          <p class="lesson-description">
            {{ currentLesson?.description ?? 'Clique sur "Commencer" pour démarrer ta première leçon.' }}
          </p>
        </div>

        <!-- Exercise -->
        <ExerciseArea
          v-if="showExercise && currentExercise"
          :exercise="currentExercise"
          :index="exerciseIndex"
          :total="exerciseTotal"
          :feedback-text="feedbackText"
          :feedback-class="feedbackClass"
          :anim-class="exerciseAnimClass"
        />

        <!-- Lesson Complete -->
        <LessonComplete
          v-if="showLessonComplete"
          :score="getSessionScore()"
          :correct="sessionCorrect"
          :total="sessionTotal"
          :stats="adaptive.getStats()"
          @next="startNextLesson"
        />

        <!-- Lesson List -->
        <LessonList
          :lessons="lessons.getAllLessons()"
          :current-lesson-id="currentLesson?.id ?? null"
          @select="selectLesson"
        />

        <!-- Action buttons -->
        <div class="action-buttons">
          <button
            v-if="viewState === 'idle'"
            class="btn-primary"
            @click="startCurrentLesson"
          >
            {{ currentLesson && adaptive.isLessonCompleted(currentLesson.id) ? 'Réviser 🔄' : 'Commencer 🎵' }}
          </button>
          <button
            v-if="viewState === 'exercising'"
            class="btn-secondary"
            @click="skipExercise"
          >
            Passer →
          </button>
        </div>

        <!-- Adaptive info -->
        <div class="adaptive-info">
          <div class="adaptive-badge">
            <span>{{ getAdaptiveMessage().icon }}</span>
            <span>{{ getAdaptiveMessage().text }}</span>
          </div>
        </div>
      </aside>

      <!-- Right: Piano -->
      <div class="piano-area">
        <div class="piano-controls">
          <label>
            Octave:
            <select :value="startOctave" @change="handleOctaveChange">
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </label>
          <label>
            Volume:
            <input type="range" min="0" max="100" :value="volume" @input="handleVolumeChange" />
          </label>
          <label>
            <input type="checkbox" v-model="showLabels" /> Noms des notes
          </label>
        </div>

        <PianoKeyboard
          ref="pianoRef"
          :start-octave="startOctave"
          :show-labels="showLabels"
          @note-play="handleNoteInput"
        />
      </div>
    </main>

    <!-- Stats Dashboard -->
    <StatsDashboard
      v-if="showStatsDashboard"
      :stats="adaptive.getStats()"
      :history="adaptive.state.history"
    />
  </div>
</template>

<style scoped>
.main-layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 0;
  min-height: calc(100vh - 70px);
}

.lesson-panel {
  background: var(--bg-card);
  border-right: 1px solid var(--border);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  max-height: calc(100vh - 70px);
}

.lesson-header h2 {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.lesson-description {
  color: var(--text-muted);
  line-height: 1.6;
  font-size: 0.9rem;
}

.piano-area {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  gap: 20px;
}

.piano-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
}

.piano-controls label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.piano-controls select,
.piano-controls input[type="range"] {
  accent-color: var(--primary);
  background: var(--bg-card);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 4px 8px;
  font-family: inherit;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  width: 100%;
  padding: 10px 20px;
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-secondary:hover {
  background: var(--bg-card-hover);
  color: var(--text);
}

.adaptive-info {
  margin-top: auto;
}

.adaptive-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(108, 92, 231, 0.08);
  border: 1px solid rgba(108, 92, 231, 0.2);
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  color: var(--text-muted);
}

@media (max-width: 900px) {
  .main-layout {
    grid-template-columns: 1fr;
  }
  .lesson-panel {
    max-height: none;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}
</style>
