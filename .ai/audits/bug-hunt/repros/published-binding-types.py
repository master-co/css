from pathlib import Path
import tempfile,shutil,json,subprocess,hashlib,sys
repo=Path(__file__).resolve().parents[4];e=Path(sys.argv[1]).resolve();e.mkdir(parents=True,exist_ok=False);root=Path(tempfile.mkdtemp(prefix='master-0201-declarations-'));results={};sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
# Builds only in owned temporary copies; requires a new output directory.
# Usage: python3 published-binding-types.py /tmp/new-result-directory
try:
 for mode in ['baseline','candidate']:
  work=root/mode;pkg=work/'packages/binding';pkg.mkdir(parents=True);shutil.copytree(repo/'packages/binding/src',pkg/'src')
  for f in (repo/'packages/binding').glob('*.json'):shutil.copy2(f,pkg/f.name)
  shutil.copy2(repo/'tsconfig.json',work/'tsconfig.json');(work/'node_modules').symlink_to(repo/'node_modules',target_is_directory=True);(pkg/'node_modules').symlink_to(repo/'packages/binding/node_modules',target_is_directory=True)
  shared=work/'shared';shared.mkdir();config=(repo/'shared/tsdown-package.config.ts').read_text()
  if mode=='baseline':
   config=(repo/'.ai/audits/bug-hunt/evidence/0201-build-config-before.ts.txt').read_text()
  (shared/'tsdown-package.config.ts').write_text(config)
  with (e/f'0201-{mode}-default-build.log').open('w') as out:r=subprocess.run(['node',str(repo/'scripts/with-typescript-tooling-compat.mjs'),'node',str(repo/'node_modules/tsdown/dist/run.mjs'),'--config','../../shared/tsdown-package.config.ts'],cwd=pkg,stdout=out,stderr=subprocess.STDOUT)
  rec={'buildExitCode':r.returncode,'configSha256':sha(shared/'tsdown-package.config.ts'),'sourcesExact':all(sha(f)==sha(pkg/'src'/f.relative_to(repo/'packages/binding/src')) for f in (repo/'packages/binding/src').rglob('*') if f.is_file())};results[mode]=rec
  if r.returncode:continue
  consumer=work/'consumer';modules=consumer/'node_modules/@master';modules.mkdir(parents=True);dest=modules/'css-binding';dest.mkdir();shutil.copy2(pkg/'package.json',dest/'package.json');shutil.copytree(pkg/'dist',dest/'dist')
  for dep in ['css-schema','css-binding-wasm-engine','css-binding-wasm-compiler','css-binding-wasm-tooling']:(modules/dep).symlink_to(repo/'packages'/dep.removeprefix('css-'),target_is_directory=True)
  (consumer/'node_modules/@types').symlink_to(repo/'node_modules/@types',target_is_directory=True);(consumer/'package.json').write_text('{"type":"module"}\n')
  imports=['@master/css-binding','@master/css-binding/compiler','@master/css-binding/compiler/node','@master/css-binding/engine','@master/css-binding/engine/node','@master/css-binding/tooling','@master/css-binding/tooling/node']
  (consumer/'consumer.ts').write_text('\n'.join(f'import * as surface{i} from "{name}"; void surface{i};' for i,name in enumerate(imports))+'\n');(consumer/'tsconfig.json').write_text(json.dumps({'compilerOptions':{'module':'NodeNext','moduleResolution':'NodeNext','target':'ES2024','strict':True,'skipLibCheck':False,'noEmit':True,'types':['node']},'files':['consumer.ts']}))
  if mode=='candidate':
   with (consumer/'consumer.ts').open('a') as out:
    out.write('const compiler=surface2.createCompilerBindingSessionSync();\ncompiler.inspectCSS(\"@master entry;\");\n// @ts-expect-error CSS must be a string\ncompiler.inspectCSS(42);\n// @ts-expect-error Unknown binding choice\nsurface2.createCompilerBindingSessionSync({binding: \"invalid\"});\n')
  with (e/f'0201-{mode}-consumer-types.log').open('w') as out:r=subprocess.run(['node',str(repo/'node_modules/typescript6/lib/tsc.js'),'-p',str(consumer/'tsconfig.json')],cwd=consumer,stdout=out,stderr=subprocess.STDOUT)
  rec.update(consumerExitCode=r.returncode,entrypoints=imports,files={str(f.relative_to(pkg/'dist')):sha(f) for f in (pkg/'dist').rglob('*') if f.is_file()})
finally:
 (e/'0201-default-build-controls.json').write_text(json.dumps({'root':str(root),'results':results,'scope':'Defaultdist outputs indisposablepackages;source/roottsconfig exact;installeddependencies reused;consumer has no workspacealiases','rootBuildFlowChanged':False},indent=2)+'\n')
print({k:{a:b for a,b in v.items() if a!='files'} for k,v in results.items()})

assert results['baseline']['buildExitCode']==0 and results['baseline']['consumerExitCode']!=0
assert results['candidate']['buildExitCode']==0 and results['candidate']['consumerExitCode']==0
assert all(results['candidate']['files'][f]==v for f,v in results['baseline']['files'].items() if f.endswith('.js'))
