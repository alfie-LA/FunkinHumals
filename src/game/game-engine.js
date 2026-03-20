// Main game loop: process notes, check hits, update state.
// Ported from PlayState.hx processNotes/processInputQueue/goodNoteHit/onNoteMiss
import { Conductor } from '../core/conductor.js'
import { AudioManager } from '../core/audio-manager.js'
import { InputManager } from '../core/input-manager.js'
import { scoreNote, judgeNote, getMissScore } from '../core/scoring.js'
import { loadMetadata, loadChart, splitNotes } from '../core/chart-loader.js'
import { transformNotes } from '../core/note-transformer.js'
import {
  HIT_WINDOW_MS, KEY_COUNT, HEALTH_MAX, HEALTH_MIN, HEALTH_START,
  HEALTH_SICK_BONUS, HEALTH_GOOD_BONUS, HEALTH_BAD_BONUS, HEALTH_SHIT_BONUS,
  HEALTH_MISS_PENALTY, HEALTH_GHOST_MISS_PENALTY,
  HEALTH_HOLD_BONUS_PER_SEC, SCORE_HOLD_BONUS_PER_SEC,
  JUDGEMENT_SICK_COMBO_BREAK, JUDGEMENT_GOOD_COMBO_BREAK,
  JUDGEMENT_BAD_COMBO_BREAK, JUDGEMENT_SHIT_COMBO_BREAK,
  CONDUCTOR_DRIFT_THRESHOLD, MUSIC_EASE_RATIO,
} from '../constants.js'

const HEALTH_MAP = {
  sick: HEALTH_SICK_BONUS,
  good: HEALTH_GOOD_BONUS,
  bad: HEALTH_BAD_BONUS,
  shit: HEALTH_SHIT_BONUS,
}

const COMBO_BREAK_MAP = {
  sick: JUDGEMENT_SICK_COMBO_BREAK,
  good: JUDGEMENT_GOOD_COMBO_BREAK,
  bad: JUDGEMENT_BAD_COMBO_BREAK,
  shit: JUDGEMENT_SHIT_COMBO_BREAK,
}

/**
 * @typedef {Object} GameState
 * @property {number} score
 * @property {number} health
 * @property {number} combo
 * @property {Object} tallies
 * @property {string|null} lastJudgement
 * @property {number} lastJudgementTime
 * @property {boolean} playing
 * @property {boolean} countdown
 * @property {boolean} dead
 * @property {boolean} songEnded
 */

export class GameEngine {
  constructor() {
    this.conductor = new Conductor()
    this.audio = new AudioManager()
    this.input = new InputManager()

    // Song data
    this.metadata = null
    this.playerNotes = []
    this.opponentNotes = []
    this.scrollSpeed = 1.0
    this.mode = 'normal'

    // Note processing state
    this.playerNoteStates = []   // { ...note, hit, missed, holdHeld, holdDropped }
    this.opponentNoteStates = []

    // Game state (reactive — Vue will watch this)
    this.state = this._freshState()

    // Callbacks for renderer
    this.onNoteHit = null        // (direction, judgement) => void
    this.onNoteMiss = null       // (direction) => void
    this.onOpponentHit = null    // (direction) => void
    this.onGameOver = null
    this.onSongEnd = null

    // Internal
    this._animFrameId = null
    this._lastFrameTime = 0
    this._countdownBeats = 0
    this._countdownStartTime = 0
  }

  _freshState() {
    return {
      score: 0,
      health: HEALTH_START,
      combo: 0,
      tallies: { sick: 0, good: 0, bad: 0, shit: 0, missed: 0, totalNotes: 0, totalNotesHit: 0 },
      lastJudgement: null,
      lastJudgementTime: 0,
      playing: false,
      countdown: false,
      dead: false,
      songEnded: false,
      songPosition: 0,
      currentBeat: 0,
    }
  }

