// Parse FNF chart and metadata JSON files
// Format reference: Funkin-main/source/funkin/data/song/SongData.hx, docs/FNFC-SPEC.md
import { KEY_COUNT } from '../constants.js'

/**
 * Load song metadata from FNF format.
 * @param {string} songId
 * @returns {Promise<{songName, artist, timeChanges, difficulties, characters, stage, noteStyle, ratings}>}
 */
export async function loadMetadata(songId) {
  const url = `/songs/${songId}/${songId}-metadata.json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load metadata: ${url} (${res.status})`)
  const data = await res.json()

  return {
    songName: data.songName ?? songId,
    artist: data.artist ?? 'Unknown',
    timeChanges: (data.timeChanges ?? []).map(tc => ({
      t: tc.t ?? 0,
      bpm: tc.bpm ?? 100,
      b: tc.b ?? null,
      n: tc.n ?? 4,
      d: tc.d ?? 4,
    })),
    difficulties: data.playData?.difficulties ?? ['normal'],
    characters: data.playData?.characters ?? {},
    stage: data.playData?.stage ?? 'mainStage',
    noteStyle: data.playData?.noteStyle ?? 'funkin',
    ratings: data.playData?.ratings ?? {},
    offsets: data.offsets ?? {},
  }
}

/**
 * Load chart data for a specific difficulty.
 * @param {string} songId
 * @param {string} difficulty
 * @returns {Promise<{notes: Array, events: Array, scrollSpeed: number}>}
 */
export async function loadChart(songId, difficulty = 'normal') {
  const url = `/songs/${songId}/${songId}-chart.json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load chart: ${url} (${res.status})`)
  const data = await res.json()

  const rawNotes = data.notes?.[difficulty] ?? data.notes?.normal ?? []
  const scrollSpeed = data.scrollSpeed?.[difficulty] ?? data.scrollSpeed?.normal ?? 1.0
  const events = data.events ?? []

  // Parse notes into a cleaner format
  const notes = rawNotes.map(n => ({
    t: n.t,                          // time in ms
    d: n.d,                          // direction (0-3 player, 4-7 opponent)
    l: n.l ?? 0,                     // hold length in ms
    k: n.k ?? null,                  // note kind
    direction: n.d % KEY_COUNT,      // 0=left, 1=down, 2=up, 3=right
    isOpponent: n.d >= KEY_COUNT,    // true if opponent note
  }))

  // Sort by time
  notes.sort((a, b) => a.t - b.t)

  return { notes, events, scrollSpeed }
}

/**
 * Separate notes into player and opponent arrays.
 * @param {Array} notes - All notes
 * @returns {{ playerNotes: Array, opponentNotes: Array }}
 */
export function splitNotes(notes) {
  const playerNotes = notes.filter(n => !n.isOpponent)
  const opponentNotes = notes.filter(n => n.isOpponent)
  return { playerNotes, opponentNotes }
}
