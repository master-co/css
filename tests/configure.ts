import configure from '../src/apis/configure'
import { defaultConfig } from '../src/config'
import defaultThemes from '../src/config/themes'
import defaultValues from '../src/config/values'

test('configure', () => {
    const custom = {
        themes: ['red'],
        values: {
            Width: {
                'half': '50%'
            }
        }
    }
    expect(
        configure(custom)
    )
        .toEqual(
            {
                ...defaultConfig,
                themes: [...defaultThemes, ...custom.themes],
                values: {
                    ...defaultValues,
                    Width: {
                        ...defaultValues.Width,
                        ...custom.values.Width
                    }
                }
            })
})

test('configure undefined', () => {
    expect(configure(undefined as any))
        .toEqual(defaultConfig)
})