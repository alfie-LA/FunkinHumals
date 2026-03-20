<template>
  <div class="result-screen">
    <h1>RESULTS</h1>

    <div class="rank" :class="rank?.toLowerCase()">{{ rank }}</div>

    <div class="stats">
      <div class="stat-row">
        <span class="label">Score</span>
        <span class="value">{{ results.score }}</span>
      </div>
      <div class="stat-row">
        <span class="label">Accuracy</span>
        <span class="value">{{ accuracy }}%</span>
      </div>
      <div class="stat-row sick">
        <span class="label">Sick</span>
        <span class="value">{{ results.tallies.sick }}</span>
      </div>
      <div class="stat-row good">
        <span class="label">Good</span>
        <span class="value">{{ results.tallies.good }}</span>
      </div>
      <div class="stat-row bad">
        <span class="label">Bad</span>
        <span class="value">{{ results.tallies.bad }}</span>
      </div>
      <div class="stat-row shit">
        <span class="label">Shit</span>
        <span class="value">{{ results.tallies.shit }}</span>
      </div>
      <div class="stat-row miss">
        <span class="label">Missed</span>
        <span class="value">{{ results.tallies.missed }}</span>
      </div>
    </div>

    <div class="buttons">
      <button @click="$emit('retry')">Retry</button>
      <button @click="$emit('quit')">Back</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { calculateRank } from '../core/scoring.js'

const props = defineProps({
  results: { type: Object, required: true },
})

defineEmits(['retry', 'quit'])

const rank = computed(() => calculateRank(props.results.tallies))

const accuracy = computed(() => {
  const t = props.results.tallies
  if (t.totalNotes === 0) return '0.0'
  const pct = ((t.sick + t.good - t.missed) / t.totalNotes) * 100
  return Math.max(0, pct).toFixed(1)
})
</script>

<style scoped>
.result-screen {
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
  font-size: 48px;
  margin-bottom: 16px;
}

.rank {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 32px;
  padding: 8px 24px;
  border-radius: 8px;
}

.rank.perfect_gold { color: #FFB619; }
.rank.perfect { color: #FF58B4; }
.rank.excellent { color: #FDCB42; }
.rank.great { color: #EAF6FF; }
.rank.good { color: #EF8764; }
.rank.shit { color: #6044FF; }

.stats {
  width: 300px;
  margin-bottom: 32px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 18px;
  border-bottom: 1px solid #333;
}

.stat-row.sick .value { color: #00ffff; }
.stat-row.good .value { color: #44ff44; }
.stat-row.bad .value { color: #ffaa00; }
.stat-row.shit .value { color: #ff4444; }
.stat-row.miss .value { color: #ff0000; }

.buttons {
  display: flex;
  gap: 16px;
}

button {
  padding: 12px 32px;
  font-size: 18px;
  font-family: 'Courier New', monospace;
  background: #333;
  color: #fff;
  border: 2px solid #666;
  border-radius: 8px;
  cursor: pointer;
}

button:hover {
  background: #555;
}
</style>
