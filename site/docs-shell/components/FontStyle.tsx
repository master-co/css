/* eslint-disable react/no-unknown-property */
import fontCSS from '../../.generated/raw/fonts.css.txt' with { turbopackLoader: 'raw-loader', turbopackAs: '*.js' }

export default ({ locale }: any) => <>
  <link blocking="render" rel="preload" as="font" href="/fonts/GeistVariable.woff2" crossOrigin='anonymous' />
  <link blocking="render" rel="preload" as="font" href="/fonts/IBMPlexMono-Regular.woff2" crossOrigin='anonymous' />
  {locale === 'tw' && <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@100..900&display=swap" rel="stylesheet" />}
  <style blocking="render" dangerouslySetInnerHTML={{ __html: fontCSS }}></style>
</>
