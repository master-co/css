'use client'

import { snackbar } from '../utils/snackbar'

export default function ColorPaletteItem({ color, level, colorName }: { color: string; level: number, colorName: string }) {
  const copyColor = () => {
    snackbar(
      `Copied <svg class="vertical-middle (margin-top:-0.125rem) (margin-left:0.25rem) (margin-right:0.125rem) inline-block w(6) h(6) round" style="background-color: ${color}"></svg> <b>${color}</b>`
    )
    navigator.clipboard.writeText(color)
  }

  return (
    <div key={color + level}>
      <div title={`${colorName}-${level} ${color}`} className="flex items-center justify-center w-full (aspect-ratio:3/2) r-sm outline-line-subtle outline-offset(-1) outline-solid outline(1) (letter-spacing:.5em) (cursor:pointer) (aspect-ratio:1/1)@sm"
        style={{ backgroundColor: color }}
        role="button"
        tabIndex={0}
        onClick={copyColor}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') copyColor()
        }}
      >
        {/* <div className="info invisible (line-height:1)">#{color}</div> */}
      </div>
      <div className="mt-xs font-xs text-center hidden@sm">{level}</div>
      {/* <code className="block fg-text-muted (font-size:10px) font-regular (margin-top:0.25rem)">{color}</code> */}
    </div>
  )
}
