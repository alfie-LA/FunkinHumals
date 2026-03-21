// Sparrow XML atlas parser.
// Parses PNG+XML spritesheets into frame lookup tables for animation.

/**
 * Parse a Sparrow V2 XML atlas into a frame map.
 * @param {string} xmlText - Raw XML text
 * @returns {SparrowAtlas}
 */
export class SparrowAtlas {
  constructor(xmlText) {
    this.frames = new Map()
    this._parse(xmlText)
  }

  _parse(xmlText) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlText, 'text/xml')
    const subtextures = doc.querySelectorAll('SubTexture')

    for (const st of subtextures) {
      const name = st.getAttribute('name')
      const frame = {
        name,
        x: parseInt(st.getAttribute('x')) || 0,
        y: parseInt(st.getAttribute('y')) || 0,
        width: parseInt(st.getAttribute('width')) || 0,
        height: parseInt(st.getAttribute('height')) || 0,
        frameX: parseInt(st.getAttribute('frameX')) || 0,
        frameY: parseInt(st.getAttribute('frameY')) || 0,
        frameWidth: parseInt(st.getAttribute('frameWidth')) || 0,
        frameHeight: parseInt(st.getAttribute('frameHeight')) || 0,
        rotated: st.getAttribute('rotated') === 'true',
      }
      // If no frameWidth/Height specified, use width/height
      if (frame.frameWidth === 0) frame.frameWidth = frame.width
      if (frame.frameHeight === 0) frame.frameHeight = frame.height
      this.frames.set(name, frame)
    }
  }

  /**
   * Get animation frames by prefix, sorted by trailing number.
   * @param {string} prefix - Frame name prefix (e.g. "BF idle dance")
   * @param {number[]|null} frameIndices - Optional: use only these frame indices
   * @returns {Object[]} Sorted array of frame data
   */
  getAnimation(prefix, frameIndices = null) {
    const matching = []

    for (const [name, frame] of this.frames) {
      if (name.startsWith(prefix)) {
        // Extract trailing number (e.g. "BF idle dance0003" -> 3)
        const suffix = name.slice(prefix.length)
        const num = parseInt(suffix) || 0
        matching.push({ ...frame, _index: num })
      }
    }

    // Sort by frame number
    matching.sort((a, b) => a._index - b._index)

    // Apply frame indices filter if provided
    if (frameIndices) {
      return frameIndices.map(i => matching[i]).filter(Boolean)
    }

    return matching
  }
}
