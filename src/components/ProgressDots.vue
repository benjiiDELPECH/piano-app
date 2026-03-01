<script setup lang="ts">
defineProps<{
  current: number
  total: number
}>()
</script>

<template>
  <div class="progress-dots">
    <span
      v-for="i in total"
      :key="i"
      class="dot"
      :class="{ filled: i <= current, active: i === current + 1 }"
    />
  </div>
</template>

<style scoped>
.progress-dots {
  display: flex;
  gap: 6px;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--border);
  transition: all 0.3s ease;
}

.dot.filled {
  background: var(--success);
  transform: scale(1);
  animation: dot-fill 0.3s ease;
}

.dot.active {
  background: var(--primary);
  box-shadow: 0 0 8px var(--primary);
  animation: dot-pulse 1.5s ease infinite;
}

@keyframes dot-fill {
  0% { transform: scale(0.5); opacity: 0.5; }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes dot-pulse {
  0%, 100% { box-shadow: 0 0 4px var(--primary); }
  50% { box-shadow: 0 0 12px var(--primary); }
}
</style>
