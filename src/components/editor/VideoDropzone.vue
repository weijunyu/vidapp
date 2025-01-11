<script setup lang="ts">
const props = defineProps<{
  isDragging: boolean;
}>();

const emit = defineEmits<{
  (e: "drop", files: FileList): void;
  (e: "dragover"): void;
  (e: "dragleave"): void;
  (e: "fileSelect", files: FileList): void;
}>();

function handleDrop(e: DragEvent) {
  e.preventDefault();
  const files = e.dataTransfer?.files;
  if (!files || files.length === 0) return;
  emit("drop", files);
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
  emit("dragover");
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = input.files;
  if (!files || files.length === 0) return;
  emit("fileSelect", files);
  input.value = ""; // Reset input for allowing the same file to be selected again
}
</script>

<template>
  <div
    class="dropzone"
    :class="{ dragging: isDragging }"
    @drop="handleDrop"
    @dragover="handleDragOver"
    @dragleave="$emit('dragleave')"
  >
    <div class="dropzone-content">
      <i class="upload-icon">📁</i>
      <p class="dropzone-text">Drag and drop a video file here</p>
      <p class="or-divider">or</p>
      <label class="file-input-label">
        <input
          type="file"
          accept="video/*"
          class="file-input"
          @change="handleFileSelect"
        />
        Choose a video file
      </label>
    </div>
  </div>
</template>

<style scoped>
.dropzone {
  border: 2px dashed #666;
  border-radius: 4px;
  padding: 2rem;
  text-align: center;
  background-color: #2d2d2d;
  transition: all 0.3s ease;
  cursor: pointer;
}

.dropzone.dragging {
  border-color: #4caf50;
  background-color: #1b5e20;
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.dropzone-text {
  color: #90a4ae;
}

.upload-icon {
  font-size: 2rem;
}

.or-divider {
  margin: 0.5rem 0;
  color: #90a4ae;
  font-size: 0.9rem;
}

.file-input {
  display: none;
}

.file-input-label {
  padding: 0.5rem 1rem;
  background-color: #4caf50;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.file-input-label:hover {
  background-color: #388e3c;
}

@media (prefers-color-scheme: light) {
  .dropzone {
    border-color: #d1d1d1;
    background-color: #ffffff;
  }

  .dropzone.dragging {
    border-color: #4caf50;
    background-color: #e8f5e9;
  }

  .dropzone-text,
  .or-divider {
    color: #666666;
  }
}

@media (max-width: 768px) {
  .dropzone {
    padding: 1rem;
  }

  .upload-icon {
    font-size: 1.5rem;
  }
}
</style>
