import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build, type TsdownPlugin } from 'tsdown'

const siteDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const workspaceDistInputPattern = /(?:^|[\\/])packages[\\/][^\\/]+[\\/]dist[\\/]/
const compilerWasmFileName = 'mastercss_binding_wasm_compiler_bg.wasm'
const compilerWasmSourcePath = fileURLToPath(new URL(`../../packages/binding-wasm-compiler/artifacts/${compilerWasmFileName}`, import.meta.url))
const bindingSourcePath = fileURLToPath(new URL('../../packages/binding/src/browser.ts', import.meta.url))
const compilerBindingSourcePath = fileURLToPath(new URL('../../packages/binding/src/compiler-binding-browser.ts', import.meta.url))
const engineBindingSourcePath = fileURLToPath(new URL('../../packages/binding/src/engine-binding-browser.ts', import.meta.url))

function toWorkspaceDistInputs(moduleIds: string[]) {
  return [...new Set(moduleIds.filter((input) => workspaceDistInputPattern.test(input)))]
}

function assertNoWorkspaceDistInputs(moduleIds: string[]) {
  const distInputs = toWorkspaceDistInputs(moduleIds)
  if (!distInputs.length) return

  throw new Error([
    'Play compiler bundle resolved workspace dist files. Build the workspace package from source instead:',
    ...distInputs.map((input) => `- ${input}`)
  ].join('\n'))
}

function assertNoWorkspaceDistInputsPlugin(): TsdownPlugin {
  return {
    name: 'assert-no-workspace-dist-inputs',
    generateBundle(_, bundle) {
      const moduleIds = Object.values(bundle).flatMap((output) => output.type === 'chunk' ? output.moduleIds : [])
      assertNoWorkspaceDistInputs(moduleIds)
    }
  }
}

export async function buildPlayCompiler(outputDir = join(siteDir, 'public/play-compiler')) {
  const compilerOutputPath = join(outputDir, 'compiler.js')
  const compilerWasmOutputPath = join(outputDir, compilerWasmFileName)
  const temporaryDir = await mkdtemp(join(tmpdir(), 'mastercss-play-'))
  try {
    await build({
      cwd: siteDir,
      entry: {
        compiler: fileURLToPath(new URL('../play-compiler/compile-play-css.ts', import.meta.url))
      },
      outDir: temporaryDir,
      platform: 'browser',
      target: 'es2022',
      tsconfig: './tsconfig.json',
      deps: {
        alwaysBundle: [/^[^./]/],
        neverBundle: ['fs']
      },
      inputOptions: {
        resolve: {
          alias: {
            '@master/css-binding/compiler': compilerBindingSourcePath,
            '@master/css-binding/engine': engineBindingSourcePath,
            '@master/css-binding': bindingSourcePath
          },
          conditionNames: ['browser', 'default', 'import']
        }
      },
      loader: {
        '.json': 'json'
      },
      minify: true,
      dts: false,
      logLevel: 'silent',
      report: false,
      plugins: [
        assertNoWorkspaceDistInputsPlugin()
      ],
      outputOptions: {
        entryFileNames: 'compiler.js',
        codeSplitting: false,
        comments: false
      }
    })
    await copyFile(compilerWasmSourcePath, join(temporaryDir, compilerWasmFileName))
    await mkdir(outputDir, { recursive: true })
    const generated = await readdir(temporaryDir)
    for (const name of generated) {
      const source = await readFile(join(temporaryDir, name))
      const target = join(outputDir, name)
      const previous = await readFile(target).catch((error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') return undefined
        throw error
      })
      if (!previous?.equals(source)) await writeFile(target, source)
    }
    for (const name of await readdir(outputDir)) {
      if (!generated.includes(name)) await rm(join(outputDir, name), { recursive: true, force: true })
    }
  } finally {
    await rm(temporaryDir, { recursive: true, force: true })
  }

  const { size: compilerSize } = await stat(compilerOutputPath)
  const { size: compilerWasmSize } = await stat(compilerWasmOutputPath)

  console.log([
    `Built Play compiler at ${outputDir}:`,
    `compiler.js ${(compilerSize / 1024).toFixed(1)} KiB,`,
    `${compilerWasmFileName} ${(compilerWasmSize / 1024 / 1024).toFixed(1)} MiB`
  ].join(' '))
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const outdirIndex = process.argv.indexOf('--outdir')
  await buildPlayCompiler(outdirIndex === -1 ? undefined : process.argv[outdirIndex + 1])
}
