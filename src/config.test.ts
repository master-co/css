import { testCSS } from './utils/test-css';
import { MasterCSS } from './css';
import { configure } from './configure';

test("semantics", () => {
    testCSS(
        "fb", 
        ".fb{font-size:999}",
        new MasterCSS(configure({
            semantics: {
                'fb': 'font-size:999'
            }
        }))
    );
});

test("values", () => {
    testCSS(
        "font-size:big", 
        ".font-size\\:big{font-size:999}",
        new MasterCSS(configure({
            values: {
                'font-size': {
                    'big': 999
                }
            }
        }))
    );
});

