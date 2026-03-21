// Gameplay constants ported from FNF source:
// - Funkin-main/source/funkin/util/Constants.hx
// - Funkin-main/source/funkin/play/scoring/Scoring.hx

// Timing
export const HIT_WINDOW_MS = 160.0
export const STEPS_PER_BEAT = 4
export const KEY_COUNT = 4
export const MS_PER_SEC = 1000.0
export const SECS_PER_MIN = 60.0
export const DEFAULT_BPM = 100.0
export const PIXELS_PER_MS = 0.45

// Conductor lerp (from PlayState.hx)
export const CONDUCTOR_DRIFT_THRESHOLD = 65.0
export const MUSIC_EASE_RATIO = 42.0

// PBOT1 Scoring (sigmoid curve)
export const PBOT1_MAX_SCORE = 500
export const PBOT1_SCORING_OFFSET = 54.99
export const PBOT1_SCORING_SLOPE = 0.080
export const PBOT1_MIN_SCORE = 9.0
export const PBOT1_MISS_SCORE = -100
export const PBOT1_PERFECT_THRESHOLD = 5.0
export const PBOT1_SICK_THRESHOLD = 45.0
export const PBOT1_GOOD_THRESHOLD = 90.0
export const PBOT1_BAD_THRESHOLD = 135.0
export const PBOT1_SHIT_THRESHOLD = 160.0

// Health (range 0.0 to 2.0)
export const HEALTH_MAX = 2.0
export const HEALTH_START = 1.0
export const HEALTH_MIN = 0.0
export const HEALTH_SICK_BONUS = 0.03
export const HEALTH_GOOD_BONUS = 0.015
export const HEALTH_BAD_BONUS = 0.0
export const HEALTH_SHIT_BONUS = -0.02
export const HEALTH_MISS_PENALTY = -0.08
export const HEALTH_GHOST_MISS_PENALTY = -0.08
export const HEALTH_HOLD_BONUS_PER_SEC = 0.12
export const HEALTH_HOLD_DROP_PENALTY_PER_SEC = 0.0
export const HEALTH_HOLD_DROP_PENALTY_MAX = -0.20
export const HOLD_DROP_PENALTY_THRESHOLD_MS = 160.0

// Score
export const SCORE_HOLD_BONUS_PER_SEC = 250.0
export const SCORE_HOLD_DROP_PENALTY_PER_SEC = -125.0

// Combo breaks
export const JUDGEMENT_SICK_COMBO_BREAK = false
export const JUDGEMENT_GOOD_COMBO_BREAK = false
export const JUDGEMENT_BAD_COMBO_BREAK = true
export const JUDGEMENT_SHIT_COMBO_BREAK = true

// Rank thresholds
export const RANK_PERFECT_THRESHOLD = 1.00
export const RANK_EXCELLENT_THRESHOLD = 0.90
export const RANK_GREAT_THRESHOLD = 0.80
export const RANK_GOOD_THRESHOLD = 0.60

// Key bindings (arrow keys)
export const KEY_BINDINGS = {
  ArrowLeft: 0,
  ArrowDown: 1,
  ArrowUp: 2,
  ArrowRight: 3,
  // DFJK alternative
  KeyD: 0,
  KeyF: 1,
  KeyJ: 2,
  KeyK: 3,
}

// Camera (from PlayState.hx / Constants.hx)
export const CAMERA_BOP_INTENSITY = 1.015
export const CAMERA_ZOOM_RATE = 4       // Bop every N beats
export const CAMERA_DECAY_RATE = 0.95   // Per-frame lerp decay (normalized to 60fps)
export const CAMERA_FOLLOW_RATE = 0.04  // Camera follow lerp rate
export const DEFAULT_STAGE_ZOOM = 1.1   // mainStage default

// Virtual resolution (FNF internal coordinate space)
export const GAME_WIDTH = 1280
export const GAME_HEIGHT = 720

// Direction names
export const DIRECTION_NAMES = ['left', 'down', 'up', 'right']

// Colors per direction
export const DIRECTION_COLORS = ['#C24B99', '#00FFFF', '#12FA05', '#F9393F']
