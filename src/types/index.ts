// ============================================================
// PianoFlow — Domain Types
// ============================================================

/** Nom de note sans octave */
export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B'

/** Note avec octave, ex: "C4", "F#3" */
export type NoteWithOctave = `${NoteName}${number}`

/** Note parsée */
export interface ParsedNote {
  note: NoteName
  octave: number
}

// ---- Music Theory ----

export interface ScaleDefinition {
  name: string
  steps: number[]
}

export interface ChordDefinition {
  name: string
  intervals: number[]
}

export interface MelodyDefinition {
  name: string
  notes: NoteWithOctave[]
}

export type ScaleType = 'major' | 'natural_minor' | 'pentatonic_major' | 'pentatonic_minor' | 'blues' | 'chromatic'
export type ChordType = 'major' | 'minor' | 'diminished' | 'augmented' | 'major7' | 'minor7' | 'dom7' | 'sus2' | 'sus4'

// ---- Exercises ----

export type ExerciseType = 'single' | 'sequence' | 'chord'

export interface Exercise {
  prompt: string
  notation: string
  expectedNotes: string[]
  type: ExerciseType
  hint?: string
  autoPlay?: string
  hideNotation?: boolean
}

// ---- Lessons ----

export type LessonCategory = 'notes' | 'intervals' | 'scales' | 'chords' | 'melodies' | 'ear'

export interface LessonDefinition {
  id: string
  title: string
  description: string
  category: LessonCategory
  unlockLevel: number
  exerciseCount: number
  generateExercise: (difficulty: number) => Exercise
}

// ---- Adaptive Engine ----

export interface Attempt {
  lessonId: string
  correct: boolean
  responseTimeMs: number
  timestamp: number
  difficulty: number
}

export interface LessonScore {
  attempts: Attempt[]
  bestScore: number
  totalCorrect: number
  totalAttempts: number
}

export interface AdaptiveState {
  level: number
  xp: number
  totalXp: number
  streak: number
  bestStreak: number
  difficulty: number
  lessonsCompleted: string[]
  lessonScores: Record<string, LessonScore>
  history: Attempt[]
  sessionsCount: number
  totalCorrect: number
  totalAttempts: number
  lastSessionDate: string | null
  dailyStreak: number
}

export interface AdaptiveConfig {
  windowSize: number
  promoteThreshold: number
  demoteThreshold: number
  xpPerCorrect: number
  xpBonusStreak: number
  xpPerLevel: number
  maxDifficulty: number
}

export interface AttemptResult {
  correct: boolean
  streak: number
  xp: number
  totalXp: number
  level: number
  xpGained: number
}

export interface AdaptiveMessage {
  icon: string
  text: string
}

export interface Stats {
  level: number
  xp: number
  totalXp: number
  xpToNextLevel: number
  streak: number
  bestStreak: number
  difficulty: number
  totalCorrect: number
  totalAttempts: number
  overallRate: number
  lessonsCompleted: number
  totalLessons: number
  sessionsCount: number
}

// ---- Piano Keyboard ----

export type KeyHighlight = 'pressed' | 'highlight' | 'correct' | 'wrong'
