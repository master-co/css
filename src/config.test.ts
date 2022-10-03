import { testCSS } from './utils/test-css';
import { Rules } from './rules';

test("semantics", () => {
    Rules.extend('semantics', {
        'font-size': {
            'fb': 999
        }
    });

    testCSS("fb", ".fb{font-size:999}");
});

test("values", () => {
    Rules.extend('values', {
        'font-size': {
            'big': 999
        }
    });

    testCSS("font-size:big", ".font-size\\:big{font-size:999}");
});

