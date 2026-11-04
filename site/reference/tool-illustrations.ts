import { referenceText as text } from './copy'
/** Tool and package boundaries shared by rendered figures and portable Reference text. */
export const toolIllustrations = {
  'preview-file-identity': {
    title: text("illustrations/preview-file-identity", "title"),
    alt: text("illustrations/preview-file-identity", "alt"),
    caption: text("illustrations/preview-file-identity", "caption"),
    labels: { preview: 'Recorded by the preview', original: 'p-md flex', proposal: 'Proposed: flex p-md', left: 'File still matches', right: 'File changed after preview', changed: 'p-md flex gap-sm', apply: 'Apply the recorded diff', reject: 'Reject before writing', applied: 'flex p-md', kept: 'p-md flex gap-sm', leftEnd: 'Token consumed', rightEnd: 'Current content preserved', scope: 'Same server · unexpired token · valid workspace paths' },
    description: [
      text("illustrations/preview-file-identity", "description-0"),
      text("illustrations/preview-file-identity", "description-1"),
      text("illustrations/preview-file-identity", "description-2"),
      text("illustrations/preview-file-identity", "description-3")
    ]
  },
  'cli-output-destinations': {
    title: text("illustrations/cli-output-destinations", "title"),
    alt: text("illustrations/cli-output-destinations", "alt"),
    caption: text("illustrations/cli-output-destinations", "caption"),
    labels: { source: 'Project sources', command: 'master-css generate', stdout: '--no-export --verbose 0', files: '--output dist/app.css', stream: 'stdout', css: 'CSS text', noFiles: 'No asset files published', directory: 'dist/', entry: 'app.css', styles: 'Required CSS assets', resources: 'Required images and fonts', publish: 'Publish together', scope: 'A CSS string does not copy its referenced images, fonts or imported files.' },
    description: [
      text("illustrations/cli-output-destinations", "description-0"),
      text("illustrations/cli-output-destinations", "description-1"),
      text("illustrations/cli-output-destinations", "description-2"),
      text("illustrations/cli-output-destinations", "description-3")
    ]
  },
  'compiler-output-ownership': {
    title: text("illustrations/compiler-output-ownership", "title"),
    alt: text("illustrations/compiler-output-ownership", "alt"),
    caption: text("illustrations/compiler-output-ownership", "caption"),
    labels: { source: 'app.css', token: '@theme { --color-brand: #4f46e5; }', native: '.card { color: var(--color-brand); }', compile: 'compileManifestSync()', css: 'result.css', card: '.card { … }', manifest: 'result.manifest', definition: 'Token and utility definitions', render: 'createRenderSessionSync()', input: 'ensureClassRules(["bg-brand"])', generated: 'Generated utility CSS', rule: '.bg-brand { … }', scope: 'Deliver native CSS as well as generated CSS; neither artifact replaces the other.' },
    description: [
      text("illustrations/compiler-output-ownership", "description-0"),
      text("illustrations/compiler-output-ownership", "description-1"),
      text("illustrations/compiler-output-ownership", "description-2"),
      text("illustrations/compiler-output-ownership", "description-3")
    ]
  }
} as const
