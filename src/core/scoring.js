// PBOT1 scoring system ported from Funkin-main/source/funkin/play/scoring/Scoring.hx
import {
  PBOT1_MAX_SCORE, PBOT1_SCORING_OFFSET, PBOT1_SCORING_SLOPE,
  PBOT1_MIN_SCORE, PBOT1_MISS_SCORE, PBOT1_PERFECT_THRESHOLD,
  PBOT1_SICK_THRESHOLD, PBOT1_GOOD_THRESHOLD, PBOT1_BAD_THRESHOLD,
  PBOT1_SHIT_THRESHOLD,
  RANK_PERFECT_THRESHOLD, RANK_EXCELLENT_THRESHOLD,
  RANK_GREAT_THRESHOLD, RANK_GOOD_THRESHOLD,
} from '../constants.js'

/**
 * Score a note hit using the PBOT1 sigmoid curve.
 * @param {number} msTiming - Difference in ms between note time and hit time
 * @returns {number} Score value (max 500, min -100 for miss)
 */
export function scoreNote(msTiming) {
  const abs = Math.abs(msTiming)
  if (abs > PBOT1_SHIT_THRESHOLD) return PBOT1_MISS_SCORE
  if (abs < PBOT1_PERFECT_THRESHOLD) return PBOT1_MAX_SCORE
  const factor = 1.0 - (1.0 / (1.0 + Math.exp(-PBOT1_SCORING_SLOPE * (abs - PBOT1_SCORING_OFFSET))))
  return Math.floor(PBOT1_MAX_SCORE * factor + PBOT1_MIN_SCORE)
}

/**
 * Judge a note hit.
 * @param {number} msTiming - Difference in ms between note time and hit time
 * @returns {string} Judgement: 'sick', 'good', 'bad', 'shit', or 'miss'
 */
export function judgeNote(msTiming) {
  const abs = Math.abs(msTiming)
  if (abs < PBOT1_SICK_THRESHOLD) return 'sick'
  if (abs < PBOT1_GOOD_THRESHOLD) return 'good'
  if (abs < PBOT1_BAD_THRESHOLD) return 'bad'
  if (abs < PBOT1_SHIT_THRESHOLD) return 'shit'
  return 'miss'
}

/** @returns {number} Score penalty for a missed note */
export function getMissScore() {
  return PBOT1_MISS_SCORE
}

/**
 * Calculate rank from tally data.
 * @param {{ sick: number, good: number, bad: number, shit: number, missed: number, totalNotes: number }} tallies
 * @returns {string|null} Rank string or null if no data
 */
export function calculateRank(tallies) {
  if (!tallies || tallies.totalNotes === 0) return null

  // Perfect Gold = all sick
  if (tallies.sick === tallies.totalNotes) return 'PERFECT_GOLD'

  // Completion = (sick + good - missed) / totalNotes, clamped 0-1
  const completion = Math.max(0, Math.min(1,
    (tallies.sick + tallies.good - tallies.missed) / tallies.totalNotes
  ))

  if (completion >= RANK_PERFECT_THRESHOLD) return 'PERFECT'
  if (completion >= RANK_EXCELLENT_THRESHOLD) return 'EXCELLENT'
  if (completion >= RANK_GREAT_THRESHOLD) return 'GREAT'
  if (completion >= RANK_GOOD_THRESHOLD) return 'GOOD'
  return 'SHIT'
}
