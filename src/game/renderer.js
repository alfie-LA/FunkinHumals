// Canvas renderer for strumlines, notes, hold trails, hit effects.
import {
  KEY_COUNT, DIRECTION_COLORS, DIRECTION_NAMES, PIXELS_PER_MS, HIT_WINDOW_MS,
} from '../constants.js'

const RECEPTOR_Y = 80           // Y position of receptor row
const NOTE_SIZE = 50             // Width/height of a note
const NOTE_GAP = 12              // Gap between note lanes
const LANE_WIDTH = NOTE_SIZE + NOTE_GAP
const STRUMLINE_WIDTH = KEY_COUNT * LANE_WIDTH
const HOLD_WIDTH = NOTE_SIZE * 0.4
const RECEPTOR_GLOW_DURATION = 150  // ms

// Arrow symbols per direction
const ARROWS = ['←', '↓', '↑', '→']

export class Renderer {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.width = 0
    this.height = 0

    // Visual state
    this.receptorGlow = [0, 0, 0, 0]        // timestamp of last glow per direction
    this.receptorGlowOpponent = [0, 0, 0, 0]
    this.missFlash = [0, 0, 0, 0]            // timestamp of last miss per direction
  }

  /** Resize canvas to fill container. */
  resize(width, height) {
    this.width = width
    this.height = height
    this.canvas.width = width
    this.canvas.height = height
  }

  /** Trigger a glow on a receptor (player side). */
  glowReceptor(direction) {
    this.receptorGlow[direction] = performance.now()
  }

  /** Trigger a glow on opponent receptor. */
  glowOpponentReceptor(direction) {
    this.receptorGlowOpponent[direction] = performance.now()
  }

  /** Trigger a miss flash on a receptor. */
  flashMiss(direction) {
    this.missFlash[direction] = performance.now()
  }

  /**
   * Draw one frame.
   * @param {Object} params
   * @param {number} params.songPosition - Current position in ms
   * @param {number} params.scrollSpeed
   * @param {Array} params.playerNotes - Player note states
   * @param {Array} params.opponentNotes - Opponent note states
   */
  draw({ songPosition, scrollSpeed, playerNotes, opponentNotes }) {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.width, this.height)

    // Background
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, this.width, this.height)

    // Calculate strumline positions (centered)
    const totalWidth = STRUMLINE_WIDTH * 2 + 80  // 80px gap between strumlines
    const startX = (this.width - totalWidth) / 2
    const opponentX = startX
    const playerX = startX + STRUMLINE_WIDTH + 80

    // Draw opponent strumline
    this._drawStrumline(ctx, opponentX, songPosition, scrollSpeed, opponentNotes, true)

    // Draw player strumline
    this._drawStrumline(ctx, playerX, songPosition, scrollSpeed, playerNotes, false)
  }

  _drawStrumline(ctx, baseX, songPosition, scrollSpeed, notes, isOpponent) {
    const now = performance.now()
    const glowArr = isOpponent ? this.receptorGlowOpponent : this.receptorGlow

    // Draw receptors
    for (let i = 0; i < KEY_COUNT; i++) {
      const x = baseX + i * LANE_WIDTH
      const y = RECEPTOR_Y

      // Glow effect
      const glowAge = now - glowArr[i]
      const glowing = glowAge < RECEPTOR_GLOW_DURATION
      const glowAlpha = glowing ? 1.0 - (glowAge / RECEPTOR_GLOW_DURATION) : 0

      // Miss flash
      const missAge = isOpponent ? Infinity : now - this.missFlash[i]
      const missFading = missAge < RECEPTOR_GLOW_DURATION

      // Draw receptor background
      ctx.fillStyle = missFading
        ? `rgba(255, 50, 50, ${0.6 * (1 - missAge / RECEPTOR_GLOW_DURATION)})`
        : `rgba(255, 255, 255, 0.15)`
      this._roundRect(ctx, x, y, NOTE_SIZE, NOTE_SIZE, 8)

      // Draw glow overlay
      if (glowing) {
        ctx.fillStyle = DIRECTION_COLORS[i] + Math.floor(glowAlpha * 180).toString(16).padStart(2, '0')
        this._roundRect(ctx, x - 3, y - 3, NOTE_SIZE + 6, NOTE_SIZE + 6, 10)
      }

      // Draw receptor border
      ctx.strokeStyle = isOpponent ? 'rgba(255,255,255,0.3)' : DIRECTION_COLORS[i]
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(x, y, NOTE_SIZE, NOTE_SIZE, 8)
      ctx.stroke()

      // Draw arrow symbol
      ctx.fillStyle = isOpponent ? 'rgba(255,255,255,0.4)' : DIRECTION_COLORS[i]
      ctx.font = 'bold 24px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(ARROWS[i], x + NOTE_SIZE / 2, y + NOTE_SIZE / 2)
    }

    // Draw notes
    for (const note of notes) {
      if (note.hit || note.missed) {
        // Draw hold trail for hit hold notes still active
        if (note.hit && note.l > 0 && !note.holdDropped) {
          this._drawHoldTrail(ctx, baseX, songPosition, scrollSpeed, note, isOpponent)
        }
        continue
      }

      const x = baseX + note.direction * LANE_WIDTH
      const timeDiff = note.t - songPosition
      const y = RECEPTOR_Y + timeDiff * scrollSpeed * PIXELS_PER_MS

      // Only draw if on screen
      if (y < -NOTE_SIZE || y > this.height + NOTE_SIZE) continue

      // Draw hold trail first (behind note)
      if (note.l > 0) {
        this._drawHoldTrail(ctx, baseX, songPosition, scrollSpeed, note, isOpponent)
      }

      // Draw note
      const color = DIRECTION_COLORS[note.direction]
      ctx.fillStyle = color
      this._roundRect(ctx, x, y, NOTE_SIZE, NOTE_SIZE, 8)

      // Arrow on note
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 22px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(ARROWS[note.direction], x + NOTE_SIZE / 2, y + NOTE_SIZE / 2)
    }
  }

  _drawHoldTrail(ctx, baseX, songPosition, scrollSpeed, note, isOpponent) {
    const x = baseX + note.direction * LANE_WIDTH + (NOTE_SIZE - HOLD_WIDTH) / 2
    const startTime = Math.max(note.t, songPosition)
    const endTime = note.t + note.l
    if (startTime >= endTime) return

    const startY = RECEPTOR_Y + (startTime - songPosition) * scrollSpeed * PIXELS_PER_MS + NOTE_SIZE / 2
    const endY = RECEPTOR_Y + (endTime - songPosition) * scrollSpeed * PIXELS_PER_MS + NOTE_SIZE / 2

    if (endY < 0 || startY > this.height) return

    const color = DIRECTION_COLORS[note.direction]
    ctx.fillStyle = note.holdDropped ? 'rgba(100,100,100,0.4)' : color + '80'
    ctx.fillRect(x, Math.max(0, startY), HOLD_WIDTH, Math.min(this.height, endY) - Math.max(0, startY))
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
    ctx.fill()
  }
}
