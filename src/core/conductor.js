// BPM-aware timing engine ported from Funkin-main/source/funkin/Conductor.hx
import { STEPS_PER_BEAT, SECS_PER_MIN, MS_PER_SEC, DEFAULT_BPM } from '../constants.js'

export class Conductor {
  constructor() {
    this.timeChanges = []
    this.currentTimeChange = null
    this.songPosition = 0
    this.instrumentalOffset = 0
    this.formatOffset = 0
    this.globalOffset = 0

    // Current position in musical time
    this.currentStep = 0
    this.currentBeat = 0
    this.currentMeasure = 0
    this.currentStepTime = 0
    this.currentBeatTime = 0
    this.currentMeasureTime = 0

    // Callbacks
    this.onStepHit = null
    this.onBeatHit = null
    this.onMeasureHit = null
  }

  get bpm() {
    if (!this.currentTimeChange) return DEFAULT_BPM
    return this.currentTimeChange.bpm
  }

  get timeSignatureNum() {
    if (!this.currentTimeChange) return 4
    return this.currentTimeChange.n ?? 4
  }

  get timeSignatureDen() {
    if (!this.currentTimeChange) return 4
    return this.currentTimeChange.d ?? 4
  }

  get beatLengthMs() {
    return ((SECS_PER_MIN / this.bpm) * MS_PER_SEC) * (4 / this.timeSignatureDen)
  }

  get stepLengthMs() {
    return this.beatLengthMs / STEPS_PER_BEAT
  }

  get measureLengthMs() {
    return this.beatLengthMs * this.timeSignatureNum
  }

  get stepsPerMeasure() {
    return this.timeSignatureNum * STEPS_PER_BEAT
  }

  get combinedOffset() {
    return this.instrumentalOffset + this.formatOffset + this.globalOffset
  }

  /**
   * Load time changes from song metadata.
   * Calculates beatTime for each change.
   * @param {Array<{t: number, bpm: number, b?: number, n?: number, d?: number}>} changes
   */
  mapTimeChanges(changes) {
    this.timeChanges = []
    // Sort by timestamp
    const sorted = [...changes].sort((a, b) => a.t - b.t)

    for (const tc of sorted) {
      const entry = { ...tc, t: Math.max(0, tc.t) }

      if (entry.t <= 0) {
        entry.b = 0
      } else if (this.timeChanges.length > 0) {
        const prev = this.timeChanges[this.timeChanges.length - 1]
        const prevDen = prev.d ?? 4
        entry.b = parseFloat((
          prev.b + ((entry.t - prev.t) * prev.bpm / SECS_PER_MIN / MS_PER_SEC * (prevDen / 4))
        ).toFixed(4))
      } else {
        entry.b = 0
      }

      this.timeChanges.push(entry)
    }

    this.update(this.songPosition, false)
  }

  /**
   * Update conductor with current song position.
   * @param {number} songPos - Position in ms (or null to keep current)
   * @param {boolean} applyOffsets - Whether to add combined offset
   */
  update(songPos, applyOffsets = true) {
    if (songPos != null) {
      this.songPosition = songPos + (applyOffsets ? this.combinedOffset : 0)
    }

    const oldStep = this.currentStep
    const oldBeat = this.currentBeat
    const oldMeasure = this.currentMeasure

    // Find current time change
    this.currentTimeChange = this.timeChanges[0] ?? null
    if (this.songPosition > 0) {
      for (const tc of this.timeChanges) {
        if (this.songPosition >= tc.t) this.currentTimeChange = tc
        if (this.songPosition < tc.t) break
      }
    }

    if (this.currentTimeChange && this.songPosition > 0) {
      this.currentStepTime = parseFloat((
        (this.currentTimeChange.b * STEPS_PER_BEAT) +
        (this.songPosition - this.currentTimeChange.t) / this.stepLengthMs
      ).toFixed(6))
      this.currentBeatTime = this.currentStepTime / STEPS_PER_BEAT
      this.currentMeasureTime = this._getTimeInMeasures(this.songPosition)
      this.currentStep = Math.floor(this.currentStepTime)
      this.currentBeat = Math.floor(this.currentBeatTime)
      this.currentMeasure = Math.floor(this.currentMeasureTime)
    } else {
      // Constant BPM fallback
      this.currentStepTime = parseFloat((this.songPosition / this.stepLengthMs).toFixed(4))
      this.currentBeatTime = this.currentStepTime / STEPS_PER_BEAT
      this.currentMeasureTime = this.currentStepTime / this.stepsPerMeasure
      this.currentStep = Math.floor(this.currentStepTime)
      this.currentBeat = Math.floor(this.currentBeatTime)
      this.currentMeasure = Math.floor(this.currentMeasureTime)
    }

    // Fire signals
    if (this.currentStep !== oldStep) this.onStepHit?.()
    if (this.currentBeat !== oldBeat) this.onBeatHit?.()
    if (this.currentMeasure !== oldMeasure) this.onMeasureHit?.()
  }

