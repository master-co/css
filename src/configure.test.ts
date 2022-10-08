import { configure } from './configure';
import { defaultConfig } from './default-config';
import { deepEqual } from 'fast-equals';

test("configure", () => {
    expect(
        deepEqual(
            configure({}),
            {
                ...defaultConfig,
            }
        )
    ).toBe(true)
});
