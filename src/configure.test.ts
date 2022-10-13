import { configure } from './configure';
import { defaultConfig, defaultThemes, defaultValues } from './config';

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
