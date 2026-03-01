// ============================================================
// PianoFlow — Audio Engine Composable
// Web Audio API synthesizer — realistic piano sounds
// ============================================================

interface HarmonicDef {
  ratio: number
  gain: number
  type: OscillatorType
}

interface ActiveNote {
  oscillators: OscillatorNode[]
  gains: GainNode[]
  noteGain: GainNode
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

// Pre-compute all frequencies (C1 → C7, A4 = 440Hz)
const NOTE_FREQUENCIES: Record<string, number> = {}
for (let octave = 1; octave <= 7; octave++) {
  for (let i = 0; i < 12; i++) {
    const note = `${NOTE_NAMES[i]}${octave}`
    const semitonesFromA4 = (octave - 4) * 12 + (i - 9)
    NOTE_FREQUENCIES[note] = 440 * Math.pow(2, semitonesFromA4 / 12)
  }
}

let audioCtx: AudioContext | null = null
let masterGain: GainNode | null = null
let volume = 0.7
let initialized = false
const activeOscillators = new Map<string, ActiveNote>()

function ensureContext(): void {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (!masterGain) {
    masterGain = audioCtx.createGain()
    masterGain.gain.value = volume
    masterGain.connect(audioCtx.destination)
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
}

function init(): void {
  if (initialized) return
  initialized = true

  const unlock = () => {
    ensureContext()
    // Silent buffer to unlock iOS/Safari audio
    const buf = audioCtx!.createBuffer(1, 1, 22050)
    const src = audioCtx!.createBufferSource()
    src.buffer = buf
    src.connect(audioCtx!.destination)
    src.start(0)
  }

  for (const evt of ['click', 'mousedown', 'touchstart', 'keydown'] as const) {
    document.addEventListener(evt, unlock, { once: true })
  }
}

function setVolume(v: number): void {
  volume = v
  if (masterGain) {
    masterGain.gain.value = v
  }
}

function playNote(noteName: string, duration = 2): void {
  ensureContext()

  const freq = NOTE_FREQUENCIES[noteName]
  if (!freq) return

  stopNote(noteName)

  const now = audioCtx!.currentTime
  const noteGain = audioCtx!.createGain()
  noteGain.gain.value = 0.35
  noteGain.connect(masterGain!)

  const harmonics: HarmonicDef[] = [
    { ratio: 1, gain: 1.0, type: 'triangle' },
    { ratio: 2, gain: 0.5, type: 'sine' },
    { ratio: 3, gain: 0.2, type: 'sine' },
    { ratio: 4, gain: 0.1, type: 'sine' },
  ]

  const oscillators: OscillatorNode[] = []
  const gains: GainNode[] = []

  for (const h of harmonics) {
    const osc = audioCtx!.createOscillator()
    const g = audioCtx!.createGain()

    osc.type = h.type
    osc.frequency.value = freq * h.ratio

    // ADSR envelope
    g.gain.setValueAtTime(0.001, now)
    g.gain.linearRampToValueAtTime(h.gain, now + 0.01)
    g.gain.exponentialRampToValueAtTime(h.gain * 0.3, now + 0.4)
    g.gain.exponentialRampToValueAtTime(0.001, now + duration)

    osc.connect(g)
    g.connect(noteGain)
    osc.start(now)
    osc.stop(now + duration + 0.05)

    oscillators.push(osc)
    gains.push(g)
  }

  activeOscillators.set(noteName, { oscillators, gains, noteGain })

  setTimeout(() => {
    try { noteGain.disconnect() } catch { /* already disconnected */ }
    activeOscillators.delete(noteName)
  }, duration * 1000 + 300)
}

function stopNote(noteName: string): void {
  const active = activeOscillators.get(noteName)
  if (!active) return

  const now = audioCtx!.currentTime
  for (const g of active.gains) {
    try {
      g.gain.cancelScheduledValues(now)
      g.gain.setValueAtTime(g.gain.value, now)
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
    } catch { /* noop */ }
  }
  for (const osc of active.oscillators) {
    try { osc.stop(now + 0.1) } catch { /* noop */ }
  }
  setTimeout(() => {
    try { active.noteGain.disconnect() } catch { /* noop */ }
  }, 150)
  activeOscillators.delete(noteName)
}

function playSequence(notes: string[], intervalMs = 500, noteDuration = 1): Promise<void> {
  return new Promise(resolve => {
    notes.forEach((note, i) => {
      setTimeout(() => {
        playNote(note, noteDuration)
        if (i === notes.length - 1) setTimeout(resolve, noteDuration * 1000)
      }, i * intervalMs)
    })
  })
}

function playChord(notes: string[], duration = 2): void {
  for (const note of notes) {
    playNote(note, duration)
  }
}

export function useAudio() {
  return {
    init,
    setVolume,
    playNote,
    stopNote,
    playSequence,
    playChord,
    NOTE_FREQUENCIES,
  }
}
