<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useAudio } from '@/composables/useAudio'
import { useMusicTheory } from '@/composables/useMusicTheory'
import type { KeyHighlight } from '@/types'

const props = defineProps<{
  startOctave: number
  showLabels: boolean
}>()

const emit = defineEmits<{
  notePlay: [note: string]
}>()

const { playNote: audioPlay } = useAudio()
const { NOTES, NOTE_NAMES_FR, parseNote } = useMusicTheory()

// ---- Key state ----
const highlights = ref<Record<string, Set<string>>>({})

// ---- Keyboard layout detection ----
const CODE_MAP: Record<string, string> = {
  'KeyA': 'C',  'KeyW': 'C#', 'KeyS': 'D',  'KeyE': 'D#', 'KeyD': 'E',
  'KeyF': 'F',  'KeyT': 'F#', 'KeyG': 'G',  'KeyY': 'G#', 'KeyH': 'A',
  'KeyU': 'A#', 'KeyJ': 'B',  'KeyK': 'C+', 'KeyO': 'C#+','KeyL': 'D+',
  'KeyP': 'D#+','Semicolon': 'E+', 'Quote': 'F+',
}

const detectedKeyLabels = ref<Record<string, string>>({})
const pressedKeys = new Set<string>()
const numOctaves = 2

// ---- Computed keys ----
interface WhiteKeyData { note: string; index: number }
interface BlackKeyData { note: string; whiteIndex: number }

function buildKeys(startOct: number) {
  const whites: WhiteKeyData[] = []
  const blacks: BlackKeyData[] = []
  let whiteIdx = 0

  for (let oct = startOct; oct < startOct + numOctaves; oct++) {
    for (let i = 0; i < 12; i++) {
      const noteName = `${NOTES[i]}${oct}`
      const isBlack = NOTES[i]!.includes('#')
      if (isBlack) {
        blacks.push({ note: noteName, whiteIndex: whiteIdx - 1 })
      } else {
        whites.push({ note: noteName, index: whiteIdx })
        whiteIdx++
      }
    }
  }
  // Add the C of the next octave
  whites.push({ note: `C${startOct + numOctaves}`, index: whiteIdx })

  return { whites, blacks }
}

const whiteKeys = ref<WhiteKeyData[]>([])
const blackKeys = ref<BlackKeyData[]>([])

function rebuild() {
  const { whites, blacks } = buildKeys(props.startOctave)
  whiteKeys.value = whites
  blackKeys.value = blacks
}

watch(() => props.startOctave, rebuild)
onMounted(rebuild)

// ---- Key interaction ----
function triggerNote(note: string) {
  audioPlay(note)
  addHighlight(note, 'pressed')
  emit('notePlay', note)
}

function releaseNote(note: string) {
  removeHighlight(note, 'pressed')
}

// ---- Highlight API (exposed) ----
function addHighlight(note: string, cls: KeyHighlight) {
  if (!highlights.value[note]) {
    highlights.value[note] = new Set()
  }
  highlights.value[note].add(cls)
  // Force reactivity
  highlights.value = { ...highlights.value }
}

function removeHighlight(note: string, cls: KeyHighlight) {
  if (highlights.value[note]) {
    highlights.value[note].delete(cls)
    highlights.value = { ...highlights.value }
  }
}

function flashKey(note: string, cls: KeyHighlight, durationMs = 500) {
  addHighlight(note, cls)
  setTimeout(() => removeHighlight(note, cls), durationMs)
}

function clearAllHighlights() {
  highlights.value = {}
}

function keyClasses(note: string): string[] {
  const set = highlights.value[note]
  return set ? [...set] : []
}

function getLabel(note: string): string {
  if (!props.showLabels) return ''
  const parsed = parseNote(note)
  if (!parsed) return ''
  return NOTE_NAMES_FR[parsed.note] ?? ''
}

