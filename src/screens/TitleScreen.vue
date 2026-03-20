<template>
  <div class="title-screen">
    <h1>FUNKIN' HTML</h1>
    <p class="subtitle">A rhythm game powered by FNF charts</p>

    <div class="song-config">
      <label>
        Song ID
        <input v-model="songId" placeholder="e.g. tutorial" />
      </label>

      <label>
        Difficulty
        <select v-model="difficulty">
          <option value="easy">Easy</option>
          <option value="normal">Normal</option>
          <option value="hard">Hard</option>
        </select>
      </label>

      <label>
        Mode
        <select v-model="mode">
          <option value="normal">Normal</option>
          <option value="mirrored">Mirrored</option>
        </select>
      </label>
    </div>

    <button class="play-btn" @click="$emit('play', { songId, difficulty, mode })">
      PLAY
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const songId = ref('tutorial')
const difficulty = ref('normal')
const mode = ref('normal')

defineEmits(['play'])
</script>

<style scoped>
.title-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #0a0a1a;
  color: #fff;
  font-family: 'Courier New', monospace;
}

h1 {
  font-size: 56px;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #C24B99, #00FFFF, #12FA05, #F9393F);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #888;
  margin-bottom: 40px;
  font-size: 16px;
}

.song-config {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
  width: 280px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #aaa;
  font-size: 14px;
}

input, select {
  padding: 8px 12px;
  font-size: 16px;
  font-family: 'Courier New', monospace;
  background: #222;
  color: #fff;
  border: 2px solid #444;
  border-radius: 6px;
}

input:focus, select:focus {
  outline: none;
  border-color: #00FFFF;
}

.play-btn {
  padding: 16px 48px;
  font-size: 24px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  background: linear-gradient(135deg, #C24B99, #00FFFF);
  color: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.1s;
}

.play-btn:hover {
  transform: scale(1.05);
}

.play-btn:active {
  transform: scale(0.98);
}
</style>