  /**
   * Convert milliseconds to steps, accounting for BPM changes.
   * Ported from Conductor.hx getTimeInSteps().
   */
  getTimeInSteps(ms) {
    if (this.timeChanges.length === 0) {
      return Math.floor(ms / this.stepLengthMs)
    }

    let resultStep = 0
    ms = Math.max(0, ms)
    let lastTC = this.timeChanges[0]

    for (let i = 0; i < this.timeChanges.length; i++) {
      const tc = this.timeChanges[i]
      if (ms >= tc.t) {
        if (ms < tc.t || i === this.timeChanges.length - 1) {
          lastTC = tc
          break
        }
        resultStep += (tc.b - lastTC.b) * STEPS_PER_BEAT
        lastTC = tc
      }
    }

    const lastStepLen = ((SECS_PER_MIN / lastTC.bpm) * MS_PER_SEC * (4 / (lastTC.d ?? 4))) / STEPS_PER_BEAT
    resultStep += (ms - lastTC.t) / lastStepLen
    return resultStep
  }

  /**
   * Convert steps to milliseconds, accounting for BPM changes.
   * Ported from Conductor.hx getStepTimeInMs().
   */
  getStepTimeInMs(stepTime) {
    if (this.timeChanges.length === 0) {
      return stepTime * this.stepLengthMs
    }

    let resultMs = 0
    stepTime = Math.max(0, stepTime)
    let lastTC = this.timeChanges[0]

    for (let i = 0; i < this.timeChanges.length; i++) {
      const tc = this.timeChanges[i]
      if (stepTime >= tc.b * STEPS_PER_BEAT) {
        if (stepTime < tc.b * STEPS_PER_BEAT || i === this.timeChanges.length - 1) {
          lastTC = tc
          break
        }
        resultMs += tc.t - lastTC.t
        lastTC = tc
      }
    }

    const lastStepLen = ((SECS_PER_MIN / lastTC.bpm) * MS_PER_SEC * (4 / (lastTC.d ?? 4))) / STEPS_PER_BEAT
    resultMs += (stepTime - lastTC.b * STEPS_PER_BEAT) * lastStepLen
    return resultMs
  }

  /** Internal: get time in measures for a given ms position. */
  _getTimeInMeasures(ms) {
    if (this.timeChanges.length === 0) {
      return ms / this.stepLengthMs / this.stepsPerMeasure
    }

    let resultMeasure = 0
    ms = Math.max(0, ms)
    let lastTC = this.timeChanges[0]

    for (let i = 0; i < this.timeChanges.length; i++) {
      const tc = this.timeChanges[i]
      if (ms >= tc.t) {
        if (ms < tc.t || i === this.timeChanges.length - 1) {
          lastTC = tc
          break
        }
        const stepLen = ((SECS_PER_MIN / lastTC.bpm) * MS_PER_SEC * (4 / (lastTC.d ?? 4))) / STEPS_PER_BEAT
        const stepsPerM = (lastTC.n ?? 4) * STEPS_PER_BEAT
        resultMeasure += (tc.t - lastTC.t) / stepLen / stepsPerM
        lastTC = tc
      }
    }

    const stepLen = ((SECS_PER_MIN / lastTC.bpm) * MS_PER_SEC * (4 / (lastTC.d ?? 4))) / STEPS_PER_BEAT
    const stepsPerM = (lastTC.n ?? 4) * STEPS_PER_BEAT
    resultMeasure += (ms - lastTC.t) / stepLen / stepsPerM
    return resultMeasure
  }
}
