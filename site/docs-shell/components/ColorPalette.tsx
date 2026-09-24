


import colorNames from '../data/color-names'
import colors, { COLOR_LEVELS } from '../data/color-palette'
import ColorPaletteItem from './ColorPaletteItem'

export default function ColorPalette({ filterColors }: { filterColors?: string[] }) {
  return (
    <div className="grid-cols:1 my:2xl gap-y:xl gap-y:sm@sm">
      <div className="sticky top:61px grid-cols:15 mt:-3x py:sm font:sm text-center bg:surface-base gap-x:xs hidden@<sm">
        <div className='grid-col-span:2@sm'></div>
        {COLOR_LEVELS.map((level) => (<div key={level}>{level}</div>))}
      </div>
      {colorNames
        .filter((variableName) => filterColors?.length ? filterColors.includes(variableName) : true)
        .map((colorName: string) => {
          const eachColors = colors[colorName]
          return (
            <div className="grid-cols:7 gap-x:sm gap-y:sm grid-cols:15@sm gap-y:5x@sm" key={colorName}>
              <div className="flex items-center font:sm capitalize white-space:pre-line text:strong grid-col-span:2@sm grid-col-span:7@<sm">
                {colorName}
              </div>
              {COLOR_LEVELS
                .filter((level) => eachColors[level])
                .map((level) => {
                  const color = eachColors[level]
                  return (
                    <ColorPaletteItem key={level} color={color!} colorName={colorName} level={level} />
                  )
                })}
            </div>
          )
        })}
    </div>
  )
}