  /**
   * Load a song and prepare for gameplay.
   * @param {string} songId
   * @param {string} difficulty
   * @param {string} mode - 'normal' or 'mirrored'
   */
  async load(songId, difficulty = 'normal', mode = 'normal') {
    this.mode = mode
    Object.assign(this.state, this._freshState())

    // Load metadata and chart
    this.metadata = await loadMetadata(songId)
    const chart = await loadChart(songId, difficulty)
    this.scrollSpeed = chart.scrollSpeed

    // Transform notes by mode
    const transformed = transformNotes(chart.notes, mode)
    const { playerNotes, opponentNotes } = splitNotes(transformed)
    this.playerNotes = playerNotes
    this.opponentNotes = opponentNotes

    // Initialize note states
    this.playerNoteStates = this.playerNotes.map(n => ({
      ...n, hit: false, missed: false, holdHeld: false, holdDropped: false,
    }))
    this.opponentNoteStates = this.opponentNotes.map(n => ({
      ...n, hit: false, missed: false,
    }))

    // Set up conductor
    this.conductor.mapTimeChanges(this.metadata.timeChanges)
    const instOffset = this.metadata.offsets?.instrumental ?? 0
    this.conductor.instrumentalOffset = instOffset

    // Load audio
    const vocalFiles = this._getVocalFiles()
    await this.audio.loadSong(songId, vocalFiles)

    // Count total scoreable player notes
    this.state.tallies.totalNotes = this.playerNotes.length
  }

  _getVocalFiles() {
    const chars = this.metadata?.characters ?? {}
    const files = []
    if (chars.player) files.push(`Voices-${chars.player}.ogg`)
    if (chars.opponent) files.push(`Voices-${chars.opponent}.ogg`)
    return files
  }

  /** Start the countdown, then begin the song. */
  startCountdown() {
    this.state.countdown = true
    this._countdownBeats = -4  // 4 beats before song starts
    this._countdownStartTime = performance.now()

    // Position conductor before song start
    const pre = this.conductor.beatLengthMs * -5
    this.conductor.update(pre, false)

    this.input.start()
    this._lastFrameTime = performance.now()
    this._animFrameId = requestAnimationFrame(this._gameLoop.bind(this))
  }

  /** Main game loop, called via requestAnimationFrame. */
  _gameLoop(timestamp) {
    const elapsed = (timestamp - this._lastFrameTime) / 1000 // seconds
    this._lastFrameTime = timestamp

    if (this.state.dead || this.state.songEnded) return

    if (this.state.countdown) {
      this._updateCountdown(elapsed)
    } else if (this.state.playing) {
      this._updatePlaying(elapsed)
    }

    // Update state for Vue
    this.state.songPosition = this.conductor.songPosition
    this.state.currentBeat = this.conductor.currentBeat

    this._animFrameId = requestAnimationFrame(this._gameLoop.bind(this))
  }

  _updateCountdown(elapsed) {
    // Advance conductor manually during countdown
    this.conductor.update(this.conductor.songPosition + elapsed * 1000, false)

    // Check if countdown is done
    if (this.conductor.songPosition >= this.conductor.combinedOffset) {
      this.state.countdown = false
      this.state.playing = true
      this.audio.play(0)
    }
  }

  _updatePlaying(elapsed) {
    // Lerp conductor position toward audio time for smooth scrolling
    // Ported from PlayState.hx lines 1180-1196
    if (this.audio.playing) {
      const audioTime = this.audio.getCurrentTime()
      const audioDiff = Math.abs(audioTime - (this.conductor.songPosition - this.conductor.combinedOffset))

      if (audioDiff <= CONDUCTOR_DRIFT_THRESHOLD) {
        const easeRatio = 1.0 - Math.exp(-MUSIC_EASE_RATIO * elapsed)
        const targetPos = audioTime + this.conductor.combinedOffset
        const lerped = this.conductor.songPosition + (targetPos - this.conductor.songPosition) * easeRatio
        this.conductor.update(lerped, false)
      } else {
        // Drift too large, snap to audio
        this.conductor.update(audioTime)
      }
    }

    // Process opponent notes (auto-hit)
    this._processOpponentNotes()

    // Process player input
    this._processInput()

    // Process player note misses (notes past the window)
    this._processPlayerMisses()

    // Process hold notes
    this._processHoldNotes(elapsed)

    // Clamp health
    this.state.health = Math.max(HEALTH_MIN, Math.min(HEALTH_MAX, this.state.health))

    // Check death
    if (this.state.health <= HEALTH_MIN) {
      this.state.dead = true
      this.audio.pause()
      this.input.stop()
      this.onGameOver?.()
      return
    }

    // Check song end: all notes processed and past the last note by 2 seconds
    const allProcessed = this.playerNoteStates.every(n => n.hit || n.missed)
    if (allProcessed && this.playerNoteStates.length > 0) {
      const lastNoteTime = Math.max(...this.playerNoteStates.map(n => n.t + (n.l || 0)))
      if (this.conductor.songPosition > lastNoteTime + 2000) {
        this.state.songEnded = true
        this.state.playing = false
        this.audio.stop()
        this.input.stop()
        this.onSongEnd?.()
      }
    }
  }

