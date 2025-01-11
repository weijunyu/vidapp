<script setup lang="ts">
defineProps<{
  stream: MediaStream | null;
  isRecording: boolean;
  hasRecordedVideo: boolean;
}>();

defineEmits<{
  (e: "startCamera"): void;
  (e: "stopCamera"): void;
  (e: "startRecording"): void;
  (e: "stopRecording"): void;
  (e: "downloadRecording"): void;
}>();
</script>

<template>
  <div class="recording-controls">
    <button v-if="!stream" @click="$emit('startCamera')" class="control-btn">
      Start Camera
    </button>

    <button
      v-else
      @click="$emit('stopCamera')"
      class="control-btn"
      :disabled="isRecording"
    >
      Stop Camera
    </button>

    <button
      @click="$emit('startRecording')"
      class="control-btn"
      :disabled="!stream || isRecording"
    >
      Start Recording
    </button>

    <button
      @click="$emit('stopRecording')"
      class="control-btn"
      :disabled="!isRecording"
    >
      Stop Recording
    </button>

    <button
      @click="$emit('downloadRecording')"
      class="control-btn download-btn"
      :disabled="!hasRecordedVideo"
    >
      Download Recording
    </button>
  </div>
</template>

<style scoped>
.recording-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  padding: 0 0.5rem;
}

.control-btn {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  border: none;
  border-radius: 4px;
  background-color: #4caf50;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

.control-btn:disabled {
  background-color: #424242;
  color: #757575;
  cursor: not-allowed;
}

.control-btn:hover:not(:disabled) {
  background-color: #388e3c;
}

.download-btn {
  background-color: #2196f3;
}

.download-btn:hover:not(:disabled) {
  background-color: #1976d2;
}

@media (prefers-color-scheme: light) {
  .control-btn:disabled {
    background-color: #e0e0e0;
    color: #999999;
  }
}

@media (max-width: 480px) {
  .control-btn {
    width: 100%;
    margin: 0.25rem 0;
  }
}
</style>
