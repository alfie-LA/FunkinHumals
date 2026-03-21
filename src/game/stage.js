// Stage: loads stage JSON, prop images, and positions characters.
// Draws background props with parallax scrolling.

import { loadImage, loadJSON } from './asset-loader.js'
import { Character } from './character.js'

export class Stage {
  constructor() {
    this.data = null
    this.props = []       // { image, position, scale, scroll, zIndex }
    this.characters = {}  // { bf, dad, gf }
    this.cameraZoom = 1.1
  }

  /**
   * Load a stage and its characters.
   * @param {string} stageId - e.g. 'mainStage'
   */
  async load(stageId) {
    this.data = await loadJSON(`data/stages/${stageId}.json`)
    this.cameraZoom = this.data.cameraZoom ?? 1.0

    // Load prop images
    this.props = []
    for (const propData of this.data.props ?? []) {
      try {
        const image = await loadImage(`images/${propData.assetPath}.png`)
        this.props.push({
          image,
          position: propData.position ?? [0, 0],
          scale: Array.isArray(propData.scale) ? propData.scale : [propData.scale ?? 1, propData.scale ?? 1],
          scroll: propData.scroll ?? [1, 1],
          zIndex: propData.zIndex ?? 0,
        })
      } catch (e) {
        console.warn(`Could not load stage prop: ${propData.assetPath}`, e)
      }
    }

    // Sort props by zIndex
    this.props.sort((a, b) => a.zIndex - b.zIndex)

    // Load characters
    const charData = this.data.characters ?? {}

    if (charData.gf) {
      const gf = new Character()
      try {
        await gf.load('gf', 'gf')
        gf.setPosition(
          charData.gf.position?.[0] ?? 0,
          charData.gf.position?.[1] ?? 0,
          charData.gf.cameraOffsets ?? [0, 0]
        )
        this.characters.gf = gf
      } catch (e) {
        console.warn('Could not load GF:', e)
      }
    }

    if (charData.dad) {
      const dad = new Character()
      try {
        await dad.load('dad', 'dad')
        dad.setPosition(
          charData.dad.position?.[0] ?? 0,
          charData.dad.position?.[1] ?? 0,
          charData.dad.cameraOffsets ?? [0, 0]
        )
        this.characters.dad = dad
      } catch (e) {
        console.warn('Could not load Dad:', e)
      }
    }

    if (charData.bf) {
      const bf = new Character()
      try {
        await bf.load('bf', 'bf')
        bf.setPosition(
          charData.bf.position?.[0] ?? 0,
          charData.bf.position?.[1] ?? 0,
          charData.bf.cameraOffsets ?? [0, 0]
        )
        this.characters.bf = bf
      } catch (e) {
        console.warn('Could not load BF:', e)
      }
    }
  }

  /**
   * Draw all stage props with parallax.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} cameraX - Camera follow point X
   * @param {number} cameraY - Camera follow point Y
   */
  drawProps(ctx, cameraX, cameraY) {
    for (const prop of this.props) {
      const px = prop.position[0] - cameraX * prop.scroll[0]
      const py = prop.position[1] - cameraY * prop.scroll[1]
      const sw = prop.image.width * prop.scale[0]
      const sh = prop.image.height * prop.scale[1]
      ctx.drawImage(prop.image, px, py, sw, sh)
    }
  }

  /**
   * Draw characters sorted by zIndex.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} cameraX
   * @param {number} cameraY
   */
  drawCharacters(ctx, cameraX, cameraY) {
    // Sort by zIndex from stage data
    const charEntries = []
    const charData = this.data?.characters ?? {}

    if (this.characters.gf) {
      charEntries.push({ char: this.characters.gf, zIndex: charData.gf?.zIndex ?? 100 })
    }
    if (this.characters.dad) {
      charEntries.push({ char: this.characters.dad, zIndex: charData.dad?.zIndex ?? 200 })
    }
    if (this.characters.bf) {
      charEntries.push({ char: this.characters.bf, zIndex: charData.bf?.zIndex ?? 300 })
    }

    charEntries.sort((a, b) => a.zIndex - b.zIndex)

    for (const { char } of charEntries) {
      char.draw(ctx, -cameraX, -cameraY)
    }
  }

  /**
   * Update all characters.
   * @param {number} dt
   * @param {Object} conductor
   * @param {boolean} isPlayerHolding
   */
  updateCharacters(dt, conductor, isPlayerHolding = false) {
    this.characters.gf?.update(dt, conductor)
    this.characters.dad?.update(dt, conductor)
    this.characters.bf?.update(dt, conductor, isPlayerHolding)
  }
}
