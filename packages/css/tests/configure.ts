import extend from '../src/apis/extend'
import defaultConfig from '../src/config'
import defaultThemes from '../src/config/themes'
import defaultValues from '../src/config/values'

test('configure', () => {
    const useConfig = {
        themes: ['red'],
        values: {
            Width: {
                'half': '50%'
            }
        }
    }
    expect(
        extend(defaultConfig, useConfig)
    )
        .toEqual(
            {
                ...defaultConfig,
                themes: [...defaultThemes, ...useConfig.themes],
                values: {
                    ...defaultValues,
                    Width: {
                        ...defaultValues.Width,
                        ...useConfig.values.Width
                    }
                }
            })
})