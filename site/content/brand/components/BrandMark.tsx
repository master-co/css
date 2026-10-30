/** Keep the approved background variants together, including without JavaScript. */
export default function BrandMark({ width = 216.6, height = 120, alt = 'Master CSS gold mark', small = false, style }: {
  width?: number
  height?: number
  alt?: string
  small?: boolean
  style?: React.CSSProperties
}) {
  const variant = small ? 'small-' : ''
  return <>
    <img className="brand-logo-light" src={`/brand/v2/logo/mark/master-mark-${variant}on-light.svg`} width={width} height={height} alt={alt} style={style} />
    <img className="brand-logo-dark" src={`/brand/v2/logo/mark/master-mark-${variant}on-dark.svg`} width={width} height={height} alt={alt} style={style} />
  </>
}
