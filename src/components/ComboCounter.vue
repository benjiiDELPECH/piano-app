<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  count: number
}>()

const display = computed(() => {
  if (props.count < 2) return ''
  if (props.count >= 10) return `🔥🔥🔥 ×${props.count}`
  if (props.count >= 7) return `🔥🔥 ×${props.count}`
  if (props.count >= 5) return `🔥 ×${props.count}`
  if (props.count >= 3) return `✨ ×${props.count}`
  return `×${props.count}`
})

const sizeClass = computed(() => {
  if (props.count >= 10) return 'mega'
  if (props.count >= 7) return 'large'
  if (props.count >= 5) return 'medium'
  if (props.count >= 3) return 'small'
  return ''
})
</script>

<template>
  <Transition name="combo">
    <div v-if="count >= 2" class="combo-counter" :class="sizeClass" :key="count">
      {{ display }}
    </div>
  </Transition>
</template>

<style scoped>
.combo-counter {
  font-weight: 800;
  text-align: center;
  letter-spacing: 1px;
  animation: combo-bump 0.3s ease;
}

.combo-counter.small {
  font-size: 1.1rem;
  color: var(--warning);
}

.combo-counter.medium {
  font-size: 1.4rem;
  color: #ff9f43;
  text-shadow: 0 0 10px rgba(255, 159, 67, 0.4);
}

.combo-counter.large {
  font-size: 1.7rem;
  color: var(--error);
  text-shadow: 0 0 16px rgba(255, 107, 107, 0.5);
}

.combo-counter.mega {
  font-size: 2rem;
  color: #ff4757;
  text-shadow: 0 0 24px rgba(255, 71, 87, 0.6);
  animation: combo-bump 0.3s ease, combo-glow 1s ease infinite;
}

@keyframes combo-bump {
  0% { transform: scale(0.6); opacity: 0; }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes combo-glow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
}

.combo-enter-active { animation: combo-bump 0.3s ease; }
.combo-leave-active { transition: all 0.2s ease; }
.combo-leave-to { opacity: 0; transform: scale(0.5); }
</style>
