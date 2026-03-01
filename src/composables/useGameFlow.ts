// ============================================================
// PianoFlow — Game Flow Composable
// Exercise orchestration + gamification state
//
// Architecture:
//   - Owns view state, exercise flow, combo/XP/feedback
//   - Communicates piano feedback via typed PianoFeedback events
//   - Does NOT hold direct refs to UI components
// ============================================================

import { ref, computed, shallowRef } from 'vue'
import type { LessonDefinition, Exercise, AttemptResult, KeyHighlight } from '@/types'
import { useAdaptive } from './useAdaptive'
import { useMusicTheory } from './useMusicTheory'

// ---- Public Types ----

export type ViewState = 'home' | 'exercising' | 'victory'

export interface XpPopup {
  id: number
  amount: number
  bonus: boolean
}

/** Typed contract for piano visual feedback — NO any refs */
export interface PianoFeedback {
  type: 'flash' | 'highlight' | 'clear'
  note?: string
  style?: KeyHighlight
  durationMs?: number
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
  const sessionCorrect = ref(0)   // correct on FIRST attempt
  const sessionTotal = ref(0)
  const collectedNotes = ref<string[]>([])
  const exerciseStartTime = ref(0)
  const isExerciseActive = ref(false)
  const triedWrong = ref(false)    // did the user make a mistake on this exercise?
  const hintNote = ref<string>('')  // note pulsing as guidance

  // ---- Gamification ----
  const combo = ref(0)
  const bestCombo = ref(0)
  const xpPopups = ref<XpPopup[]>([])
  let xpPopupId = 0
  const lastFeedback = ref<'correct' | 'wrong' | ''>('')
  const feedbackText = ref('')
  const leveledUp = ref(false)
  const previousLevel = ref(1)

  // ---- Piano feedback queue (consumed by App.vue) ----
  const pianoFeedbacks = shallowRef<PianoFeedback[]>([])

  function emitPianoFeedback(...events: PianoFeedback[]) {
    pianoFeedbacks.value = [...events]
  }

  // ---- Audio callback (set by App.vue) ----
  let audioPlayNote: ((note: string, duration: number) => void) | null = null
  function setAudioPlayNote(fn: (note: string, duration: number) => void) {
    audioPlayNote = fn
  }

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
    triedWrong.value = false
    hintNote.value = ''
    lastFeedback.value = ''
    feedbackText.value = ''

    emitPianoFeedback({ type: 'clear' })

