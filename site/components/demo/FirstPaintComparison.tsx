import DemoStyleComparison from './DemoStyleComparison'
import { firstPaintCSS, firstPaintHTML } from '../../utils/first-paint-examples'

export default function FirstPaintComparison() {
  return <div data-first-paint="comparison"><DemoStyleComparison html={firstPaintHTML} css={firstPaintCSS()} /></div>
}
