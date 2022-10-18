import configure from './configure';
import defaultConfig from './config';
import defaultThemes from './config/themes';
import defaultValues from './config/values';

test("configure", () => {
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
});

test("configure undefined", () => {
    expect(configure(undefined))
        .toEqual(defaultConfig)
})