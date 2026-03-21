// Centralized async asset loader with caching and BASE_URL support.

const BASE = import.meta.env.BASE_URL
const imageCache = new Map()
const textCache = new Map()

/** Load an image, returns HTMLImageElement. Cached. */
export function loadImage(path) {
  if (imageCache.has(path)) return Promise.resolve(imageCache.get(path))
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      imageCache.set(path, img)
      resolve(img)
    }
    img.onerror = () => reject(new Error(`Failed to load image: ${path}`))
    img.src = `${BASE}${path}`
  })
}

/** Load text file (XML, etc). Cached. */
export async function loadText(path) {
  if (textCache.has(path)) return textCache.get(path)
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`Failed to load: ${path} (${res.status})`)
  const text = await res.text()
  textCache.set(path, text)
  return text
}

/** Load JSON file. Cache-busted to avoid stale data on deploys. */
export async function loadJSON(path) {
  const res = await fetch(`${BASE}${path}?v=${Date.now()}`)
  if (!res.ok) throw new Error(`Failed to load: ${path} (${res.status})`)
  return res.json()
}