function blackKeyLeft(whiteIdx: number): string {
  const whiteKeyWidth = 56
  return `${(whiteIdx + 1) * whiteKeyWidth - 18}px`
}

// ---- Physical keyboard ----
async function detectKeyboardLayout() {
  if ((navigator as any).keyboard && (navigator as any).keyboard.getLayoutMap) {
    try {
      const layoutMap = await (navigator as any).keyboard.getLayoutMap()
      for (const code of Object.keys(CODE_MAP)) {
        const key = layoutMap.get(code)
        if (key) detectedKeyLabels.value[code] = key.toUpperCase()
      }
      return
    } catch { /* fallback */ }
  }
  detectedKeyLabels.value = {
    'KeyA': 'A/Q', 'KeyW': 'W/Z', 'KeyS': 'S', 'KeyE': 'E',
    'KeyD': 'D', 'KeyF': 'F', 'KeyT': 'T', 'KeyG': 'G',
    'KeyY': 'Y/Z', 'KeyH': 'H', 'KeyU': 'U', 'KeyJ': 'J', 'KeyK': 'K',
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.repeat) return
  const code = e.code
  if (CODE_MAP[code] && !pressedKeys.has(code)) {
    e.preventDefault()
    pressedKeys.add(code)

    if (e.key && e.key.length === 1) {
      detectedKeyLabels.value[code] = e.key.toUpperCase()
    }

    const noteInfo = CODE_MAP[code]
    let note: string
    if (noteInfo.endsWith('+')) {
      note = noteInfo.replace('+', '') + (props.startOctave + 1)
    } else {
      note = noteInfo + props.startOctave
    }
    triggerNote(note)
  }
}

function handleKeyUp(e: KeyboardEvent) {
  const code = e.code
  if (CODE_MAP[code]) {
    pressedKeys.delete(code)
    const noteInfo = CODE_MAP[code]
    let note: string
    if (noteInfo.endsWith('+')) {
      note = noteInfo.replace('+', '') + (props.startOctave + 1)
    } else {
      note = noteInfo + props.startOctave
    }
    releaseNote(note)
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)
  detectKeyboardLayout()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('keyup', handleKeyUp)
})

// Keyboard hint
const whiteKeyCodes = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK']
const blackKeyCodes = ['KeyW', 'KeyE', 'KeyT', 'KeyY', 'KeyU']

function kbdLabel(code: string): string {
  return detectedKeyLabels.value[code] ?? code.replace('Key', '')
}

// Expose methods for parent
defineExpose({
  highlightKey: addHighlight,
  unhighlightKey: removeHighlight,
  flashKey,
  clearAllHighlights,
})
</script>

<template>
  <section class="piano-section">
    <div class="piano-container">
      <div class="piano">
        <!-- White keys -->
        <div
          v-for="wk in whiteKeys"
          :key="wk.note"
          class="key-white"
          :class="keyClasses(wk.note)"
          @mousedown.prevent="triggerNote(wk.note)"
          @mouseup="releaseNote(wk.note)"
          @mouseleave="releaseNote(wk.note)"
          @touchstart.prevent="triggerNote(wk.note)"
          @touchend="releaseNote(wk.note)"
        >
          <span class="key-label">{{ getLabel(wk.note) }}</span>
        </div>

        <!-- Black keys -->
        <div
          v-for="bk in blackKeys"
          :key="bk.note"
          class="key-black"
          :class="keyClasses(bk.note)"
          :style="{ left: blackKeyLeft(bk.whiteIndex) }"
          @mousedown.prevent="triggerNote(bk.note)"
          @mouseup="releaseNote(bk.note)"
          @mouseleave="releaseNote(bk.note)"
          @touchstart.prevent="triggerNote(bk.note)"
          @touchend="releaseNote(bk.note)"
        >
          <span class="key-label">{{ getLabel(bk.note) }}</span>
        </div>
      </div>
    </div>

    <!-- Keyboard hint -->
    <div class="keyboard-hint">
      <p>
        🎹 Blanches:
        <kbd v-for="c in whiteKeyCodes" :key="c">{{ kbdLabel(c) }}</kbd>
        &nbsp;|&nbsp; ⬛ Noires:
        <kbd v-for="c in blackKeyCodes" :key="c">{{ kbdLabel(c) }}</kbd>
      </p>
      <p class="hint-sub">Layout clavier détecté automatiquement</p>
    </div>
  </section>
