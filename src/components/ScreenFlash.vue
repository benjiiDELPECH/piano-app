<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  trigger: 'correct' | 'wrong' | ''
}>()

const active = ref(false)
const type = ref<'correct' | 'wrong'>('correct')

watch(() => props.trigger, (val) => {
  if (!val) return
  type.value = val
  active.value = true
  setTimeout(() => { active.value = false }, 350)
})
</script>

<template>
  <Transition name="flash">
    <div v-if="active" class="screen-flash" :class="type" />
  </Transition>
</template>

<style scoped>
.screen-flash {
  position: fixed;
  inset: 0;
  z-index: 200;
  pointer-events: none;
  animation: flash-fade 0.35s ease-out forwards;
}

.screen-flash.correct {
  background: radial-gradient(ellipse at center, rgba(0, 206, 201, 0.25) 0%, transparent 70%);
}

.screen-flash.wrong {
  background: radial-gradient(ellipse at center, rgba(255, 107, 107, 0.25) 0%, transparent 70%);
  animation: flash-fade 0.35s ease-out forwards, flash-shake 0.3s ease;
}

@keyframes flash-fade {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes flash-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}

.flash-enter-active { animation: flash-fade 0.35s ease-out; }
.flash-leave-active { transition: opacity 0.1s; }
.flash-leave-to { opacity: 0; }
</style>