  _processOpponentNotes() {
    const pos = this.conductor.songPosition
    for (const note of this.opponentNoteStates) {
      if (note.hit || note.missed) continue
      if (pos >= note.t) {
        note.hit = true
        this.onOpponentHit?.(note.direction)
      }
    }
  }

  _processInput() {
    const presses = this.input.drainPresses()

    for (const press of presses) {
      // Find the closest unhit player note in the hit window for this direction
      const pos = this.conductor.songPosition
      let bestNote = null
      let bestDiff = Infinity

      for (const note of this.playerNoteStates) {
        if (note.hit || note.missed) continue
        if (note.direction !== press.direction) continue

        const diff = pos - note.t
        const absDiff = Math.abs(diff)

        // Must be within hit window
        if (absDiff > HIT_WINDOW_MS) continue

        if (absDiff < bestDiff) {
          bestDiff = absDiff
          bestNote = note
        }
      }

      if (bestNote) {
        this._hitNote(bestNote, pos - bestNote.t)
      } else {
        // Ghost miss — pressed with no note nearby
        this._ghostMiss(press.direction)
      }
    }
  }

  _hitNote(note, msTiming) {
    note.hit = true
    if (note.l > 0) note.holdHeld = true

    const score = scoreNote(msTiming)
    const judgement = judgeNote(msTiming)
    const healthChange = HEALTH_MAP[judgement] ?? 0
    const isComboBreak = COMBO_BREAK_MAP[judgement] ?? false

    this.state.score += score
    this.state.health += healthChange
    this.state.tallies.totalNotesHit++
    this.state.tallies[judgement] = (this.state.tallies[judgement] ?? 0) + 1

    if (isComboBreak) {
      this.state.combo = 0
    } else {
      this.state.combo++
    }

    this.state.lastJudgement = judgement
    this.state.lastJudgementTime = performance.now()

    this.onNoteHit?.(note.direction, judgement)
  }

  _processPlayerMisses() {
    const pos = this.conductor.songPosition
    for (const note of this.playerNoteStates) {
      if (note.hit || note.missed) continue
      // Note is past the hit window
      if (pos - note.t > HIT_WINDOW_MS) {
        note.missed = true
        this.state.score += getMissScore()
        this.state.health += HEALTH_MISS_PENALTY
        this.state.combo = 0
        this.state.tallies.missed++
        this.state.lastJudgement = 'miss'
        this.state.lastJudgementTime = performance.now()
        this.onNoteMiss?.(note.direction)
      }
    }
  }

  _ghostMiss(direction) {
    // Check if there are any upcoming notes in this direction (within a generous window)
    const pos = this.conductor.songPosition
    const hasUpcoming = this.playerNoteStates.some(n =>
      !n.hit && !n.missed && n.direction === direction && Math.abs(pos - n.t) <= HIT_WINDOW_MS * 2
    )

    // Only penalize if there were nearby notes they could have been aiming for
    if (hasUpcoming) {
      this.state.health += HEALTH_GHOST_MISS_PENALTY
      this.state.score -= 10
    }
  }

  _processHoldNotes(elapsed) {
    for (const note of this.playerNoteStates) {
      if (!note.hit || note.l <= 0 || note.holdDropped) continue

      const holdEnd = note.t + note.l
      const pos = this.conductor.songPosition

      if (pos > holdEnd) {
        // Hold completed
        note.holdHeld = false
        continue
      }

      // Check if the key is still held
      if (this.input.isHeld(note.direction)) {
        // Grant hold bonus
        this.state.health += HEALTH_HOLD_BONUS_PER_SEC * elapsed
        this.state.score += Math.floor(SCORE_HOLD_BONUS_PER_SEC * elapsed)
      } else {
        // Key released — hold dropped
        note.holdDropped = true
        note.holdHeld = false
      }
    }
  }

  /** Clean up and stop everything. */
  destroy() {
    if (this._animFrameId) {
      cancelAnimationFrame(this._animFrameId)
      this._animFrameId = null
    }
    this.audio.stop()
    this.input.stop()
  }

  /** Pause the game. */
  pause() {
    this.state.playing = false
    this.audio.pause()
    if (this._animFrameId) {
      cancelAnimationFrame(this._animFrameId)
      this._animFrameId = null
    }
  }

  /** Resume the game. */
  resume() {
    this.state.playing = true
    this.audio.resume()
    this._lastFrameTime = performance.now()
    this._animFrameId = requestAnimationFrame(this._gameLoop.bind(this))
  }
}
