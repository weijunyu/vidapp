<script setup lang="ts">
defineProps<{
  maxDuration: number;
  isRecording: boolean;
}>();

const emit = defineEmits<{
  (e: "update:maxDuration", value: number): void;
}>();
</script>

<template>
  <div class="duration-input">
    <label for="maxDuration">Max Recording Duration (seconds):</label>

    <input
      id="maxDuration"
      type="number"
      :value="maxDuration"
      @input="(e) => emit('update:maxDuration', +(e.target as HTMLInputElement).value)"
      min="0"
      step="1"
      :disabled="isRecording"
    />
    <span class="duration-hint" v-if="maxDuration > 0">
      Recording will stop after {{ maxDuration }} seconds
    </span>
  </div>
</template>

<style scoped>
.duration-input {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  width: 100%;
  max-width: 640px;
  padding: 1rem;
  background-color: #2d2d2d;
  border-radius: 4px;
}

.duration-input label {
  color: #e0e0e0;
  white-space: nowrap;
}

.duration-input input {
  width: 80px;
  padding: 0.5rem;
  border: 1px solid #666;
  border-radius: 4px;
  background-color: #424242;
  color: #e0e0e0;
}

.duration-input input:disabled {
  background-color: #2d2d2d;
  border-color: #424242;
  color: #666;
}

.duration-hint {
  color: #90a4ae;
  font-size: 0.9rem;
}

@media (prefers-color-scheme: light) {
  .duration-input {
    background-color: #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .duration-input label {
    color: #1a1a1a;
  }

  .duration-input input {
    background-color: #f5f5f5;
    border-color: #d1d1d1;
    color: #1a1a1a;
  }

  .duration-input input:disabled {
    background-color: #e0e0e0;
    border-color: #cccccc;
    color: #666666;
  }

  .duration-hint {
    color: #666666;
  }
}

@media (max-width: 768px) {
  .duration-input {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .duration-input input {
    width: 100%;
  }
}
</style>
