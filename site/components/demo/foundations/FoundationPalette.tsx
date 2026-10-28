import { paletteKeys } from '../../../common/foundation-data/tokens'
import FoundationTokensView from './FoundationTokensView'

/** The full palette is the comparison: keep it beside the color lesson. */
export default function FoundationPalette() {
  return <FoundationTokensView namespace="color" keys={paletteKeys} presentation="guide" />
}
