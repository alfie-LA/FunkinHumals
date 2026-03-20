// Note transformation pipeline — the mode expansion point.
// Ported from Funkin-main/source/funkin/util/GRhythmUtil.hx mirrorNoteDirection
import { KEY_COUNT } from '../constants.js'

/**
 * Mirror a single note direction, preserving strumline.
 * 0↔3, 1↔2 (left↔right, down↔up) within each strumline.
 * @param {number} d - Note direction (0-7)
 * @returns {number} Mirrored direction
 */
export function mirrorDirection(d) {
  const strumline = Math.floor(d / KEY_COUNT) * KEY_COUNT
  return strumline + (KEY_COUNT - 1 - (d % KEY_COUNT))
}

/**
 * Transform notes based on the active mode.
 * Returns a new array (does not mutate input).
 * @param {Array} notes - Note array from chart-loader
 * @param {string} mode - 'normal', 'mirrored', etc.
 * @returns {Array} Transformed notes
 */
export function transformNotes(notes, mode) {
  switch (mode) {
    case 'normal':
      return notes

    case 'mirrored':
      return notes.map(n => {
        const newD = mirrorDirection(n.d)
        return {
          ...n,
          d: newD,
          direction: newD % KEY_COUNT,
          isOpponent: newD >= KEY_COUNT,
        }
      })

    // Future modes:
    // case 'shuffle': randomize directions per note
    // case 'double': duplicate notes with offset
    // case 'hidden': notes fade before reaching receptors
    // case 'sudden': notes appear late
    default:
      console.warn(`Unknown mode: ${mode}, using normal`)
      return notes
  }
}
