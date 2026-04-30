import rule from '../../../src/rules/class-validation'
import { jsxTester } from '../../testers'

jsxTester.run('issue 405 323 331 math fns and modern css', rule, {
    valid: [
        // #405 — min/max/clamp must not raise false positive
        { code: `<div class="w:min(50vw,200px)">a</div>` },
        { code: `<div class="w:max(10rem,50%)">a</div>` },
        { code: `<div class="w:clamp(10rem,5vw,20rem)">a</div>` },
        // #323 — right:max(...) was reported as invalid
        { code: `<div class="right:max(0px,1rem)">a</div>` },
        // #358-style: clamp with bare arithmetic (auto-wrapped at parse, must not error here)
        { code: `<div class="font-size:clamp(1rem,calc(2vw+1rem),3rem)">a</div>` },
        // #331-style: modern properties should be valid
        { code: `<div class="aspect:16/9">a</div>` },
        { code: `<div class="rotate:45deg">a</div>` },
    ],
    invalid: []
})
