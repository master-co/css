import { configure } from './configure';
import { defaultConfig, defaultThemes, defaultValues } from './config';

test("configure", () => {
    const custom = {
        themes: ['red'],
        values: {
            width: {
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
                    width: {
                        ...defaultValues.width,
                        ...custom.values.width
                    }
                }
            })
});
