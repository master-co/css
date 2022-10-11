import { configure } from './configure';
import { defaultConfig } from './config';
import { themes, values } from './index';

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
                themes: [...themes, ...custom.themes],
                values: {
                    ...values,
                    width: {
                        ...values.width,
                        ...custom.values.width
                    }
                }
            })
});
