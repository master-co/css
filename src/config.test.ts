import { testCSS } from './utils/test-css';
import MasterCSS from './css';
import config from '../examples/master.css.js';

test("classes", () => {
    testCSS(
        "btn",
        ".bg\\:white,.card,.dark .btn{background-color:#ffffff}.fg\\:primary,.btn{color:#175fe9}.dark .fg\\:primary,.dark .btn{color:#6b9ef1}.bg\\:red,.btn{background-color:#d11a1e}.text\\:center,.btn,.dark .btn{text-align:center}.h\\:40,.btn,.dark .btn{height:2.5rem}.font\\:14,.btn,.dark .btn{font-size:0.875rem}",
        new MasterCSS(config)
    );
    testCSS(
        "card",
        ".b\\:1\\|solid\\|gray-80,.card{border:0.0625rem solid #dad9db}.p\\:20,.card{padding:1.25rem}.bg\\:white,.card,.dark .btn{background-color:#ffffff}",
        new MasterCSS(config)
    );
});

test("values", () => {
    testCSS(
        "w:2x", 
        ".w\\:2x{width:2rem}",
        new MasterCSS(config)
    );
    testCSS(
        "w:3x", 
        ".w\\:3x{width:3rem}",
        new MasterCSS(config)
    );
});

test("semantics", () => {
    testCSS(
        "show", 
        ".show{display:block}",
        new MasterCSS(config)
    );
    testCSS(
        "hide-text", 
        ".hide-text{font-size:0px}",
        new MasterCSS(config)
    );
});

test("breakpoints", () => {
    testCSS(
        "hide@tablet", 
        "@media (min-width:768px){.hide\\@tablet{display:none}}",
        new MasterCSS(config)
    );
    testCSS(
        "hide@laptop", 
        "@media (min-width:1024px){.hide\\@laptop{display:none}}",
        new MasterCSS(config)
    );
    testCSS(
        "hide@desktop", 
        "@media (min-width:1280px){.hide\\@desktop{display:none}}",
        new MasterCSS(config)
    );
});

test("selectors", () => {
    testCSS(
        "hide>custom", 
        ".hide\\>custom>div>:first+button{display:none}",
        new MasterCSS(config)
    );
});

test("mediaQueries", () => {
    testCSS(
        "hide@watch", 
        "@media (max-device-width:42mm) and (min-device-width:38mm){.hide\\@watch{display:none}}",
        new MasterCSS(config)
    );
});

test("colors", () => {
    testCSS(
        "fg:primary", 
        ".fg\\:primary,.btn{color:#175fe9}.dark .fg\\:primary,.dark .btn{color:#6b9ef1}",
        new MasterCSS(config)
    );
});
