<template>
  <canvas ref="canvasEl" class="game-canvas" />
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Renderer } from './renderer.js'

const props = defineProps({
  engine: { type: Object, required: true },
})

const canvasEl = ref(null)
let renderer = null
let animId = null

function renderLoop() {
  if (!renderer || !props.engine) return

  const { conductor, playerNoteStates, opponentNoteStates, scrollSpeed, stage, camera } = props.engine

  renderer.draw({
    songPosition: conductor.songPosition,
    scrollSpeed,
    playerNotes: playerNoteStates,
    opponentNotes: opponentNoteStates,
    stage,
    camera,
  })

  animId = requestAnimationFrame(renderLoop)
}

function handleResize() {
  if (!renderer || !canvasEl.value) return
  const parent = canvasEl.value.parentElement
  renderer.resize(parent.clientWidth, parent.clientHeight)
}

onMounted(() => {
  renderer = new Renderer(canvasEl.value)
  handleResize()
  window.addEventListener('resize', handleResize)

  // Wire up engine visual callbacks + character animations
  props.engine.onNoteHit = (dir, judgement) => {
    renderer.glowReceptor(dir)
    props.engine.stage.characters.bf?.playSing(dir)
  }
  props.engine.onNoteMiss = (dir) => {
    renderer.flashMiss(dir)
    props.engine.stage.characters.bf?.playMiss(dir)
  }
  props.engine.onOpponentHit = (dir) => {
    renderer.glowOpponentReceptor(dir)
    props.engine.stage.characters.dad?.playSing(dir)
  }

  animId = requestAnimationFrame(renderLoop)
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.game-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