    // Auto-play for ear training
    if (currentExercise.value.autoPlay) {
      setTimeout(() => {
        audioPlayNote?.(currentExercise.value!.autoPlay!, 1.5)
      }, 500)
    }
  }

  // ---- Note Input ----
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

  // ========================================================
  // SINGLE NOTE — "Scaffold until success"
  //   Wrong → flash red, hint the correct note, WAIT
  //   Right → record, advance
  // ========================================================
  function handleSingleNote(played: string, expected: string) {
    const correct = isSameNote(played, expected, true)

    if (correct) {
      isExerciseActive.value = false // ← guard: ignore further input during transition
      const firstTry = !triedWrong.value
      recordCorrect(played, firstTry)
      hintNote.value = ''

      setTimeout(() => {
        exerciseIndex.value++
        nextExercise()
      }, 800)
    } else {
      // Wrong note — show hint, do NOT advance
      triedWrong.value = true
      lastFeedback.value = 'wrong'
      feedbackText.value = `Essaie ${noteFR(expected)} 🎯`
      hintNote.value = expected

      emitPianoFeedback(
        { type: 'flash', note: played, style: 'wrong', durationMs: 500 },
        { type: 'highlight', note: expected, style: 'highlight' },
      )
    }
  }

  // ========================================================
  // SEQUENCE — "Scaffold note by note"
  //   Wrong → flash red on played, highlight expected, WAIT (don't reset)
  //   Right → advance within sequence
  // ========================================================
  function handleSequenceNote(played: string, expectedSequence: string[]) {
    const currentIdx = collectedNotes.value.length
    const expected = expectedSequence[currentIdx]
    if (!expected) return

    const correct = isSameNote(played, expected, true)

    if (correct) {
      collectedNotes.value.push(played)
      hintNote.value = ''

      emitPianoFeedback({ type: 'flash', note: played, style: 'correct', durationMs: 400 })

      // Update notation to show progress
      updateSequenceNotation(expectedSequence)

      // Sequence complete?
      if (collectedNotes.value.length === expectedSequence.length) {
        isExerciseActive.value = false // ← guard: ignore further input
        const firstTry = !triedWrong.value
        recordCorrect(played, firstTry)

        setTimeout(() => {
          exerciseIndex.value++
          nextExercise()
        }, 1000)
      }
    } else {
      // Wrong note — hint the correct one, DON'T reset the sequence
      triedWrong.value = true
      lastFeedback.value = 'wrong'
      feedbackText.value = `Essaie ${noteFR(expected)} 🎯`
      hintNote.value = expected

      emitPianoFeedback(
        { type: 'flash', note: played, style: 'wrong', durationMs: 400 },
        { type: 'highlight', note: expected, style: 'highlight' },
      )

      // Clear hint after a beat
      setTimeout(() => {
        if (hintNote.value === expected) {
          lastFeedback.value = ''
          feedbackText.value = ''
        }
      }, 1500)
    }
  }

  function updateSequenceNotation(expectedSequence: string[]) {
    const notationParts = expectedSequence.map((n, i) => {
      if (i < collectedNotes.value.length) return '✓'
      if (i === collectedNotes.value.length) return `▸ ${noteFR(n)}`
      return noteFR(n)
    })
    if (currentExercise.value) {
      currentExercise.value = { ...currentExercise.value, notation: notationParts.join(' ') }
    }
  }

  // ========================================================
  // CHORD — "Scaffold until all correct"
  //   Each note: if it belongs to the chord, keep it highlighted
  //   If not, flash red + hint which notes are missing, reset collected
  // ========================================================
  function handleChordNote(played: string, expectedChord: string[]) {
    // Check if this note is part of the chord
    const isPartOfChord = expectedChord.some(e => isSameNote(played, e, true))

    if (isPartOfChord && !collectedNotes.value.some(c => isSameNote(c, played, true))) {
      collectedNotes.value.push(played)
      emitPianoFeedback({ type: 'highlight', note: played, style: 'correct' })

      // Chord complete?
      if (collectedNotes.value.length >= expectedChord.length) {
        isExerciseActive.value = false // ← guard: ignore further input
        const firstTry = !triedWrong.value
        recordCorrect(played, firstTry)
        hintNote.value = ''

        emitPianoFeedback(
          ...expectedChord.map(n => ({ type: 'flash' as const, note: n, style: 'correct' as const, durationMs: 600 }))
        )

        setTimeout(() => {
          exerciseIndex.value++
          nextExercise()
        }, 1000)
      }
    } else if (!isPartOfChord) {
      // Wrong note — hint the missing notes
      triedWrong.value = true
      lastFeedback.value = 'wrong'

      const missing = expectedChord.filter(e =>
        !collectedNotes.value.some(c => isSameNote(c, e, true))
      )
      feedbackText.value = `Il manque ${missing.map(noteFR).join(', ')} 🎯`

      emitPianoFeedback(
        { type: 'flash', note: played, style: 'wrong', durationMs: 500 },
        ...missing.map(n => ({ type: 'highlight' as const, note: n, style: 'highlight' as const })),
      )

      // Clear wrong note from collected, keep the good ones
      // (the played note wasn't added, so nothing to remove)

      setTimeout(() => {
        if (lastFeedback.value === 'wrong') {
          lastFeedback.value = ''
          feedbackText.value = ''
        }
      }, 1500)
    }
    // If they replay a note already collected, ignore silently
  }

  // ========================================================
  // Result recording — only on SUCCESS
  // ========================================================
  function recordCorrect(played: string, firstTry: boolean) {
    const responseTime = Date.now() - exerciseStartTime.value
    // Always record as "correct" in adaptive engine (they eventually got it right)
    const result: AttemptResult = adaptive.recordAttempt(
      currentLesson.value!.id,
      firstTry, // only counts as "correct" for adaptive if first try
      responseTime,
    )

    sessionTotal.value++
    if (firstTry) {
      sessionCorrect.value++
      combo.value++
      if (combo.value > bestCombo.value) bestCombo.value = combo.value

      // XP popup
      spawnXpPopup(result.xpGained, combo.value > 1)
    } else {
      // Combo save: don't reset combo if they eventually got it right
      // But no XP bonus for this exercise
    }

    lastFeedback.value = 'correct'
    feedbackText.value = firstTry ? getCorrectMessage() : 'C\'est ça ! 👍'

    emitPianoFeedback({ type: 'flash', note: played, style: 'correct', durationMs: 600 })

    // Level up detection
    if (result.level > previousLevel.value) {
      leveledUp.value = true
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
    // Skip = count as attempted but wrong
    adaptive.recordAttempt(currentLesson.value!.id, false, 0)
    sessionTotal.value++
    combo.value = 0
    hintNote.value = ''
    exerciseIndex.value++
    nextExercise()
  }

  function finishLesson() {
    isExerciseActive.value = false
    currentExercise.value = null
    hintNote.value = ''

    emitPianoFeedback({ type: 'clear' })

    const score = sessionScore.value
    adaptive.completeLesson(currentLesson.value!.id, score)

    if (adaptive.state.level > previousLevel.value) {
      leveledUp.value = true
    }

    viewState.value = 'victory'
  }

  function goHome() {
    viewState.value = 'home'
    hintNote.value = ''
    selectRecommendedLesson()
    emitPianoFeedback({ type: 'clear' })
  }

  function startNextLesson() {
    selectRecommendedLesson()
    startLesson()
  }

  return {
    // State (readonly from outside)
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
    hintNote,
    pianoFeedbacks,

    // Actions
    selectLesson,
    selectRecommendedLesson,
    startLesson,
    handleNoteInput,
    skipExercise,
    goHome,
    startNextLesson,
    setAudioPlayNote,
  }
}