</template>

<style scoped>
.piano-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  gap: 20px;
}

.piano-container {
  position: relative;
  user-select: none;
}

.piano {
  display: flex;
  position: relative;
  border-radius: 0 0 var(--radius) var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow), 0 8px 40px rgba(0, 0, 0, 0.5);
}

/* White keys */
.key-white {
  width: 56px;
  height: 220px;
  background: linear-gradient(180deg, #fafafa 0%, #e8e8e8 100%);
  border: 1px solid #c0c0c0;
  border-top: none;
  border-radius: 0 0 6px 6px;
  cursor: pointer;
  position: relative;
  z-index: 1;
  transition: all 0.08s ease;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 12px;
}

.key-white:hover {
  background: linear-gradient(180deg, #f0f0f0 0%, #ddd 100%);
}

.key-white.pressed {
  background: linear-gradient(180deg, var(--white-key-active) 0%, #b8a5ff 100%);
  box-shadow: inset 0 -2px 4px rgba(0, 0, 0, 0.1);
  transform: scaleY(0.99);
}

.key-white.highlight {
  background: linear-gradient(180deg, var(--white-key-highlight) 0%, #a890ff 100%);
  box-shadow: 0 0 20px rgba(108, 92, 231, 0.5);
}

.key-white.correct {
  background: linear-gradient(180deg, #80ffe0 0%, #00cec9 100%) !important;
}

.key-white.wrong {
  background: linear-gradient(180deg, #ffb0b0 0%, #ff6b6b 100%) !important;
}

.key-white .key-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #666;
  pointer-events: none;
}

/* Black keys */
.key-black {
  width: 36px;
  height: 140px;
  background: linear-gradient(180deg, #2d2d3f 0%, #0f0f1f 100%);
  border-radius: 0 0 5px 5px;
  cursor: pointer;
  position: absolute;
  z-index: 2;
  top: 0;
  transition: all 0.08s ease;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4), inset 0 -1px 2px rgba(255, 255, 255, 0.05);
}

.key-black:hover {
  background: linear-gradient(180deg, #3d3d5f 0%, #1f1f3f 100%);
}

.key-black.pressed {
  background: linear-gradient(180deg, var(--primary) 0%, var(--primary-dark) 100%);
  height: 138px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.key-black.highlight {
  background: linear-gradient(180deg, var(--primary-light) 0%, var(--primary) 100%);
  box-shadow: 0 0 20px rgba(108, 92, 231, 0.6);
}

.key-black.correct {
  background: linear-gradient(180deg, #00cec9 0%, #009e9a 100%) !important;
}

.key-black.wrong {
  background: linear-gradient(180deg, #ff6b6b 0%, #cc4444 100%) !important;
}

.key-black .key-label {
  font-size: 0.6rem;
  font-weight: 600;
  color: #aaa;
  pointer-events: none;
}

/* Keyboard hint */
.keyboard-hint {
  text-align: center;
}

.keyboard-hint p {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.hint-sub {
  font-size: 0.7rem !important;
  color: var(--text-muted);
  margin-top: 4px;
}

kbd {
  display: inline-block;
  padding: 2px 7px;
  font-size: 0.75rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 4px;
  margin: 0 1px;
  font-family: inherit;
}

@media (max-width: 900px) {
  .key-white { width: 40px; height: 160px; }
  .key-black { width: 26px; height: 100px; }
}

@media (max-width: 600px) {
  .key-white { width: 32px; height: 130px; }
  .key-black { width: 22px; height: 82px; }
}
</style>
