<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAudio } from '@/composables/useAudio'
import { useAdaptive } from '@/composables/useAdaptive'
import { useLessons } from '@/composables/useLessons'
import { useGameFlow } from '@/composables/useGameFlow'

import AppHeader from '@/components/AppHeader.vue'
import PianoKeyboard from '@/components/PianoKeyboard.vue'
import ExerciseArea from '@/components/ExerciseArea.vue'
import HomeScreen from '@/components/HomeScreen.vue'
import VictoryScreen from '@/components/VictoryScreen.vue'
import ProgressDots from '@/components/ProgressDots.vue'
import ComboCounter from '@/components/ComboCounter.vue'
import XpPopup from '@/components/XpPopup.vue'
import ScreenFlash from '@/components/ScreenFlash.vue'

// ---- Composables ----
const audio = useAudio()
const adaptive = useAdaptive()
const lessons = useLessons()
const game = useGameFlow()

// ---- Refs ----
const pianoRef = ref<InstanceType<typeof PianoKeyboard> | null>(null)

// Piano controls
const startOctave = ref(3)
const showLabels = ref(true)
const volume = ref(70)

// ---- Init ----
onMounted(() => {
  adaptive.load()
  audio.init()
  game.selectRecommendedLesson()
  // Piano is always mounted, wire it immediately
  if (pianoRef.value) game.setPianoRef(pianoRef.value)
})

// Wire piano & audio refs into the game flow composable
watch(pianoRef, (ref) => { if (ref) game.setPianoRef(ref) })
game.setAudioRef(audio)

// ---- Piano controls ----
function handleOctaveChange(e: Event) {
  startOctave.value = parseInt((e.target as HTMLSelectElement).value)
}

function handleVolumeChange(e: Event) {
  const v = parseInt((e.target as HTMLInputElement).value)
  volume.value = v
  audio.setVolume(v / 100)
}

// ---- Feedback class ----
const feedbackClass = ref('')
watch(() => game.lastFeedback.value, (v) => {
  feedbackClass.value = v === 'correct' ? 'correct' : v === 'wrong' ? 'wrong' : ''
})
</script>

<template>
  <div id="pianoflow">
    <AppHeader />

    <main class="app-main">
      <!-- ========== HOME ========== -->
      <Transition name="fade" mode="out-in">
        <HomeScreen
          v-if="game.viewState.value === 'home'"
          key="home"
          :recommended-lesson="game.currentLesson.value"
          :all-lessons="lessons.getAllLessons()"
          @start="game.startLesson($event)"
          @select-lesson="game.selectLesson($event)"
        />

        <!-- ========== EXERCISING ========== -->
        <div v-else-if="game.viewState.value === 'exercising'" key="exercising" class="exercise-mode">
          <!-- Top bar: progress + combo -->
          <div class="exercise-topbar">
            <button class="btn-back" @click="game.goHome()">← Quitter</button>
            <ProgressDots
              :current="game.progressDots.value.current"
              :total="game.progressDots.value.total"
            />
            <ComboCounter v-if="game.combo.value >= 2" :count="game.combo.value" />
          </div>

          <!-- Exercise card -->
          <ExerciseArea
            v-if="game.currentExercise.value"
            :exercise="game.currentExercise.value"
            :index="game.exerciseIndex.value"
            :total="game.exerciseTotal.value"
            :feedback-text="game.feedbackText.value"
            :feedback-class="feedbackClass"
            :anim-class="game.lastFeedback.value === 'correct' ? 'anim-pop' : game.lastFeedback.value === 'wrong' ? 'anim-shake' : ''"
          />

          <!-- Skip button -->
          <button class="btn-skip" @click="game.skipExercise()">Passer →</button>

          <!-- XP Popups -->
          <XpPopup :popups="game.xpPopups.value" />

          <!-- Screen flash overlay -->
          <ScreenFlash :trigger="game.lastFeedback.value" />
        </div>

        <!-- ========== VICTORY ========== -->
        <VictoryScreen
          v-else
          key="victory"
          :correct="game.sessionCorrect.value"
          :total="game.sessionTotal.value"
          :stars="game.stars.value"
          :leveled-up="game.leveledUp.value"
          :xp-earned="adaptive.getStats().totalXp"
          :new-level="adaptive.getStats().level"
          :streak="adaptive.getStats().streak"
          @next="game.startNextLesson()"
          @home="game.goHome()"
        />
      </Transition>

      <!-- ========== PIANO (always mounted) ========== -->
      <div v-show="game.viewState.value !== 'victory'" class="piano-dock">
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
            <input type="checkbox" v-model="showLabels" /> Notes
          </label>
        </div>

        <PianoKeyboard
          ref="pianoRef"
          :start-octave="startOctave"
          :show-labels="showLabels"
          @note-play="game.handleNoteInput($event)"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-main {
  min-height: calc(100vh - 70px);
}

/* ---- Fade transition ---- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

/* ---- Exercise Mode ---- */
.exercise-mode {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px 20px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.exercise-topbar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.btn-back {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.btn-back:hover {
  background: var(--bg-card-hover);
  color: var(--text);
}

.btn-skip {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  padding: 8px 20px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.btn-skip:hover {
  background: var(--bg-card-hover);
  color: var(--text);
}

/* ---- Piano dock (always mounted) ---- */
.piano-dock {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 20px 32px;
  gap: 14px;
  border-top: 1px solid var(--border);
  background: var(--bg-card);
}

/* Piano controls */
.piano-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 8px;
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
</style>
