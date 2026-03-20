<template>
  <TitleScreen
    v-if="screen === 'title'"
    @play="startGame"
  />
  <PlayScreen
    v-else-if="screen === 'play'"
    :songId="gameConfig.songId"
    :difficulty="gameConfig.difficulty"
    :mode="gameConfig.mode"
    @complete="showResults"
    @quit="goToTitle"
  />
  <ResultScreen
    v-else-if="screen === 'results'"
    :results="results"
    @retry="retryGame"
    @quit="goToTitle"
  />
</template>

<script setup>
import { ref, reactive } from 'vue'
import TitleScreen from './screens/TitleScreen.vue'
import PlayScreen from './screens/PlayScreen.vue'
import ResultScreen from './screens/ResultScreen.vue'

const screen = ref('title')
const gameConfig = reactive({ songId: 'tutorial', difficulty: 'normal', mode: 'normal' })
const results = ref(null)

function startGame({ songId, difficulty, mode }) {
  gameConfig.songId = songId
  gameConfig.difficulty = difficulty
  gameConfig.mode = mode
  screen.value = 'play'
}

function showResults(data) {
  results.value = data
  screen.value = 'results'
}

function retryGame() {
  screen.value = 'play'
}

function goToTitle() {
  screen.value = 'title'
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0a0a1a;
}

#app {
  width: 100%;
  height: 100%;
}
</style>
