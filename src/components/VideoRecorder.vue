<script setup lang="ts">
import { ref, onUnmounted } from "vue";

const stream = ref<MediaStream | null>(null);
const mediaRecorder = ref<MediaRecorder | null>(null);
const recordedChunks = ref<Blob[]>([]);
const videoElement = ref<HTMLVideoElement | null>(null);
const isRecording = ref(false);
const recordedVideo = ref<Blob | null>(null);
const videoMetadata = ref<{
  size: string;
  type: string;
  duration: string;
} | null>(null);
const recordingStartTime = ref<number>(0);

// Start the camera stream
async function startCamera() {
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    if (videoElement.value) {
      videoElement.value.srcObject = stream.value;
    }
  } catch (err) {
    console.error("Error accessing camera:", err);
  }
}

// Stop the camera stream
function stopCamera() {
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop());
    stream.value = null;
  }
}

// Start recording
function startRecording() {
  if (!stream.value) return;

  recordedChunks.value = [];
  mediaRecorder.value = new MediaRecorder(stream.value);
  recordingStartTime.value = Date.now();

  mediaRecorder.value.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.value.push(event.data);
    }
  };

  mediaRecorder.value.onstop = () => {
    const blob = new Blob(recordedChunks.value, { type: "video/webm" });
    recordedVideo.value = blob;

    // Calculate metadata
    const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
    videoMetadata.value = {
      size: `${sizeMB} MB`,
      type: blob.type,
      duration: calculateDuration(),
    };
  };

  mediaRecorder.value.start();
  isRecording.value = true;
}

// Stop recording
function stopRecording() {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop();
    isRecording.value = false;
  }
}

// Clean up on component unmount
onUnmounted(() => {
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop());
  }
});

function calculateDuration(): string {
  if (!mediaRecorder.value) return "0:00";
  const seconds = Math.floor((Date.now() - recordingStartTime.value) / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// Add this new function
function downloadRecording() {
  if (!recordedVideo.value) return;

  const url = URL.createObjectURL(recordedVideo.value);
  const a = document.createElement("a");
  a.href = url;
  a.download = `recording-${new Date().toISOString()}.webm`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="video-recorder">
    <video ref="videoElement" autoplay muted playsinline></video>

    <div class="controls">
      <button v-if="!stream" @click="startCamera" class="control-btn">
        Start Camera
      </button>

      <button
        v-else
        @click="stopCamera"
        class="control-btn"
        :disabled="isRecording"
      >
        Stop Camera
      </button>

      <button
        @click="startRecording"
        class="control-btn"
        :disabled="!stream || isRecording"
      >
        Start Recording
      </button>

      <button
        @click="stopRecording"
        class="control-btn"
        :disabled="!isRecording"
      >
        Stop Recording
      </button>

      <button
        @click="downloadRecording"
        class="control-btn download-btn"
        :disabled="!recordedVideo"
      >
        Download Recording
      </button>
    </div>

    <div v-if="videoMetadata" class="metadata">
      <h3>Last Recording Details:</h3>
      <ul>
        <li>Size: {{ videoMetadata.size }}</li>
        <li>Format: {{ videoMetadata.type }}</li>
        <li>Duration: {{ videoMetadata.duration }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.video-recorder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}

video {
  width: 100%;
  max-width: 640px;
  border-radius: 8px;
  background-color: #000;
}

.controls {
  display: flex;
  gap: 1rem;
}

.control-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: #4caf50;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

.control-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.control-btn:hover:not(:disabled) {
  background-color: #45a049;
}

.metadata {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  width: 100%;
  max-width: 640px;
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

.download-btn {
  background-color: #2196f3;
}

.download-btn:hover:not(:disabled) {
  background-color: #1976d2;
}
</style>
