<script setup lang="ts">
import { ref, onUnmounted } from "vue";
import VideoPreview from "./recorder/VideoPreview.vue";
import RecordingControls from "./recorder/RecordingControls.vue";
import RecordingMetadata from "./recorder/RecordingMetadata.vue";

const stream = ref<MediaStream | null>(null);
const mediaRecorder = ref<MediaRecorder | null>(null);
const recordedChunks = ref<Blob[]>([]);
const isRecording = ref(false);
const recordedVideo = ref<Blob | null>(null);
const videoMetadata = ref<{
  size: string;
  type: string;
  duration: string;
} | null>(null);
const recordingStartTime = ref<number>(0);
const currentDuration = ref("0:00");
let durationInterval: number | null = null;

const emit = defineEmits<{
  (e: "recording-complete", payload: { blob: Blob; mimeType: string }): void;
}>();

// Start the camera stream
async function startCamera() {
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
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

function getBestSupportedMimeType() {
  const types = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4;codecs=h264,aac",
    "video/mp4",
  ];

  return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

// Start recording
function startRecording() {
  if (!stream.value) return;

  const mimeType = getBestSupportedMimeType();
  if (!mimeType) {
    console.error("No supported media recording MIME types found");
    return;
  }

  recordedChunks.value = [];
  mediaRecorder.value = new MediaRecorder(stream.value, {
    mimeType: mimeType,
  });
  recordingStartTime.value = Date.now();

  // Start duration timer
  durationInterval = window.setInterval(() => {
    currentDuration.value = calculateDuration();
  }, 1000);

  mediaRecorder.value.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.value.push(event.data);
    }
  };

  mediaRecorder.value.onstop = () => {
    const blob = new Blob(recordedChunks.value, { type: mimeType });
    recordedVideo.value = blob;

    // Calculate metadata
    const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
    videoMetadata.value = {
      size: `${sizeMB} MB`,
      type: blob.type,
      duration: calculateDuration(),
    };

    emit("recording-complete", { blob, mimeType });
  };

  mediaRecorder.value.start();
  isRecording.value = true;
}

// Stop recording
function stopRecording() {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop();
    isRecording.value = false;

    // Clear duration timer
    if (durationInterval) {
      clearInterval(durationInterval);
      durationInterval = null;
    }
  }
}

function calculateDuration(): string {
  if (!mediaRecorder.value) return "0:00";
  const seconds = Math.floor((Date.now() - recordingStartTime.value) / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

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

// Clean up on component unmount
onUnmounted(() => {
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop());
  }
  if (durationInterval) {
    clearInterval(durationInterval);
  }
});
</script>

<template>
  <div class="video-recorder">
    <VideoPreview
      :stream="stream"
      :is-recording="isRecording"
      :current-duration="currentDuration"
    />

    <RecordingControls
      :stream="stream"
      :is-recording="isRecording"
      :has-recorded-video="!!recordedVideo"
      @start-camera="startCamera"
      @stop-camera="stopCamera"
      @start-recording="startRecording"
      @stop-recording="stopRecording"
      @download-recording="downloadRecording"
    />

    <RecordingMetadata :metadata="videoMetadata" />
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

@media (max-width: 768px) {
  .video-recorder {
    padding: 0.5rem;
  }
}
</style>
