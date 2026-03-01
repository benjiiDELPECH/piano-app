// ============================================================
// PianoFlow — Music Theory Composable
// Pure functions, no side effects, fully testable
// ============================================================

import type {
  NoteName, NoteWithOctave, ParsedNote,
  ScaleDefinition, ChordDefinition, MelodyDefinition,
  ScaleType, ChordType,
} from '@/types'

export const NOTES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export const NOTE_NAMES_FR: Record<NoteName, string> = {
  'C': 'Do', 'C#': 'Do#', 'D': 'Ré', 'D#': 'Ré#', 'E': 'Mi',
  'F': 'Fa', 'F#': 'Fa#', 'G': 'Sol', 'G#': 'Sol#', 'A': 'La',
  'A#': 'La#', 'B': 'Si',
}

export const INTERVALS: Record<string, number> = {
  unisson: 0, seconde_mineure: 1, seconde_majeure: 2,
  tierce_mineure: 3, tierce_majeure: 4, quarte: 5,
  triton: 6, quinte: 7, sixte_mineure: 8,
  sixte_majeure: 9, septieme_mineure: 10, septieme_majeure: 11,
  octave: 12,
}

export const INTERVAL_NAMES_FR: Record<number, string> = {
  0: 'Unisson', 1: 'Seconde mineure', 2: 'Seconde majeure',
  3: 'Tierce mineure', 4: 'Tierce majeure', 5: 'Quarte juste',
  6: 'Triton', 7: 'Quinte juste', 8: 'Sixte mineure',
  9: 'Sixte majeure', 10: 'Septième mineure', 11: 'Septième majeure',
  12: 'Octave',
}

