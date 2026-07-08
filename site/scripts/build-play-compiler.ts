import { mkdir, rm, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build, type TsdownPlugin } from 'tsdown'

const siteDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const workspaceDistInputPattern = /(?:^|[\\/])packages[\\/][^\\/]+[\\/]dist[\\/]/

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

  await rm(outputDir, { recursive: true, force: true })
  await mkdir(outputDir, { recursive: true })

  await build({
    cwd: siteDir,
    entry: {
      compiler: fileURLToPath(new URL('../play-compiler/compile-play-css.ts', import.meta.url))
    },
    outDir: outputDir,
    platform: 'browser',
    target: 'es2022',
    tsconfig: './tsconfig.json',
    deps: {
      alwaysBundle: [/^[^./]/],
      neverBundle: ['fs']
    },
    inputOptions: {
      resolve: {
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

  const { size: compilerSize } = await stat(compilerOutputPath)

  console.log(`Built Play compiler at ${outputDir}: compiler.js ${(compilerSize / 1024).toFixed(1)} KiB`)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const outdirIndex = process.argv.indexOf('--outdir')
  await buildPlayCompiler(outdirIndex === -1 ? undefined : process.argv[outdirIndex + 1])
}
