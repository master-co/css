import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { Script } from 'node:vm'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'

// Every build result is evidence, not an assertion that rejection is correct.
const packageDir = resolve(process.env.BH_NEXT_PACKAGE_DIR)
const evidence = resolve(process.env.BH_NEXT_HOST_EVIDENCE)
const requireNext = createRequire(join(packageDir, 'package.json'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const bundler = process.env.BH_NEXT_BUNDLER || 'turbopack'
const pure = process.env.BH_NEXT_PURE === '1'
const scenario = process.env.BH_NEXT_EDGE_CASE
const client = process.env.BH_NEXT_EDGE_CLIENT === '1'
const mixed = process.env.BH_NEXT_EDGE_MIXED === '1'
const remount = process.env.BH_NEXT_EDGE_REMOUNT === '1'
const conditionKeys = process.env.BH_NEXT_EDGE_CONDITIONS?.split(',')
if (conditionKeys) assert(conditionKeys.length === new Set(conditionKeys).size && conditionKeys.every(key => ['react-server', 'browser', 'import', 'require', 'node', 'style', 'default'].includes(key)) && conditionKeys.at(-1) === 'default')
assert(!remount || mixed || client, 'remount probe requires a Client consumer')
const browserNames = (process.env.BH_NEXT_BROWSERS || 'chromium,firefox,webkit').split(',')
assert(browserNames.every(name => ['chromium', 'firefox', 'webkit'].includes(name)))
const cases = {
  'postcss-added-composes': {
    a: '.direct{color:#123456}', b: '.shared{border-top:1px solid red}',
    postcss: true, addComposes: true, valid: true
  },
  'postcss-added-import': {
    a: '.direct{color:#123456;border-top:7px solid red}', b: '.shared{border-top:1px solid red}',
    postcss: true, addImport: true, inspectImport: true, valid: true
  },
  'postcss-added-nested-nonempty-composes': {
    a: '.direct{composes:shared from "./other.module.css";color:#123456}', b: '.shared{display:block}',
    postcss: true, addNestedComposes: true, valid: true
  },
  'postcss-themed-merged-composes': {
    a: '.direct{composes:shared from "./other.module.css";color:#123456}', b: '@theme{--color-unused:red}.shared{display:block}.sibling{display:block}',
    postcss: true, addNestedComposes: true, valid: true
  },
  'postcss-themed-comment-composes': {
    a: '.direct{composes:shared from "./other.module.css";color:#123456}', b: '@theme{--color-unused:red}/* audit-add */.shared{display:block}',
    postcss: true, addNestedComposes: true, requireComment: true, valid: true
  },
  'postcss-themed-spelling-composes': {
    a: '.direct{composes:shared from "./other.module.css";color:#123456}', b: '@theme{--color-unused:red}.shared{margin:0px 0px 0px 0px}',
    postcss: true, addNestedComposes: true, requireSpelling: true, valid: true
  },
  'postcss-added-nested-themed-empty-composes': {
    a: '.direct{composes:shared from "./other.module.css";color:#123456}', b: '@theme{--color-unused:red}.shared{}',
    postcss: true, addNestedComposes: true, valid: true
  },
  'postcss-added-nested-media-empty-composes': {
    a: '.direct{composes:shared from "./other.module.css";color:#123456}', b: '@media screen{.shared{}}',
    postcss: true, addNestedComposes: true, valid: true
  },
  'postcss-added-nested-composes': {
    a: '.direct{composes:shared from "./other.module.css";color:#123456}', b: '.shared{}',
    postcss: true, addNestedComposes: true, valid: true
  },
  'postcss-added-resource': {
    a: '.direct{color:#123456;border-top:7px solid red}', b: '.shared{border-top:7px solid red}',
    postcss: true, addResource: true, resourceFixture: true, valid: true
  },
  'postcss-child-global-resource': {
    a: '.direct{composes:shared from "./nested/other.module.css";color:#123456;background-image:var(--image-audit)}',
    b: '@theme{--image-audit:url("./new%20image.svg?rev=1#shape")}.shared{border-top:1px solid red}',
    file: 'nested/other.module.css', postcss: true, resourceFixture: true, resourceFile: 'nested/new image.svg', valid: true
  },
  'postcss-global-resource': {
    a: '@theme{--image-audit:url("./new.svg?rev=1#shape")}.direct{color:#123456;border-top:7px solid red;background-image:var(--image-audit)}',
    b: '.shared{border-top:7px solid red}', postcss: true, resourceFixture: true, valid: true
  },
  'postcss-added-global-reference': {
    a: '@theme{--image-audit:url("./new.svg?rev=1#shape")}.direct{color:#123456;border-top:7px solid red}',
    b: '.shared{border-top:7px solid red}', postcss: true, addGlobalReference: true, resourceFixture: true, valid: true
  },
  'postcss-global-context': {
    a: '@theme{--color-audit:#111111}.direct{@compose fg:audit;border-top:7px solid red}',
    b: '.shared{border-top:7px solid red}', postcss: true, globalContext: true, valid: true
  },
  'postcss-component-context': {
    a: '@theme{--color-audit:#111111}@components{brand{color:var(--color-audit)}}.direct{@compose brand;border-top:7px solid red}',
    b: '.shared{border-top:7px solid red}', postcss: true, globalContext: true, valid: true
  },
  'postcss-global-clone': {
    a: '@theme{--color-audit:#111111}.direct{@compose fg:audit;border-top:7px solid red}',
    b: '.shared{border-top:7px solid red}', postcss: true, globalContext: true, globalClone: true, valid: true
  },
  'postcss-generated-keyframe': {
    a: '.direct{color:#123456;border-top:7px solid red;animation:fade 1s linear infinite}',
    b: '.shared{border-top:7px solid red}', postcss: true, keyframeContext: true, expectedAnimation: 'fade', valid: true
  },
  'module-animation': {
    a: '.direct{color:#123456;border-top:7px solid red;animation:fade 1s linear infinite}',
    b: '.shared{border-top:7px solid red}', expectedAnimation: 'fade', valid: true
  },
  'postcss-imported-keyframe': {
    a: '.direct{composes:shared from "./other.module.css";color:#123456}',
    b: '.shared{border-top:7px solid red;animation:fade 1s linear infinite}',
    postcss: true, keyframeContext: true, expectedAnimation: 'fade', valid: true
  },
  'postcss-global-composes': {
    a: '@theme{--color-audit:#123456}.direct{@compose fg:audit;border-top:7px solid red}',
    b: '.shared{border-top:7px solid red}', postcss: true, valid: true
  },
  'postcss-export-composes': {
    a: '.original{color:#123456;border-top:7px solid red}',
    b: '.shared{border-top:7px solid red}', postcss: true, renameExports: true, valid: true
  },
  'postcss-root-composes': {
    a: '.direct{color:#123456;border-top:1px solid red}',
    b: '.shared{border-top:7px solid red}', postcss: true, valid: true
  },
  'postcss-generated-composes': {
    a: '.direct{@compose p:2rem;color:#123456;border-top:7px solid red}',
    b: '.shared{border-top:7px solid red}', postcss: true, generated: true, expectedPadding: '48px', valid: true
  },
  'postcss-local-generated-composes': {
    a: '.direct{@compose p:2rem;color:#123456;border-top:7px solid red}',
    b: '.shared{border-top:7px solid red}', postcss: true, generated: true, local: true, expectedPadding: '48px', valid: true
  },
  'postcss-composes': {
    a: '.direct{composes:shared from "./other.module.css";color:#123456}',
    b: '.shared{border-top:1px solid red}', postcss: true, valid: true
  },
  'postcss-inline-composes': {
    a: '.direct{composes:shared from "__AUDIT_INLINE_LOADER__?width=3!./other.module.css";color:#123456}',
    b: '.shared{border-top:1px solid red}', inline: true, postcss: true, valid: true
  },
  'inline-alias-composes': {
    a: '.direct{composes:shared from "audit-inline-loader?width=7!./other.module.css";color:#123456}',
    b: '.shared{border-top:1px solid red}', inline: true, inlineAlias: true, valid: true
  },
  'inline-nested-composes': {
    a: '.direct{composes:shared from "./nested/branch.module.css";color:#123456}',
    b: '.shared{border-top:1px solid red}', inline: true, nestedInline: true, valid: true
  },
  'inline-query-composes': {
    a: '.direct{composes:shared from "__AUDIT_INLINE_LOADER__?width=7!./other.module.css";color:#123456}',
    b: '.shared{border-top:1px solid red}', inline: true, valid: true
  },
  'inline-chain-composes': {
    a: '.direct{composes:shared from "__AUDIT_INLINE_LOADER__?width=7!__AUDIT_INLINE_LOADER__?width=3!./other.module.css";color:#123456}',
    b: '.shared{border-top:1px solid red}', inline: true, valid: true
  },
  'acyclic-composes': {
    a: '.direct{composes:shared from "./other.module.css";color:#123456}',
    b: '.shared{border-top:7px solid red}', valid: true
  },
  'encoded-composes': {
    a: '.direct{composes:shared from "./other%20module.module.css";color:#123456}',
    b: '.shared{border-top:7px solid red}', file: 'other module.module.css', valid: true
  },
  'literal-percent-composes': {
    a: '.direct{composes:shared from "./literal%2520name.module.css";color:#123456}',
    b: '.shared{border-top:7px solid red}', file: 'literal%20name.module.css', valid: true
  },
  'escaped-composes': {
    a: String.raw`.direct{composes:shared from "./other\20 module.module.css";color:#123456}`,
    b: '.shared{border-top:7px solid red}', file: 'other module.module.css', valid: true
  },
  'escaped-letter-composes': {
    a: String.raw`.direct{composes:shared from "./oth\65 r.module.css";color:#123456}`,
    b: '.shared{border-top:7px solid red}', valid: true
  },
  'raw-percent-composes': {
    a: '.direct{composes:shared from "./literal%20name.module.css";color:#123456}',
    b: '.shared{border-top:7px solid red}', file: 'literal%20name.module.css', valid: true
  },
  'package-conditions-composes': {
    a: '.direct{composes:shared from "@audit/css-edge";color:#123456}',
    b: '.shared{border-top:7px solid red}', package: true, conditions: true, valid: true
  },
  'query-composes': {
    a: '.direct{composes:shared from "./other.module.css?theme=dark";color:#123456}',
    b: '.shared{border-top:7px solid red}', valid: true
  },
  'fragment-composes': {
    a: '.direct{composes:shared from "./other.module.css#theme";color:#123456}',
    b: '.shared{border-top:7px solid red}', valid: true
  },
  'alias-composes': {
    a: '.direct{composes:shared from "audit-style";color:#123456}',
    b: '.shared{border-top:7px solid red}', alias: true, valid: true
  },
  'package-composes': {
    a: '.direct{composes:shared from "@audit/css-edge";color:#123456}',
    b: '.shared{border-top:7px solid red}', package: true, valid: true
  },
  'missing-composes': {
    a: '.direct{composes:missing from "./other.module.css";color:#123456}',
    b: '.shared{border-top:7px solid red}'
  },
  'independent-compose-cycle': {
    a: '.direct{composes:shared from "./other.module.css";color:#123456}.anchor{margin-left:11px}',
    b: '.shared{border-top:7px solid red}.dependent{composes:anchor from "./card.module.css";padding:13px}'
  },
  'recursive-composes': {
    a: '.direct{composes:shared from "./other.module.css";color:#123456}',
    b: '.shared{composes:direct from "./card.module.css";border-top:7px solid red}'
  },
  'icss-value-cycle': {
    a: ':import("./other.module.css"){tone:tone}:export{own:#654321}.direct{color:tone}',
    b: ':import("./card.module.css"){own:own}:export{tone:#123456}.shared{color:own}'
  },
  'missing-icss-value': {
    a: ':import("./other.module.css"){tone:missing}.direct{color:tone}',
    b: ':export{tone:#123456}.shared{border-top:7px solid red}'
  }
}
assert(cases[scenario], 'known edge scenario')
const parent = join(packageDir, 'e2e');mkdirSync(parent, { recursive: true })
const root = mkdtempSync(join(parent, 'bug-hunt-module-edge-'))
const report = { scenario, bundler, pure, client, mixed, remount, conditionKeys, passScope: conditionKeys ? 'appearance-only; condition ownership compared separately' : 'appearance and original server condition contract', packageDir, input: cases[scenario], build: null, observations: [], stylesheets: [], errors: [], browserFailures: [], requestedBrowsers: browserNames }
let server
try {
  mkdirSync(join(root, 'app'))
  writeFileSync(join(root, 'package.json'), '{"private":true,"type":"module"}')
  if (cases[scenario].postcss) {
    const plugin = join(root, 'audit-postcss.cjs')
    writeFileSync(plugin, `const fs=require('node:fs');const record=row=>fs.appendFileSync(${JSON.stringify(join(root, 'postcss.jsonl'))},JSON.stringify(row)+'\\n');module.exports=()=>({postcssPlugin:'audit-child-preparation',Once(root){record({event:'Once',file:root.source?.input.file,css:root.toString()});
const file=root.source?.input.file||'';
const isCard=${process.env.BH_NEXT_LOOSE_FILE_MATCH === '1' ? '/\\/card\\.module\\.css(\\.module\\.css)?$/.test(file)' : "file.endsWith('/card.module.css')"};
if(isCard){
 if(${Boolean(cases[scenario].addComposes)})root.walkRules(rule=>{if(rule.selector==='.direct')rule.prepend({prop:'composes',value:'shared from "./other.module.css"'})});
 if(${Boolean(cases[scenario].addImport)})root.prepend({name:'import',params:'"./other.module.css" layer(added) supports(display:grid) screen'});
 if(${Boolean(cases[scenario].addResource || cases[scenario].addGlobalReference)})root.walkRules(rule=>{if(rule.selector==='.direct')rule.append({prop:'background-image',value:${JSON.stringify(cases[scenario].addGlobalReference ? 'var(--image-audit)' : 'url("./new.svg?rev=1#shape")')}})});
}
let addNested=${Boolean(cases[scenario].addNestedComposes)};
if(${Boolean(cases[scenario].requireComment)}){addNested=false;root.walkComments(comment=>{if(comment.text==='audit-add')addNested=true})}
if(${Boolean(cases[scenario].requireSpelling)}){addNested=false;root.walkDecls('margin',decl=>{if(decl.value==='0px 0px 0px 0px')addNested=true})}
if(addNested&&${process.env.BH_NEXT_LOOSE_FILE_MATCH === '1' ? '/\\/other\\.module\\.css(\\.module\\.css)?$/.test(file)' : "file.endsWith('/other.module.css')"})root.walkRules(rule=>{if(rule.selector==='.shared')rule.prepend({prop:'composes',value:'leaf from "./nested/leaf.module.css"'})});

if(${Boolean(cases[scenario].globalContext || cases[scenario].keyframeContext)}){
 let local=false,global=false;root.walkRules(rule=>{if(rule.selector==='.direct')local=true;if(rule.selector===':root')global=true});
 if(${Boolean(cases[scenario].globalContext)}&&local&&global){
  const declarations=[];root.walkDecls('--color-audit',decl=>declarations.push(decl));for(const decl of declarations){if(${Boolean(cases[scenario].globalClone)}){const clone=decl.parent.clone();clone.walkDecls('--color-audit',value=>value.value='#123456');decl.parent.after(clone)}else decl.value='#123456'}
  record({event:'combined-global',file:root.source?.input.file,local,global});
 }
 if(${Boolean(cases[scenario].keyframeContext)}&&local){root.walkAtRules(/keyframes$/,rule=>{if(rule.params==='fade'){rule.walkDecls('opacity',decl=>{if(decl.value==='0')decl.value='0.25'});record({event:'combined-keyframe',file:root.source?.input.file,local,name:rule.params})}})}
}},Rule(rule){if(${Boolean(cases[scenario].renameExports)}&&rule.selector==='.original'){rule.selector='.direct';record({event:'rename',file:rule.source?.input.file,before:'.original',after:'.direct'})}},Declaration(decl){if(!['border-top','padding'].includes(decl.prop))return;const before=decl.value;decl.value=decl.prop==='padding'?decl.value.replace(/^2rem$/,'3rem'):decl.value.replace(/^[13]px/,'7px');record({file:decl.source?.input.file,property:decl.prop,before,after:decl.value})}});module.exports.postcss=true;`)
    new Script(readFileSync(plugin, 'utf8'), { filename: plugin })
    writeFileSync(join(root, 'postcss.config.cjs'), `module.exports={plugins:{${JSON.stringify(plugin)}:{}}}`)
  }
  const config = { output: 'export', experimental: { cpus: 1 }, turbopack: { root: '/Users/aron/master/css' } }
  if (process.env.BH_NEXT_EDGE_MAPS === '1') config.productionBrowserSourceMaps = true
  writeFileSync(join(root, 'next.config.mjs'), pure ? `export default ${JSON.stringify(config)}` : `import {withMasterCSS} from ${JSON.stringify(relative(root, join(packageDir, 'dist/index.js')))};export default await withMasterCSS(${JSON.stringify(config)},{mode:'runtime',runtime:false})`)
  if (cases[scenario].alias) {
    const file = join(root, 'next.config.mjs')
    const original = readFileSync(file, 'utf8').replace('export default ', 'const config = ')
    writeFileSync(file, original + `;
const previous = config.webpack;
config.webpack = (...args) => {const value = previous ? previous(...args) : args[0];value.resolve.alias['audit-style'] = ${JSON.stringify(join(root, 'app/other.module.css'))};return value};
config.turbopack = {...config.turbopack,resolveAlias:{...config.turbopack?.resolveAlias,'audit-style':'./app/other.module.css'}};
export default config;`)
  }
  if (cases[scenario].package) {
    const packageRoot = join(root, 'node_modules/@audit/css-edge');mkdirSync(packageRoot, { recursive: true })
    const conditions = conditionKeys || (cases[scenario].conditions ? ['react-server','browser','import','require','node','style','default'] : ['style','default'])
    writeFileSync(join(packageRoot, 'package.json'), JSON.stringify({name:'@audit/css-edge',type:'module',exports:{'.':Object.fromEntries(conditions.map(name => [name, './' + name + '.module.css']))}}))
    for (const name of conditions) writeFileSync(join(packageRoot, name + '.module.css'), '.shared{border-top:7px solid red;--origin:' + name + '}')
  }
  if (cases[scenario].inlineAlias) {
    const file = join(root, 'next.config.mjs'), original = readFileSync(file, 'utf8').replace('export default ', 'const inlineConfig = ')
    writeFileSync(file, original + `;const previous = inlineConfig.webpack;inlineConfig.webpack = (...args) => {const config = previous ? previous(...args) : args[0];config.resolveLoader = {...config.resolveLoader,alias:{...config.resolveLoader?.alias,'audit-inline-loader':${JSON.stringify(join(root, 'transform-loader.cjs'))}}};return config};export default inlineConfig;`)
  }
  if (process.env.BH_NEXT_CONTEXT_TRACE === '1') {
    const traceLoader = join(root, 'trace-loader.cjs'), traceFile = join(root, 'loader-context.jsonl')
    writeFileSync(traceLoader, `const fs=require('node:fs');module.exports=function(source,map){const done=this.async();const row={keys:Object.keys(this),ruleTag:this.getOptions()?.contextTag,moduleKeys:Object.keys(this._module||{}),moduleLayer:this._module?.layer,moduleType:this._module?.type,resourcePath:this.resourcePath,resourceQuery:this.resourceQuery,target:this.target,mode:this.mode,version:this.version,rootContext:this.rootContext,resolutions:{}};const run=async()=>{for(const [name,options] of Object.entries({defaults:{},reactServer:{conditionNames:['react-server']},browser:{conditionNames:['browser']},import:{conditionNames:['import']}})){try{row.resolutions[name]=await this.getResolve(options)(this.context,'@audit/css-edge')}catch(error){row.resolutions[name]=String(error)}}fs.appendFileSync(${JSON.stringify(traceFile)},JSON.stringify(row)+'\\n');done(null,source,map)};run().catch(done)};`)
    const file = join(root, 'next.config.mjs'), original = readFileSync(file, 'utf8').replace('export default ', 'const tracedConfig = ')
    writeFileSync(file, original + `;
for(const [glob,collection] of Object.entries(tracedConfig.turbopack.rules||{})){
const rules=Array.isArray(collection)?collection:[collection];
tracedConfig.turbopack.rules[glob]=rules.flatMap(rule=>{
if(!rule.loaders?.some(item=>typeof item==='object'&&item.loader.endsWith('/stylesheet-loader.js')))return [rule];
if(!${JSON.stringify(process.env.BH_NEXT_RULE_TRACE === '1')})return [{...rule,loaders:[...rule.loaders,{loader:${JSON.stringify(traceLoader)}}]}];
const contexts=[['browser','browser'],['node',{all:[{not:'browser'},'node']}],['edge',{all:[{not:'browser'},{not:'node'},'edge-light']}],['other',{all:[{not:'browser'},{not:'node'},{not:'edge-light'}]}]];
return contexts.map(([contextTag,condition])=>({...rule,condition:{all:[rule.condition||{path:/.*/},condition]},loaders:[...rule.loaders,{loader:${JSON.stringify(traceLoader)},options:{contextTag}}]}));
});
}
export default tracedConfig;`)
  }
  writeFileSync(join(root, 'app/layout.jsx'), 'export default function Layout({children}){return <html><body>{children}</body></html>}')
  if (cases[scenario].local) {
    writeFileSync(join(root, 'app/globals.css'), (pure ? '' : '@master entry;@preserve native;') + '.placeholder{display:block}')
    writeFileSync(join(root, 'app/layout.jsx'), 'import "./globals.css";export default function Layout({children}){return <html><body>{children}</body></html>}')
  }
  writeFileSync(join(root, 'app/page.jsx'), (client ? '"use client";' : '') + 'import styles from "./card.module.css";export default function Page(){return <div id="probe" className={styles.direct}>Probe</div>}')
  if (remount && client) writeFileSync(join(root, 'app/page.jsx'), '"use client";import {useState} from "react";import styles from "./card.module.css";export default function Page(){const [revision,setRevision]=useState(0);return <><button id="remount" onClick={()=>setRevision(value=>value+1)}>Remount</button><div key={revision} data-revision={revision} id="probe" className={styles.direct}>Client</div></>}')
  if (mixed) {
    writeFileSync(join(root, 'app/client.jsx'), '"use client";import styles from "./card.module.css";export default function Client(){return <div id="client-probe" className={styles.direct}>Client</div>}')
    if (remount) writeFileSync(join(root, 'app/client.jsx'), '"use client";import {useState} from "react";import styles from "./card.module.css";export default function Client(){const [revision,setRevision]=useState(0);return <><button id="remount" onClick={()=>setRevision(value=>value+1)}>Remount</button><div key={revision} data-revision={revision} id="client-probe" className={styles.direct}>Client</div></>}')
    writeFileSync(join(root, 'app/page.jsx'), 'import styles from "./card.module.css";import Client from "./client";export default function Page(){return <><div id="probe" className={styles.direct}>Server</div><Client/></>}')
  }
  if (cases[scenario].inline) {
    const postcssPath = createRequire(requireNext.resolve('next/package.json')).resolve('postcss')
    writeFileSync(join(root, 'transform-loader.cjs'), `const fs=require('node:fs');module.exports=function(source,map){
const width=this.getOptions().width;
const record=output=>fs.appendFileSync(${JSON.stringify(join(root, 'inline-loader.jsonl'))},JSON.stringify({resource:this.resourcePath,query:this.resourceQuery,options:this.getOptions(),input:source,output,mapped:${process.env.BH_NEXT_INLINE_MAP === '1'}})+'\\n');
if(${process.env.BH_NEXT_INLINE_MAP === '1'}){
 const done=this.async(),postcss=require(${JSON.stringify(postcssPath)});
 postcss([{postcssPlugin:'audit-inline-map',Declaration(decl){if(decl.prop==='border-top')decl.value=decl.value.replace(/^\\d+px/,width+'px')}}]).process(source,{from:this.resourcePath,to:this.resourcePath,map:{prev:map||false,inline:false,annotation:false,sourcesContent:true}}).then(result=>{record(result.css);done(null,result.css,result.map.toJSON())},done);
 return;
}
const output=source.replace(/border-top:\\d+px/g,'border-top:'+width+'px');record(output);this.callback(null,output,map);
};`)
  }
  let moduleSource = cases[scenario].a.replaceAll('__AUDIT_INLINE_LOADER__', join(root, 'transform-loader.cjs'))
  if (pure && cases[scenario].generated) moduleSource = moduleSource.replace('@compose p:2rem;', 'padding:2rem;')
  writeFileSync(join(root, 'app/card.module.css'), (pure || cases[scenario].local ? '' : '@master entry;@preserve native;') + moduleSource)
  mkdirSync(dirname(join(root, 'app', cases[scenario].file || 'other.module.css')), { recursive: true })
  writeFileSync(join(root, 'app', cases[scenario].file || 'other.module.css'), cases[scenario].b)
  if (cases[scenario].nestedInline) {
    mkdirSync(join(root, 'app/nested'))
    writeFileSync(join(root, 'app/nested/branch.module.css'), '.shared{composes:shared from "../../transform-loader.cjs?width=7!./other.module.css"}')
    writeFileSync(join(root, 'app/nested/other.module.css'), cases[scenario].b)
  }
  if (cases[scenario].addNestedComposes) {
    mkdirSync(join(root, 'app/nested'), { recursive: true })
    writeFileSync(join(root, 'app/nested/leaf.module.css'), '.leaf{border-top:1px solid red}')
  }
  if (cases[scenario].resourceFixture) writeFileSync(join(root, 'app', cases[scenario].resourceFile || 'new.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect id="shape" width="2" height="2" fill="red"/></svg>')
  report.authoredStylesheets = []
  function collectAuthored(directory) {
    for (const name of readdirSync(directory)) {
      const file = join(directory, name)
      if (statSync(file).isDirectory()) collectAuthored(file)
      else if (/\.(css|scss|sass)$/.test(name)) report.authoredStylesheets.push({ file: relative(root, file), text: readFileSync(file, 'utf8') })
    }
  }
  collectAuthored(join(root, 'app'))
  const child = spawn(process.execPath, [requireNext.resolve('next/dist/bin/next'), 'build', ...(bundler === 'webpack' ? ['--webpack'] : [])], { cwd: root, env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = '', timedOut = false
  for (const stream of [child.stdout, child.stderr]) stream.on('data', bytes => { output += bytes; process.stdout.write(bytes) })
  const timeout = setTimeout(() => { timedOut = true; child.kill('SIGTERM') }, 120000)
  const [code, signal] = await once(child, 'exit');clearTimeout(timeout)
  report.build = { code, signal, timedOut, exported: existsSync(join(root, 'out/index.html')), log: output }
  if (code === 0 && report.build.exported) {
    const out = join(root, 'out')
    report.exportedProbeTags = readFileSync(join(out, 'index.html'), 'utf8').match(/<div\b[^>]*\bid="(?:client-)?probe"[^>]*>/g)
    function collect(dir) {
      for (const name of readdirSync(dir)) {
        const file = join(dir, name)
        if (statSync(file).isDirectory()) collect(file)
        else if (/\.css(?:\.map)?$/.test(name)) report.stylesheets.push({ file: relative(out, file), text: readFileSync(file, 'utf8') })
      }
    }
    collect(out)
    report.requests = []
    server = createServer((req, res) => {
      const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
      const file = resolve(out, '.' + (path === '/' ? '/index.html' : path))
      if (!file.startsWith(out + '/') || !existsSync(file) || !statSync(file).isFile()) { report.requests.push({ url: req.url, status: 404 });res.writeHead(404);res.end();return }
      report.requests.push({ url: req.url, status: 200 })
      res.setHeader('content-type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' })[extname(file)] || 'application/octet-stream')
      res.end(readFileSync(file))
    })
    server.listen(0, '127.0.0.1');await once(server, 'listening')
    for (const name of browserNames) {
      let browser
      try {
        browser = await browsers[name].launch({ headless: true, timeout: 15000 })
        const page = await browser.newPage()
        page.on('pageerror', error => report.errors.push({ browser: name, message: String(error) }))
        page.on('console', message => { if (message.type() === 'error') report.errors.push({ browser: name, console: message.text() }) })
        await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'networkidle' })
        if (cases[scenario].inspectImport) {
          const importedCSS = report.stylesheets.find(item => item.file.endsWith('.css') && item.text.includes('.other_shared__'))
          const selector = importedCSS?.text.match(/\.(other_shared__[\w-]+)/)?.[1]
          const border = selector ? await page.evaluate(selector => { const el = document.createElement('div');el.className = selector;document.body.append(el);return getComputedStyle(el).borderTopWidth }, selector) : null
          ;(report.importObservations ??= []).push({ browser: name, selector, border, pass: border === '7px' })
        }
        for (const phase of remount ? ['initial', 'remounted'] : ['initial']) {
        if (phase === 'remounted') {
          await page.locator('#remount').click()
          await page.waitForFunction(id => document.querySelector('#' + id)?.getAttribute('data-revision') === '1', mixed ? 'client-probe' : 'probe')
        }
        for (const id of mixed ? ['probe', 'client-probe'] : ['probe']) {
        const observation = await page.locator('#' + id).evaluate(el => {
          const style = getComputedStyle(el)
          const matchingRules = []
          function visit(rules) {
            for (const rule of rules) {
              if (rule.selectorText && el.matches(rule.selectorText)) matchingRules.push({ selector: rule.selectorText, declarations: rule.style.cssText })
              if (rule.cssRules) visit(rule.cssRules)
            }
          }
          for (const sheet of document.styleSheets) visit(sheet.cssRules)
          return { classes: el.className, color: style.color, border: style.borderTopWidth, margin: style.marginLeft, padding: style.paddingTop, origin: style.getPropertyValue('--origin').trim(), background: style.backgroundImage, animation: style.animationName, animationFrames: el.getAnimations().flatMap(animation => animation.effect?.getKeyframes?.() ?? []), matchingRules }
        })
        report.observations.push({ browser: name, id, phase, ...observation, ...(cases[scenario].valid ? { pass: observation.color === 'rgb(18, 52, 86)' && observation.border === '7px' && (!cases[scenario].expectedPadding || observation.padding === cases[scenario].expectedPadding) && (!cases[scenario].expectedAnimation || (observation.animation === cases[scenario].expectedAnimation && observation.animationFrames.some(frame => frame.opacity === '0.25'))) && (!cases[scenario].resourceFixture || (/^url\("?https?:/.test(observation.background) && observation.background.includes('?rev=1#shape') && report.requests.some(request => request.status === 200 && request.url.includes('.svg?rev=1')))) && (!cases[scenario].inspectImport || report.importObservations.at(-1).pass) && !observation.classes.includes('undefined') && (conditionKeys || !cases[scenario].package || client || id === 'client-probe' || observation.origin === (bundler === 'webpack' ? 'style' : cases[scenario].conditions ? 'react-server' : 'default')) ? true : false } : {}) })
        }
        }
      } catch (error) { report.browserFailures.push({ browser: name, error: String(error.stack || error) }) } finally { if (browser) await browser.close() }
    }
  }
} catch (error) {
  report.harnessError = String(error.stack || error)
  process.exitCode = 1
} finally {
  if (server) await new Promise(done => server.close(done))
  const traceFile = join(root, 'loader-context.jsonl')
  if (existsSync(traceFile)) report.loaderContexts = readFileSync(traceFile, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line))
  const inlineTrace = join(root, 'inline-loader.jsonl')
  if (existsSync(inlineTrace)) report.inlineLoaderCalls = readFileSync(inlineTrace, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line))
  const postcssTrace = join(root, 'postcss.jsonl')
  if (existsSync(postcssTrace)) report.postcssCalls = readFileSync(postcssTrace, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line))
  writeFileSync(evidence, JSON.stringify(report, null, 2) + '\n')
  rmSync(root, { recursive: true, force: true })
}
console.log(JSON.stringify({ scenario, bundler, pure, build: report.build && { ...report.build, log: undefined }, observations: report.observations, harnessError: report.harnessError }))