export const SCALES: Record<ScaleType, ScaleDefinition> = {
  major: { name: 'Gamme majeure', steps: [0, 2, 4, 5, 7, 9, 11] },
  natural_minor: { name: 'Gamme mineure naturelle', steps: [0, 2, 3, 5, 7, 8, 10] },
  pentatonic_major: { name: 'Pentatonique majeure', steps: [0, 2, 4, 7, 9] },
  pentatonic_minor: { name: 'Pentatonique mineure', steps: [0, 3, 5, 7, 10] },
  blues: { name: 'Gamme blues', steps: [0, 3, 5, 6, 7, 10] },
  chromatic: { name: 'Gamme chromatique', steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
}

export const CHORDS: Record<ChordType, ChordDefinition> = {
  major: { name: 'Majeur', intervals: [0, 4, 7] },
  minor: { name: 'Mineur', intervals: [0, 3, 7] },
  diminished: { name: 'Diminué', intervals: [0, 3, 6] },
  augmented: { name: 'Augmenté', intervals: [0, 4, 8] },
  major7: { name: 'Majeur 7', intervals: [0, 4, 7, 11] },
  minor7: { name: 'Mineur 7', intervals: [0, 3, 7, 10] },
  dom7: { name: '7ème de dominante', intervals: [0, 4, 7, 10] },
  sus2: { name: 'Sus2', intervals: [0, 2, 7] },
  sus4: { name: 'Sus4', intervals: [0, 5, 7] },
}

export const SIMPLE_MELODIES: MelodyDefinition[] = [
  { name: 'Au clair de la lune', notes: ['C4', 'C4', 'C4', 'D4', 'E4', 'D4', 'C4', 'E4', 'D4', 'D4', 'C4'] as NoteWithOctave[] },
  { name: 'Frère Jacques', notes: ['C4', 'D4', 'E4', 'C4', 'C4', 'D4', 'E4', 'C4', 'E4', 'F4', 'G4'] as NoteWithOctave[] },
  { name: 'Joyeux anniversaire', notes: ['C4', 'C4', 'D4', 'C4', 'F4', 'E4', 'C4', 'C4', 'D4', 'C4', 'G4', 'F4'] as NoteWithOctave[] },
  { name: 'Ode à la joie', notes: ['E4', 'E4', 'F4', 'G4', 'G4', 'F4', 'E4', 'D4', 'C4', 'C4', 'D4', 'E4'] as NoteWithOctave[] },
  { name: 'Twinkle Twinkle', notes: ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4'] as NoteWithOctave[] },
]

// ---- Pure Functions ----

export function parseNote(noteStr: string): ParsedNote | null {
  const match = noteStr.match(/^([A-G]#?)(\d)$/)
  if (!match) return null
  return { note: match[1] as NoteName, octave: parseInt(match[2]!) }
}

export function noteFR(note: string): string {
  const parsed = parseNote(note)
  if (!parsed) return NOTE_NAMES_FR[note as NoteName] ?? note
  return NOTE_NAMES_FR[parsed.note] ?? parsed.note
}

export function getScaleNotes(root: NoteName, scaleType: ScaleType, octave = 4): string[] {
  const scale = SCALES[scaleType]
  if (!scale) return []
  const rootIndex = NOTES.indexOf(root)
  if (rootIndex === -1) return []

  return scale.steps.map(step => {
    const noteIndex = (rootIndex + step) % 12
    const noteOctave = octave + Math.floor((rootIndex + step) / 12)
    return `${NOTES[noteIndex]}${noteOctave}`
  })
}

export function getChordNotes(root: NoteName, chordType: ChordType, octave = 4): string[] {
  const chord = CHORDS[chordType]
  if (!chord) return []
  const rootIndex = NOTES.indexOf(root)
  if (rootIndex === -1) return []

  return chord.intervals.map(interval => {
    const noteIndex = (rootIndex + interval) % 12
    const noteOctave = octave + Math.floor((rootIndex + interval) / 12)
    return `${NOTES[noteIndex]}${noteOctave}`
  })
}

export function getInterval(note1: string, note2: string): number {
  const p1 = parseNote(note1)
  const p2 = parseNote(note2)
  if (!p1 || !p2) return 0

  const idx1 = NOTES.indexOf(p1.note) + p1.octave * 12
  const idx2 = NOTES.indexOf(p2.note) + p2.octave * 12
  return Math.abs(idx2 - idx1)
}

export function randomNote(octaveMin = 3, octaveMax = 5, includeBlacks = true): string {
  const octave = octaveMin + Math.floor(Math.random() * (octaveMax - octaveMin + 1))
  const pool = includeBlacks ? NOTES : NOTES.filter(n => !n.includes('#'))
  const note = pool[Math.floor(Math.random() * pool.length)]
  return `${note}${octave}`
}

export function whiteNotes(octave = 4): string[] {
  return NOTES.filter(n => !n.includes('#')).map(n => `${n}${octave}`)
}

export function isSameNote(note1: string, note2: string, ignoreOctave = false): boolean {
  if (ignoreOctave) {
    const p1 = parseNote(note1)
    const p2 = parseNote(note2)
    return p1 !== null && p2 !== null && p1.note === p2.note
  }
  return note1 === note2
}

export function transpose(noteStr: string, semitones: number): string {
  const parsed = parseNote(noteStr)
  if (!parsed) return noteStr
  const idx = NOTES.indexOf(parsed.note)
  const newIdx = idx + semitones
  const newOctave = parsed.octave + Math.floor(newIdx / 12)
  const newNote = NOTES[((newIdx % 12) + 12) % 12]
  return `${newNote}${newOctave}`
}

// Composable wrapper
export function useMusicTheory() {
  return {
    NOTES,
    NOTE_NAMES_FR,
    INTERVALS,
    INTERVAL_NAMES_FR,
    SCALES,
    CHORDS,
    SIMPLE_MELODIES,
    parseNote,
    noteFR,
    getScaleNotes,
    getChordNotes,
    getInterval,
    randomNote,
    whiteNotes,
    isSameNote,
    transpose,
  }
}
