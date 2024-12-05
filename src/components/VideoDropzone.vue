<script setup lang="ts">
import { ref, onUnmounted } from "vue";

const isDragging = ref(false);
const videoMetadata = ref<{
  size: string;
  type: string;
  duration: string;
  name: string;
} | null>(null);
const videoUrl = ref<string | null>(null);
const videoPlayer = ref<HTMLVideoElement | null>(null);

function handleDrop(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;

  const files = e.dataTransfer?.files;
  if (!files || files.length === 0) return;

  const file = files[0];
  if (!file.type.startsWith("video/")) {
    alert("Please drop a video file");
    return;
  }

  // Create video element to get duration
  const video = document.createElement("video");
  video.preload = "metadata";

  video.onloadedmetadata = () => {
    const minutes = Math.floor(video.duration / 60);
    const seconds = Math.floor(video.duration % 60);

    videoMetadata.value = {
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      type: file.type,
      duration: `${minutes}:${seconds.toString().padStart(2, "0")}`,
    };
  };

  // Create and store URL for video playback
  if (videoUrl.value) {
    URL.revokeObjectURL(videoUrl.value);
  }
  videoUrl.value = URL.createObjectURL(file);
  video.src = videoUrl.value;
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
  isDragging.value = true;
}

function handleDragLeave() {
  isDragging.value = false;
}

// Add cleanup on component unmount
onUnmounted(() => {
  if (videoUrl.value) {
    URL.revokeObjectURL(videoUrl.value);
  }
});
</script>

<template>
  <div class="video-dropzone">
    <div
      class="dropzone"
      :class="{ dragging: isDragging }"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <div class="dropzone-content">
        <i class="upload-icon">📁</i>
        <p>Drag and drop a video file here</p>
      </div>
    </div>

    <div v-if="videoMetadata" class="metadata">
      <h3>Uploaded Video Details:</h3>
      <ul>
        <li>Name: {{ videoMetadata.name }}</li>
        <li>Size: {{ videoMetadata.size }}</li>
        <li>Format: {{ videoMetadata.type }}</li>
        <li>Duration: {{ videoMetadata.duration }}</li>
      </ul>
    </div>

    <div v-if="videoUrl" class="video-player">
      <video ref="videoPlayer" :src="videoUrl" controls class="player"></video>
    </div>
  </div>
</template>

<style scoped>
.video-dropzone {
  width: 100%;
  max-width: 640px;
  margin: 1rem 0;
}

.dropzone {
  border: 2px dashed #ccc;
  border-radius: 4px;
  padding: 2rem;
  text-align: center;
  background-color: #f8f8f8;
  transition: all 0.3s ease;
  cursor: pointer;
}

.dropzone.dragging {
  border-color: #4caf50;
  background-color: #e8f5e9;
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.upload-icon {
  font-size: 2rem;
}

.metadata {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.metadata h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.metadata ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.metadata li {
  margin: 0.25rem 0;
  color: #666;
}

.video-player {
  margin-top: 1rem;
  width: 100%;
}

.player {
  width: 100%;
  border-radius: 4px;
  background-color: #000;
}
</style>
