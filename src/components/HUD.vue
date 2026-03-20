<template>
  <div class="hud">
    <!-- Health bar -->
    <div class="health-bar-container">
      <div class="health-bar-bg">
        <div class="health-bar-fill" :style="{ width: healthPercent + '%' }" />
      </div>
    </div>

    <!-- Score and combo -->
    <div class="score-row">
      <div class="score">Score: {{ state.score }}</div>
      <div class="combo" v-if="state.combo > 1">{{ state.combo }}x</div>
    </div>

    <!-- Judgement popup -->
    <div
      class="judgement"
      v-if="showJudgement"
      :class="state.lastJudgement"
      :key="state.lastJudgementTime"
    >
      {{ state.lastJudgement?.toUpperCase() }}
    </div>

    <!-- Mode indicator -->
    <div class="mode-indicator" v-if="mode !== 'normal'">
      {{ mode.toUpperCase() }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { HEALTH_MAX } from '../constants.js'

const props = defineProps({
  state: { type: Object, required: true },
  mode: { type: String, default: 'normal' },
})

const healthPercent = computed(() => {
  return (props.state.health / HEALTH_MAX) * 100
})

const showJudgement = computed(() => {
  if (!props.state.lastJudgement) return false
  return performance.now() - props.state.lastJudgementTime < 600
})
</script>

<style scoped>
.hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
  font-family: 'Courier New', monospace;
}

.health-bar-container {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 400px;
}

.health-bar-bg {
  height: 16px;
  background: #333;
  border-radius: 8px;
  border: 2px solid #555;
  overflow: hidden;
}

.health-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff4444, #44ff44);
  border-radius: 6px;
  transition: width 0.1s ease-out;
}

.score-row {
  position: absolute;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 24px;
  align-items: center;
}

.score {
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
}

.combo {
  color: #ffcc00;
  font-size: 24px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
}

.judgement {
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 36px;
  font-weight: bold;
  text-shadow: 3px 3px 6px rgba(0,0,0,0.9);
  animation: judgement-pop 0.5s ease-out forwards;
}

.judgement.sick { color: #00ffff; }
.judgement.good { color: #44ff44; }
.judgement.bad { color: #ffaa00; }
.judgement.shit { color: #ff4444; }
.judgement.miss { color: #ff0000; }

@keyframes judgement-pop {
  0% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
  100% { transform: translate(-50%, -70%) scale(1); opacity: 0; }
}

.mode-indicator {
  position: absolute;
  top: 12px;
  right: 16px;
  color: #ff88ff;
  font-size: 14px;
  font-weight: bold;
  background: rgba(0,0,0,0.5);
  padding: 4px 12px;
  border-radius: 4px;
}
</style>
