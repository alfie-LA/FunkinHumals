// Web Audio API manager for precise music playback

export class AudioManager {
  constructor() {
    this.ctx = null
    this.instrumentalBuffer = null
    this.vocalBuffers = []
    this.instrumentalSource = null
    this.vocalSources = []
    this.startTime = 0        // audioContext.currentTime when playback started
    this.startOffset = 0      // offset into the song we started at
    this.playing = false
    this.pausedAt = 0          // song position when paused
  }

  /** Initialize AudioContext (must be called from user gesture). */
  async init() {
    if (!this.ctx) {
      this.ctx = new AudioContext()
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }
  }

  /**
   * Load a song's audio files.
   * @param {string} songId
   * @param {string[]} vocalFiles - e.g. ['Voices-bf.ogg', 'Voices-dad.ogg']
   */
  async loadSong(songId, vocalFiles = []) {
    await this.init()

    // Load instrumental (generate silent buffer if missing)
    const instUrl = `/songs/${songId}/Inst.ogg`
    try {
      this.instrumentalBuffer = await this._loadAudio(instUrl)
    } catch (e) {
      console.warn(`No instrumental found for "${songId}", using silent fallback.`)
      this.instrumentalBuffer = this._createSilentBuffer(30) // 30 seconds
    }

    // Load vocals
    this.vocalBuffers = []
    for (const file of vocalFiles) {
      try {
        const url = `/songs/${songId}/${file}`
        const buffer = await this._loadAudio(url)
        this.vocalBuffers.push(buffer)
      } catch (e) {
        console.warn(`Could not load vocal track: ${file}`, e)
      }
    }
  }

  /** Create a silent AudioBuffer as a fallback when audio files are missing. */
  _createSilentBuffer(durationSec) {
    const sampleRate = this.ctx.sampleRate
    const length = sampleRate * durationSec
    return this.ctx.createBuffer(1, length, sampleRate)
  }

  async _loadAudio(url) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to fetch audio: ${url} (${res.status})`)
    const arrayBuffer = await res.arrayBuffer()
    return await this.ctx.decodeAudioData(arrayBuffer)
  }

  /**
   * Start playback from a given position.
   * @param {number} offsetMs - Start position in milliseconds
   */
  play(offsetMs = 0) {
    if (!this.instrumentalBuffer) return
    this.stop()

    const offsetSec = offsetMs / 1000

    // Instrumental
    this.instrumentalSource = this.ctx.createBufferSource()
    this.instrumentalSource.buffer = this.instrumentalBuffer
    this.instrumentalSource.connect(this.ctx.destination)
    this.instrumentalSource.start(0, Math.max(0, offsetSec))

    // Vocals
    this.vocalSources = this.vocalBuffers.map(buf => {
      const src = this.ctx.createBufferSource()
      src.buffer = buf
      src.connect(this.ctx.destination)
      src.start(0, Math.max(0, offsetSec))
      return src
    })

    this.startTime = this.ctx.currentTime
    this.startOffset = offsetMs
    this.playing = true
  }

  /** Pause playback. */
  pause() {
    if (!this.playing) return
    this.pausedAt = this.getCurrentTime()
    this.stop()
  }

  /** Resume from paused position. */
  resume() {
    if (this.playing) return
    this.play(this.pausedAt)
  }

  /** Stop all audio sources. */
  stop() {
    try { this.instrumentalSource?.stop() } catch {}
    for (const src of this.vocalSources) {
      try { src.stop() } catch {}
    }
    this.instrumentalSource = null
    this.vocalSources = []
    this.playing = false
  }

  /**
   * Get current playback position in milliseconds.
   * Uses AudioContext.currentTime for sub-ms precision.
   * @returns {number}
   */
  getCurrentTime() {
    if (!this.playing) return this.pausedAt
    const elapsed = (this.ctx.currentTime - this.startTime) * 1000
    return this.startOffset + elapsed
  }

  /** Get the duration of the instrumental in milliseconds. */
  get duration() {
    if (!this.instrumentalBuffer) return 0
    return this.instrumentalBuffer.duration * 1000
  }
}
