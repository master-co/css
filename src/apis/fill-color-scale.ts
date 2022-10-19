import { hexToRgb } from '../utils/hex-to-rgb'
import { rgbToHex } from '../utils/rgb-to-hex'

export function fillColorScale(data) {
    if (typeof data === 'string') {
        data = { '': data }
    }

    const hasMainRgb = '' in data

    let isLevelMore100 = false
    for (const level in data) {
        if (level && +level >= 100) {
            isLevelMore100 = true
            break
        }
    }

    if (!isLevelMore100 && (!hasMainRgb || Object.keys(data).length > 1)) {
        let startLevel = 0,
            startRgb = '0' in data
                ? hexToRgb(data[0])
                : [0, 0, 0],
            endLevel,
            endRgb

        const newLevels = []
        const generateColor = () => {
            const levelDiff = endLevel - startLevel
            const rgbDiff = endRgb.map((color, i) => (color - startRgb[i]) / levelDiff)
            for (const eachNewLevel of newLevels) {
                const currentLevelDiff = eachNewLevel - startLevel
                const newRgb = startRgb.map((color, i) => Math.round(color + rgbDiff[i] * currentLevelDiff))
                data[eachNewLevel] = '#' + rgbToHex.call(this, ...newRgb)
            }
        }

        for (let i = 1; i < 100; i++) {
            if (i in data) {
                if (newLevels.length) {
                    endLevel = i
                    endRgb = hexToRgb(data[i])

                    generateColor()

                    newLevels.length = 0

                    startRgb = endRgb
                } else {
                    startRgb = hexToRgb(data[i])
                }

                startLevel = i
            } else {
                newLevels.push(i)
            }
        }

        if (newLevels.length) {
            endLevel = 100
            endRgb = '100' in data
                ? hexToRgb(data[100])
                : [255, 255, 255]

            generateColor()
        }
    }

    if (!hasMainRgb) {
        data[''] = data[isLevelMore100 ? '500' : '50']
    }

    return data
}