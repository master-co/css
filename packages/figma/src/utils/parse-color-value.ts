import Color from 'colorjs.io'

export interface RGBA {
  r: number
  g: number
  b: number
  a: number
}

export default function parseColorValue(input: string): RGBA {
  const color = new Color(input)
  const [r = 0, g = 0, b = 0] = color.to('srgb', { inGamut: true }).coords.map((coord) => coord ?? 0)
  const a = color.alpha ?? 1
  return { r, g, b, a }
}
