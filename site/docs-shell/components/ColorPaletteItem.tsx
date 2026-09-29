'use client'

import { snackbar } from '../utils/snackbar'

export default function ColorPaletteItem({ color, level, colorName }: { color: string; level: number, colorName: string }) {
  const copyColor = () => {
    snackbar(
      `Copied <svg class="vertical-align:middle margin-top:-0.125rem margin-left:0.25rem margin-right:0.125rem display:inline-block width:6px height:6px round" style="background-color: ${color}"></svg> <b>${color}</b>`
    )
    navigator.clipboard.writeText(color)
  }

  return (
    <div key={color + level}>
      <div title={`${colorName}-${level} ${color}`} className="display:flex align-items:center justify-content:center width:100% aspect-ratio:3/2 r-sm outline:1px|solid outline-line-subtle outline-offset:-1px letter-spacing:.5em cursor:pointer aspect-ratio:1/1@sm"
        style={{ backgroundColor: color }}
        role="button"
        tabIndex={0}
        onClick={copyColor}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') copyColor()
        }}
      >
        {/* <div className="info visibility:hidden line-height:1">#{color}</div> */}
      </div>
      <div className="mt-xs font-xs text-align:center display:none@sm">{level}</div>
      {/* <code className="display:block fg-text-muted font-size:10px font-regular margin-top:0.25rem">{color}</code> */}
    </div>
  )
}
