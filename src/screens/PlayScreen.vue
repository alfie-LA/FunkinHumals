<template>
  <div class="play-screen" @click="handleClick">
    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="loading-text">Loading {{ songId }}...</div>
    </div>

    <!-- Game -->
    <template v-else-if="!engine.state.songEnded">
      <GameCanvas :engine="engine" />
      <HUD :state="engine.state" :mode="mode" />

      <!-- Countdown overlay -->
      <div v-if="engine.state.countdown" class="countdown">
        <div class="countdown-text" :key="countdownNumber">
          {{ countdownDisplay }}
        </div>
      </div>

      <!-- Pause overlay -->
      <div v-if="paused" class="pause-overlay">
        <div class="pause-menu">
          <h2>PAUSED</h2>
          <button @click.stop="resumeGame">Resume</button>
          <button @click.stop="$emit('quit')">Quit</button>
        </div>
      </div>

      <!-- Game over overlay -->
      <div v-if="engine.state.dead" class="game-over-overlay">
        <div class="game-over-menu">
          <h2>GAME OVER</h2>
          <button @click.stop="retry">Retry</button>
          <button @click.stop="$emit('quit')">Quit</button>
        </div>
      </div>

      <!-- Click to start prompt -->
      <div v-if="!started" class="start-prompt">
        Click to start
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { GameEngine } from '../game/game-engine.js'
import GameCanvas from '../game/GameCanvas.vue'
import HUD from '../components/HUD.vue'

const props = defineProps({
  songId: { type: String, required: true },
  difficulty: { type: String, default: 'normal' },
  mode: { type: String, default: 'normal' },
})

const emit = defineEmits(['quit', 'complete'])

const engine = new GameEngine()
// Make engine state reactive so Vue tracks changes from the game loop
engine.state = reactive(engine.state)
const loading = ref(true)
const started = ref(false)
const paused = ref(false)

const countdownNumber = computed(() => {
  if (!engine.state.countdown) return null
  const beat = engine.conductor.currentBeat
  if (beat < -3) return 3
  if (beat < -2) return 2
  if (beat < -1) return 1
  return 0
})

const countdownDisplay = computed(() => {
  const n = countdownNumber.value
  if (n === 3) return '3'
  if (n === 2) return '2'
  if (n === 1) return '1'
  if (n === 0) return 'GO!'
  return ''
})

async function loadSong() {
  try {
    await engine.load(props.songId, props.difficulty, props.mode)
    loading.value = false
  } catch (e) {
    console.error('Failed to load song:', e)
  }
}

function handleClick() {
  if (loading.value) return
  if (!started.value) {
    started.value = true
    engine.startCountdown()
  }
}

function handleKeydown(e) {
  if (e.code === 'Escape' && started.value && engine.state.playing) {
    e.preventDefault()
    if (paused.value) {
      resumeGame()
    } else {
      paused.value = true
      engine.pause()
    }
  }
}

function resumeGame() {
  paused.value = false
  engine.resume()
}

async function retry() {
  engine.destroy()
  loading.value = true
  started.value = false
  await loadSong()
  started.value = true
  engine.startCountdown()
}

// Watch for song end
engine.onSongEnd = () => {
  emit('complete', {
    score: engine.state.score,
    tallies: { ...engine.state.tallies },
    combo: engine.state.combo,
  })
}

onMounted(() => {
  loadSong()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  engine.destroy()
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.play-screen {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0a0a1a;
  cursor: default;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.loading-text {
  color: #888;
  font-size: 24px;
  font-family: 'Courier New', monospace;
}

.start-prompt {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 28px;
  font-family: 'Courier New', monospace;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.countdown {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.countdown-text {
  color: #fff;
  font-size: 80px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  text-shadow: 4px 4px 8px rgba(0,0,0,0.8);
  animation: countdown-pop 0.4s ease-out;
}

@keyframes countdown-pop {
  0% { transform: scale(1.5); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

.pause-overlay, .game-over-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pause-menu, .game-over-menu {
  text-align: center;
  color: #fff;
  font-family: 'Courier New', monospace;
}

.pause-menu h2, .game-over-menu h2 {
  font-size: 36px;
  margin-bottom: 24px;
}

.pause-menu button, .game-over-menu button {
  display: block;
  width: 200px;
  margin: 8px auto;
  padding: 12px;
  font-size: 18px;
  font-family: 'Courier New', monospace;
  background: #333;
  color: #fff;
  border: 2px solid #666;
  border-radius: 8px;
  cursor: pointer;
}

.pause-menu button:hover, .game-over-menu button:hover {
  background: #555;
}
</style>
