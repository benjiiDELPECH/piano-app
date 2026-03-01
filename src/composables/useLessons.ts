// ============================================================
// PianoFlow — Lesson System Composable
// All lesson definitions with typed exercise generators
// ============================================================

import type { LessonDefinition, NoteName, ChordType, ScaleType } from '@/types'
import {
  NOTE_NAMES_FR, NOTES, CHORDS, SIMPLE_MELODIES,
  randomNote, noteFR, getScaleNotes, getChordNotes, transpose,
} from './useMusicTheory'

/** Pick a random element from a non-empty array (avoids T | undefined) */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

const LESSONS: LessonDefinition[] = [
  // ===== NIVEAU 1: Les notes blanches =====
  {
    id: 'white-notes-1',
    title: '🎵 Les notes blanches (Do-Mi)',
    description: 'Apprends à reconnaître et jouer Do, Ré et Mi. Ce sont tes 3 premières notes !',
    category: 'notes',
    unlockLevel: 1,
    exerciseCount: 8,
    generateExercise() {
      const notes: NoteName[] = ['C', 'D', 'E']
      const note = pick(notes)
      return {
        prompt: 'Joue la note :',
        notation: NOTE_NAMES_FR[note],
        expectedNotes: [`${note}4`],
        type: 'single',
        hint: `Cherche ${NOTE_NAMES_FR[note]} sur le clavier`,
      }
    },
  },
  {
    id: 'white-notes-2',
    title: '🎵 Les notes blanches (Fa-Si)',
    description: 'Continue avec Fa, Sol, La et Si pour compléter la gamme.',
    category: 'notes',
    unlockLevel: 1,
    exerciseCount: 10,
    generateExercise() {
      const notes: NoteName[] = ['F', 'G', 'A', 'B']
      const note = pick(notes)
      return {
        prompt: 'Joue la note :',
        notation: NOTE_NAMES_FR[note],
        expectedNotes: [`${note}4`],
        type: 'single',
        hint: `${NOTE_NAMES_FR[note]} est dans la partie droite du clavier`,
      }
    },
  },
  {
    id: 'white-notes-all',
    title: '🎵 Toutes les notes blanches',
    description: 'Mélange de Do à Si. Reconnais-tu toutes les notes ?',
    category: 'notes',
    unlockLevel: 2,
    exerciseCount: 12,
    generateExercise() {
      const notes: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
      const note = pick(notes)
      return {
        prompt: 'Joue la note :',
        notation: NOTE_NAMES_FR[note],
        expectedNotes: [`${note}4`],
        type: 'single',
      }
    },
  },

  // ===== NIVEAU 2: Les dièses =====
  {
    id: 'sharps-intro',
    title: '⬛ Les touches noires (dièses)',
    description: 'Les touches noires sont les dièses (#). Apprends Do#, Ré#, Fa#, Sol#, La#.',
    category: 'notes',
    unlockLevel: 3,
    exerciseCount: 10,
    generateExercise() {
      const notes: NoteName[] = ['C#', 'D#', 'F#', 'G#', 'A#']
      const note = pick(notes)
      return {
        prompt: 'Joue la touche noire :',
        notation: NOTE_NAMES_FR[note],
        expectedNotes: [`${note}4`],
        type: 'single',
        hint: `C'est la touche noire juste à droite de ${NOTE_NAMES_FR[note.replace('#', '') as NoteName]}`,
      }
    },
  },
  {
    id: 'all-notes',
    title: '🎹 Toutes les notes',
    description: 'Blanches et noires mélangées. Tu maîtrises tout le clavier !',
    category: 'notes',
    unlockLevel: 4,
    exerciseCount: 14,
    generateExercise() {
      const note = randomNote(4, 4, true)
      return {
        prompt: 'Joue la note :',
        notation: noteFR(note),
        expectedNotes: [note],
        type: 'single',
      }
    },
  },

  // ===== NIVEAU 3: Octaves & Intervalles =====
  {
    id: 'octaves',
    title: '🔄 Les octaves',
    description: 'Une même note à différentes hauteurs. Joue la note demandée dans la bonne octave.',
    category: 'intervals',
    unlockLevel: 5,
    exerciseCount: 8,
    generateExercise() {
      const notes: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
      const note = pick(notes)
      const octave = 3 + Math.floor(Math.random() * 2)
      return {
        prompt: `Joue cette note dans l'octave ${octave} :`,
        notation: `${NOTE_NAMES_FR[note]}${octave}`,
        expectedNotes: [`${note}${octave}`],
        type: 'single',
        hint: `Octave ${octave} = ${octave === 3 ? 'partie gauche' : 'partie droite'} du clavier`,
      }
    },
  },
  {
    id: 'intervals-basic',
    title: '📏 Intervalles simples',
    description: 'Joue deux notes pour former un intervalle. Commence par les tierces et quintes.',
    category: 'intervals',
    unlockLevel: 6,
    exerciseCount: 8,
    generateExercise() {
      const roots: NoteName[] = ['C', 'D', 'E', 'F', 'G']
      const root = pick(roots)
      const intervals = [
        { semitones: 4, name: 'tierce majeure' },
        { semitones: 7, name: 'quinte juste' },
        { semitones: 3, name: 'tierce mineure' },
      ]
      const interval = pick(intervals)
      const rootNote = `${root}4`
      const targetNote = transpose(rootNote, interval.semitones)

      return {
        prompt: `Joue une ${interval.name} au-dessus de ${noteFR(rootNote)} :`,
        notation: `${noteFR(rootNote)} → ?`,
        expectedNotes: [targetNote],
        type: 'single',
        hint: `${interval.name} = ${interval.semitones} demi-tons au-dessus`,
      }
    },
  },

  // ===== NIVEAU 4: Gammes =====
  {
    id: 'scale-c-major',
    title: '🎶 Gamme de Do majeur',
    description: "La gamme la plus fondamentale ! Joue Do-Ré-Mi-Fa-Sol-La-Si-Do dans l'ordre.",
    category: 'scales',
    unlockLevel: 7,
    exerciseCount: 3,
    generateExercise() {
      const notes = getScaleNotes('C', 'major', 4)
      notes.push('C5')
      return {
        prompt: 'Joue la gamme de Do majeur (montante) :',
        notation: notes.map(n => noteFR(n)).join(' '),
        expectedNotes: notes,
        type: 'sequence',
        hint: 'Seulement les touches blanches, de Do à Do !',
      }
    },
  },
  {
    id: 'scale-major-other',
    title: '🎶 Gammes majeures variées',
    description: 'Joue des gammes majeures dans différentes tonalités.',
    category: 'scales',
    unlockLevel: 8,
    exerciseCount: 4,
    generateExercise() {
      const roots: NoteName[] = ['G', 'F', 'D', 'A']
      const root = pick(roots)
      const notes = getScaleNotes(root, 'major', 4)
      return {
        prompt: `Joue la gamme de ${NOTE_NAMES_FR[root]} majeur :`,
        notation: notes.map(n => noteFR(n)).join(' '),
        expectedNotes: notes,
        type: 'sequence',
      }
    },
  },
  {
    id: 'scale-minor',
    title: '🎶 Gammes mineures',
    description: 'Les gammes mineures ont un caractère plus sombre, mélancolique.',
    category: 'scales',
    unlockLevel: 9,
    exerciseCount: 4,
    generateExercise() {
      const roots: NoteName[] = ['A', 'D', 'E', 'C']
      const root = pick(roots)
      const notes = getScaleNotes(root, 'natural_minor', 4)
      return {
        prompt: `Joue la gamme de ${NOTE_NAMES_FR[root]} mineur :`,
        notation: notes.map(n => noteFR(n)).join(' '),
        expectedNotes: notes,
        type: 'sequence',
      }
    },
  },

  // ===== NIVEAU 5: Accords =====
  {
    id: 'chords-major',
    title: '🎸 Accords majeurs',
    description: 'Un accord = 3+ notes jouées ensemble. Les accords majeurs sonnent "joyeux".',
    category: 'chords',
    unlockLevel: 10,
    exerciseCount: 6,
    generateExercise() {
      const roots: NoteName[] = ['C', 'F', 'G', 'D', 'A']
      const root = pick(roots)
      const notes = getChordNotes(root, 'major', 4)
      return {
        prompt: `Joue l'accord de ${NOTE_NAMES_FR[root]} majeur :`,
        notation: notes.map(n => noteFR(n)).join(' + '),
        expectedNotes: notes,
        type: 'chord',
        hint: `${NOTE_NAMES_FR[root]} + tierce majeure + quinte`,
      }
    },
  },
  {
    id: 'chords-minor',
    title: '🎸 Accords mineurs',
    description: 'Les accords mineurs ont un son plus sombre et émouvant.',
    category: 'chords',
    unlockLevel: 11,
    exerciseCount: 6,
    generateExercise() {
      const roots: NoteName[] = ['A', 'D', 'E', 'C', 'G']
      const root = pick(roots)
      const notes = getChordNotes(root, 'minor', 4)
      return {
        prompt: `Joue l'accord de ${NOTE_NAMES_FR[root]} mineur :`,
        notation: notes.map(n => noteFR(n)).join(' + '),
        expectedNotes: notes,
        type: 'chord',
        hint: `${NOTE_NAMES_FR[root]} + tierce mineure + quinte`,
      }
    },
  },

  // ===== NIVEAU 6: Mélodies =====
  {
    id: 'melody-simple',
    title: '🎼 Mélodies simples',
    description: 'Joue des mélodies célèbres note par note !',
    category: 'melodies',
    unlockLevel: 12,
    exerciseCount: 3,
    generateExercise(difficulty) {
      const melody = pick(SIMPLE_MELODIES)
      const noteCount = Math.min(6 + difficulty * 2, melody.notes.length)
      const notes = melody.notes.slice(0, noteCount) as string[]
      return {
        prompt: `Joue "${melody.name}" :`,
        notation: notes.map(n => noteFR(n)).join(' '),
        expectedNotes: notes,
        type: 'sequence',
      }
    },
  },

  // ===== NIVEAU 7: Entraînement oreille =====
  {
    id: 'ear-training',
    title: "👂 Entraînement de l'oreille",
    description: 'Écoute une note jouée automatiquement, puis rejoue-la !',
    category: 'ear',
    unlockLevel: 13,
    exerciseCount: 8,
    generateExercise(difficulty) {
      const whiteOnly: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
      const pool = difficulty > 2 ? NOTES : whiteOnly
      const note = pick(pool)
      const fullNote = `${note}4`
      return {
        prompt: '🔊 Écoute bien, puis rejoue la note !',
        notation: '?',
        expectedNotes: [fullNote],
        type: 'single',
        autoPlay: fullNote,
        hideNotation: true,
      }
    },
  },

  // ===== NIVEAU 8: Pentatonique =====
  {
    id: 'pentatonic',
    title: '🎸 Gamme pentatonique',
    description: 'La gamme la plus utilisée en improvisation ! 5 notes magiques.',
    category: 'scales',
    unlockLevel: 14,
    exerciseCount: 4,
    generateExercise() {
      const roots: NoteName[] = ['C', 'A', 'G', 'E']
      const root = pick(roots)
      const scaleType: ScaleType = Math.random() > 0.5 ? 'pentatonic_major' : 'pentatonic_minor'
      const notes = getScaleNotes(root, scaleType, 4)
      const typeName = scaleType === 'pentatonic_major' ? 'majeure' : 'mineure'
      return {
        prompt: `Joue la pentatonique ${typeName} de ${NOTE_NAMES_FR[root]} :`,
        notation: notes.map(n => noteFR(n)).join(' '),
        expectedNotes: notes,
        type: 'sequence',
      }
    },
  },

  // ===== NIVEAU 9: Accords 7ème =====
  {
    id: 'chords-7th',
    title: '🎸 Accords de 7ème',
    description: 'Enrichis tes accords avec la septième pour un son jazz/blues.',
    category: 'chords',
    unlockLevel: 15,
    exerciseCount: 5,
    generateExercise() {
      const roots: NoteName[] = ['C', 'G', 'D', 'F', 'A']
      const root = pick(roots)
      const types: ChordType[] = ['major7', 'minor7', 'dom7']
      const chordType = pick(types)
      const notes = getChordNotes(root, chordType, 4)
      const chordName = CHORDS[chordType].name
      return {
        prompt: `Joue l'accord ${NOTE_NAMES_FR[root]} ${chordName} :`,
        notation: notes.map(n => noteFR(n)).join(' + '),
        expectedNotes: notes,
        type: 'chord',
      }
    },
  },
]

export function useLessons() {
  function getAllLessons(): LessonDefinition[] {
    return LESSONS
  }

  function getLessonById(id: string): LessonDefinition | undefined {
    return LESSONS.find(l => l.id === id)
  }

  function getLessonsForLevel(level: number): LessonDefinition[] {
    return LESSONS.filter(l => l.unlockLevel <= level)
  }

  return {
    getAllLessons,
    getLessonById,
    getLessonsForLevel,
  }
}
