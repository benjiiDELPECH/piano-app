// ============================================================
// PianoFlow — Game Flow Composable
// Extracts exercise logic + gamification state from App.vue
// ============================================================

import { ref, computed } from 'vue'
import type { LessonDefinition, Exercise, AttemptResult } from '@/types'
import { useAdaptive } from './useAdaptive'
import { useMusicTheory } from './useMusicTheory'

export type ViewState = 'home' | 'exercising' | 'victory'

export interface XpPopup {
  id: number
  amount: number
  bonus: boolean
}

export function useGameFlow() {
  const adaptive = useAdaptive()
  const { isSameNote, noteFR } = useMusicTheory()

  // ---- View State ----
  const viewState = ref<ViewState>('home')

  // ---- Lesson & Exercise ----
  const currentLesson = ref<LessonDefinition | null>(null)
  const currentExercise = ref<Exercise | null>(null)
  const exerciseIndex = ref(0)
  const exerciseTotal = ref(0)
  const sessionCorrect = ref(0)
  const sessionTotal = ref(0)
  const collectedNotes = ref<string[]>([])
  const exerciseStartTime = ref(0)
  const isExerciseActive = ref(false)

  // ---- Gamification ----
  const combo = ref(0)
  const bestCombo = ref(0)
  const xpPopups = ref<XpPopup[]>([])
  let xpPopupId = 0
  const lastFeedback = ref<'correct' | 'wrong' | ''>('')
  const feedbackText = ref('')
  const leveledUp = ref(false)
  const previousLevel = ref(1)

  // ---- Piano ref (set by App.vue) ----
  let pianoRef: any = null
  function setPianoRef(ref: any) { pianoRef = ref }

  // ---- Audio ref ----
  let audioRef: any = null
  function setAudioRef(ref: any) { audioRef = ref }

  // ---- Computed ----
  const sessionScore = computed(() =>
    sessionTotal.value > 0 ? sessionCorrect.value / sessionTotal.value : 0
  )

  const stars = computed(() => {
    const s = sessionScore.value
    if (s >= 0.85) return 3
    if (s >= 0.60) return 2
    return 1
  })

  const progressDots = computed(() => ({
    current: exerciseIndex.value,
    total: exerciseTotal.value,
  }))

  // ---- Lesson Selection ----
  function selectLesson(lesson: LessonDefinition) {
    currentLesson.value = lesson
  }

  function selectRecommendedLesson() {
    const rec = adaptive.getRecommendedLesson()
    if (rec) currentLesson.value = rec
  }

  // ---- Exercise Flow ----
  function startLesson(lesson?: LessonDefinition) {
    if (lesson) currentLesson.value = lesson
    if (!currentLesson.value) {
      selectRecommendedLesson()
      if (!currentLesson.value) return
    }

    exerciseIndex.value = 0
    exerciseTotal.value = currentLesson.value.exerciseCount
    sessionCorrect.value = 0
    sessionTotal.value = 0
    combo.value = 0
    bestCombo.value = 0
    leveledUp.value = false
    previousLevel.value = adaptive.state.level
    viewState.value = 'exercising'

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
    lastFeedback.value = ''
    feedbackText.value = ''

    pianoRef?.clearAllHighlights()

    // Auto-play for ear training
    if (currentExercise.value.autoPlay) {
      setTimeout(() => {
        audioRef?.playNote(currentExercise.value!.autoPlay!, 1.5)
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
    processResult(correct, played, expected)

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
      pianoRef?.flashKey(played, 'correct', 400)

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
        processResult(true, played)

        setTimeout(() => {
          exerciseIndex.value++
          nextExercise()
        }, 1000)
      }
    } else {
      pianoRef?.flashKey(played, 'wrong', 400)
      pianoRef?.flashKey(expected, 'highlight', 800)
      processResult(false, played, expected)

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
        lastFeedback.value = ''
        feedbackText.value = ''
        pianoRef?.clearAllHighlights()
      }, 1500)
    }
  }

  function handleChordNote(played: string, expectedChord: string[]) {
    if (!collectedNotes.value.includes(played)) {
      collectedNotes.value.push(played)
      pianoRef?.highlightKey(played, 'pressed')
    }

    if (collectedNotes.value.length >= expectedChord.length) {
      const allCorrect = expectedChord.every(expected =>
        collectedNotes.value.some(p => isSameNote(p, expected, false))
      )

      if (allCorrect) {
        expectedChord.forEach(n => pianoRef?.flashKey(n, 'correct', 600))
      } else {
        collectedNotes.value.forEach(n => pianoRef?.flashKey(n, 'wrong', 600))
        setTimeout(() => {
          expectedChord.forEach(n => pianoRef?.flashKey(n, 'highlight', 1000))
        }, 400)
      }

      processResult(allCorrect, played)

      setTimeout(() => {
        exerciseIndex.value++
        pianoRef?.clearAllHighlights()
        nextExercise()
      }, allCorrect ? 1000 : 1800)
    }
  }

  function processResult(correct: boolean, played: string, expected?: string) {
    const responseTime = Date.now() - exerciseStartTime.value
    const result: AttemptResult = adaptive.recordAttempt(currentLesson.value!.id, correct, responseTime)

    sessionTotal.value++

    if (correct) {
      sessionCorrect.value++
      combo.value++
      if (combo.value > bestCombo.value) bestCombo.value = combo.value

      lastFeedback.value = 'correct'
      feedbackText.value = getCorrectMessage()

      pianoRef?.flashKey(played, 'correct', 600)

      // XP popup
      spawnXpPopup(result.xpGained, combo.value > 1)

      // Level up detection
      if (result.level > previousLevel.value) {
        leveledUp.value = true
      }
    } else {
      combo.value = 0
      lastFeedback.value = 'wrong'

      let msg = 'Pas tout à fait...'
      if (expected) msg += ` C'était ${noteFR(expected)}`
      feedbackText.value = msg

      pianoRef?.flashKey(played, 'wrong', 600)
      if (expected) {
        setTimeout(() => pianoRef?.flashKey(expected, 'highlight', 800), 400)
      }
    }
  }

  function getCorrectMessage(): string {
    if (combo.value >= 10) return 'INARRÊTABLE ! 🔥🔥🔥'
    if (combo.value >= 7) return 'En feu ! 🔥🔥'
    if (combo.value >= 5) return 'Combo x5 ! 🔥'
    if (combo.value >= 3) return 'Combo ! ✨'
    const msgs = ['Correct ! 🎉', 'Bien joué ! 👏', 'Parfait ! ⭐', 'Exact ! ✅', 'Bravo ! 💪']
    return msgs[Math.floor(Math.random() * msgs.length)]!
  }

  function spawnXpPopup(amount: number, bonus: boolean) {
    const popup: XpPopup = { id: ++xpPopupId, amount, bonus }
    xpPopups.value.push(popup)
    setTimeout(() => {
      xpPopups.value = xpPopups.value.filter(p => p.id !== popup.id)
    }, 1500)
  }

  function skipExercise() {
    if (!isExerciseActive.value) return
    adaptive.recordAttempt(currentLesson.value!.id, false, 0)
    sessionTotal.value++
    combo.value = 0
    exerciseIndex.value++
    nextExercise()
  }

  function finishLesson() {
    isExerciseActive.value = false
    currentExercise.value = null
    pianoRef?.clearAllHighlights()

    const score = sessionScore.value
    adaptive.completeLesson(currentLesson.value!.id, score)

    if (adaptive.state.level > previousLevel.value) {
      leveledUp.value = true
    }

    viewState.value = 'victory'
  }

  function goHome() {
    viewState.value = 'home'
    selectRecommendedLesson()
  }

  function startNextLesson() {
    selectRecommendedLesson()
    startLesson()
  }

  return {
    // State
    viewState,
    currentLesson,
    currentExercise,
    exerciseIndex,
    exerciseTotal,
    sessionCorrect,
    sessionTotal,
    sessionScore,
    isExerciseActive,
    lastFeedback,
    feedbackText,
    combo,
    bestCombo,
    xpPopups,
    stars,
    progressDots,
    leveledUp,

    // Actions
    selectLesson,
    selectRecommendedLesson,
    startLesson,
    nextExercise,
    handleNoteInput,
    skipExercise,
    goHome,
    startNextLesson,
    setPianoRef,
    setAudioRef,
  }
}
