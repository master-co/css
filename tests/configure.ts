import extend from '../src/apis/extend'
import config from '../src/config'
import themes from '../src/config/themes'
import values from '../src/config/values'

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
        extend(config, useConfig)
    )
        .toEqual(
            {
                ...config,
                themes: [...themes, ...useConfig.themes],
                values: {
                    ...values,
                    Width: {
                        ...values.Width,
                        ...useConfig.values.Width
                    }
                }
            })
})