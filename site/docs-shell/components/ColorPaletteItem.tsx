'use client'

import { snackbar } from '../utils/snackbar'

export default function ColorPaletteItem({ color, level, colorName }: { color: string; level: number, colorName: string }) {
  const copyColor = () => {
    snackbar(
      `Copied <svg class="vertical-align:middle mt:-0.125rem ml:1x mr:0.125rem inline-block w:6px h:6px round" style="background-color: ${color}"></svg> <b>${color}</b>`
    )
    navigator.clipboard.writeText(color)
  }

  return (
    <div key={color + level}>
      <div title={`${colorName}-${level} ${color}`} className="flex items-center justify-center w:full aspect-ratio:3/2 r:sm outline:1px|solid outline-offset:-1px outline:subtle tracking:.5em cursor:pointer square@sm"
        style={{ backgroundColor: color }}
        role="button"
        tabIndex={0}
        onClick={copyColor}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') copyColor()
        }}
      >
        {/* <div className="info invisible leading:1">#{color}</div> */}
      </div>
      <div className="mt:xs font:xs text-center hidden@sm">{level}</div>
      {/* <code className="block text:muted font:10px font:regular mt:1x">{color}</code> */}
    </div>
  )
}
