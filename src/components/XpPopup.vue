<script setup lang="ts">
import { TransitionGroup } from 'vue'
import type { XpPopup } from '@/composables/useGameFlow'

defineProps<{
  popups: XpPopup[]
}>()
</script>

<template>
  <div class="xp-popup-container">
    <TransitionGroup name="xp">
      <div
        v-for="popup in popups"
        :key="popup.id"
        class="xp-popup"
        :class="{ bonus: popup.bonus }"
      >
        +{{ popup.amount }} XP
        <span v-if="popup.bonus" class="xp-bonus">streak!</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.xp-popup-container {
  position: absolute;
  top: 50%;
  right: 20px;
  pointer-events: none;
  z-index: 50;
}

.xp-popup {
  font-size: 1rem;
  font-weight: 800;
  color: var(--warning);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  margin-bottom: 4px;
}

.xp-popup.bonus {
  font-size: 1.15rem;
  color: #ff9f43;
}

.xp-bonus {
  font-size: 0.7em;
  color: var(--primary-light);
  margin-left: 4px;
  font-weight: 600;
}

.xp-enter-active {
  animation: xp-float 1.5s ease forwards;
}

.xp-leave-active {
  transition: opacity 0.3s ease;
}

.xp-leave-to {
  opacity: 0;
}

@keyframes xp-float {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }
  15% {
    opacity: 1;
    transform: translateY(0) scale(1.1);
  }
  30% {
    transform: translateY(-5px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-40px) scale(0.9);
  }
}
</style>
