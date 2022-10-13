import webpack from "webpack";
import { defaultColors } from './src/config/colors';
import { RawSource } from "webpack-sources";

function hexToRgb(hex) {
    if (hex.startsWith('#')) {
        hex = hex.slice(1);
    }

    const aRgbHex = hex.match(/.{1,2}/g);
    return [parseInt(aRgbHex[0], 16), parseInt(aRgbHex[1], 16), parseInt(aRgbHex[2], 16)];
}

function rgbToHex(r, g, b) {
    return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function fillColorScale(data) {
    if (typeof data === 'string') {
        data = { '': data };
    }

    const hasMainRgb = '' in data;

    let isLevelMore100 = false;
    for (const level in data) {
        if (level && +level >= 100) {
            isLevelMore100 = true;
            break;
        }
    }

    if (!isLevelMore100 && (!hasMainRgb || Object.keys(data).length > 1)) {
        let startLevel = 0,
            startRgb = '0' in data
                ? hexToRgb(data[0])
                : [0, 0, 0],
            endLevel,
            endRgb;

        const newLevels: any = [];
        const generateColor = () => {
            const levelDiff = endLevel - startLevel;
            const rgbDiff = endRgb.map((color, i) => (color - startRgb[i]) / levelDiff);
            for (const eachNewLevel of newLevels) {
                const currentLevelDiff = eachNewLevel - startLevel;
                const newRgb = startRgb.map((color, i) => Math.round(color + rgbDiff[i] * currentLevelDiff));
                data[eachNewLevel] = '#' + rgbToHex.call(this, ...newRgb);
            }
        };

        for (let i = 1; i < 100; i++) {
            if (i in data) {
                if (newLevels.length) {
                    endLevel = i;
                    endRgb = hexToRgb(data[i]);

                    generateColor();

                    newLevels.length = 0;

                    startRgb = endRgb;
                } else {
                    startRgb = hexToRgb(data[i]);
                }

                startLevel = i;
            } else {
                newLevels.push(i);
            }
        }

        if (newLevels.length) {
            endLevel = 100;
            endRgb = '100' in data
                ? hexToRgb(data[100])
                : [255, 255, 255];

            generateColor();
        }
    }

    if (!hasMainRgb) {
        data[''] = data[isLevelMore100 ? '500' : '50'];
    }

    return data;
}

module.exports = class CreateColorScssPlugin {
    apply(compiler) {
        compiler.hooks.thisCompilation.tap(CreateColorScssPlugin.name, compilation => {
            compilation.hooks.processAssets.tap(
                {
                    name: CreateColorScssPlugin.name,
                    stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
                },
                async () => {
                    console.log()
                    let data = '';
                    for (const colorName in defaultColors) {
                        const levelColors = fillColorScale(defaultColors[colorName]);
                        for (const level in levelColors) {
                            let name = colorName;
                            if (level !== '') {
                                name += '-' + level;
                            }

                            data += '$' + name + ':' + levelColors[level] + ';';
                        }
                    }

                    compilation.emitAsset('color.scss', new RawSource(data));
                });
        });
    }
}
