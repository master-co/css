/** Tool and package boundaries shared by rendered figures and portable Reference text. */
export const toolIllustrations = {
  'preview-file-identity': {
    title: 'A preview applies only to the file version it recorded',
    alt: 'One preview records p-md flex. An unchanged file accepts the proposed flex p-md order; a file edited to add gap-sm is rejected and retains that new content.',
    caption: 'Both cases start from the same class-order preview. Applying it requires an unexpired token in the same server and matching original files. A changed file is rejected before any proposed file is written.',
    labels: { preview: 'Recorded by the preview', original: 'p-md flex', proposal: 'Proposed: flex p-md', left: 'File still matches', right: 'File changed after preview', changed: 'p-md flex gap-sm', apply: 'Apply the recorded diff', reject: 'Reject before writing', applied: 'flex p-md', kept: 'p-md flex gap-sm', leftEnd: 'Token consumed', rightEnd: 'Current content preserved', scope: 'Same server · unexpired token · valid workspace paths' },
    description: [
      'A class-order preview records the original p-md flex and proposes flex p-md. Previewing leaves the source file unchanged.',
      'If every affected file still matches its recorded hash, applying the valid token writes the proposed contents and consumes the token.',
      'If a file now contains p-md flex gap-sm, its hash no longer matches. Apply rejects the preview before writing any proposed file, preserving the newer content.',
      'This comparison isolates file identity. Token expiry, server restarts and invalid workspace paths can also prevent application. Sequential writes are not a transactional rollback mechanism.'
    ]
  },
  'cli-output-destinations': {
    title: 'Printed CSS and published assets have different delivery boundaries',
    alt: 'The generate command branches to stdout with no-export, or to a CSS entry and required stylesheet and resource files with output. Only the file-export branch publishes the asset set.',
    caption: 'Both commands read project sources. --no-export prints CSS; --output publishes the entry and its required assets. Deliver the complete file set when imports or resources remain separate.',
    labels: { source: 'Project sources', command: 'master-css generate', stdout: '--no-export --verbose 0', files: '--output dist/app.css', stream: 'stdout', css: 'CSS text', noFiles: 'No asset files published', directory: 'dist/', entry: 'app.css', styles: 'Required CSS assets', resources: 'Required images and fonts', publish: 'Publish together', scope: 'A CSS string does not copy its referenced images, fonts or imported files.' },
    description: [
      'master-css generate reads the selected project sources and stylesheet entries in either case.',
      '--no-export --verbose 0 sends the CSS result to stdout without publishing output files. The caller remains responsible for referenced resources and their URL bases.',
      '--output dist/app.css publishes the named entry and any separate stylesheet or resource assets required by its import graph.',
      'The file group is an asset set, not a promise that every project produces additional files. When such files are produced, deploy them together with the entry.'
    ]
  },
  'compiler-output-ownership': {
    title: 'A compiled manifest does not contain the delivered native stylesheet',
    alt: 'Compiling app.css produces native CSS separately from a manifest. A Node render session uses the manifest and bg-brand to generate a utility rule; the native .card rule stays in the compiler CSS output.',
    caption: 'The compiler returns native CSS and definitions separately. A Node render session turns the supplied class into utility CSS; it does not redeliver the compiler’s native .card rule.',
    labels: { source: 'app.css', token: '@theme { --color-brand: #4f46e5; }', native: '.card { color: var(--color-brand); }', compile: 'compileManifestSync()', css: 'result.css', card: '.card { … }', manifest: 'result.manifest', definition: 'Token and utility definitions', render: 'createRenderSessionSync()', input: 'ensureClassRules(["bg-brand"])', generated: 'Generated utility CSS', rule: '.bg-brand { … }', scope: 'Deliver native CSS as well as generated CSS; neither artifact replaces the other.' },
    description: [
      'app.css contains a theme token and a native .card rule. compileManifestSync from @master/css-compiler/node compiles it with an explicit base manifest.',
      'result.css carries the native rule. result.manifest carries the definitions used for later class generation.',
      'A Node createRenderSessionSync from @master/css/node accepts that manifest. Ensuring bg-brand generates its background-color rule and required token resources.',
      'The application must deliver the native CSS as well as generated CSS and coordinate shared resource ownership. Browser engines use compiled runtime programs instead of this Node manifest path.'
    ]
  }
} as const
