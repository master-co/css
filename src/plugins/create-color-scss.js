const path = require('path');
const webpack = require("webpack");
const colors = require('../colors');
const { RawSource } = require("webpack-sources");
const generateLevelColors = require('../utils/generate-level-colors');

module.exports = class CreateColorScssPlugin {
    apply(compiler) {
        compiler.hooks.thisCompilation.tap(CreateColorScssPlugin.name, compilation => {
            compilation.hooks.processAssets.tap(
                {
                    name: CreateColorScssPlugin.name,
                    stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
                },
                async () => {
                    let data = '';
                    for (const colorName in colors) {
                        const levelColors = generateLevelColors(colors[colorName]);
                        for (const level in levelColors) {
                            let name = colorName;
                            if (level !== '') {
                                name += '-' + level;
                            }

                            data += '$' + name + ': #' + levelColors[level] + ';';
                        }
                    }
    
                    compilation.emitAsset('color.scss', new RawSource(data));
                });
        });
    }
}
