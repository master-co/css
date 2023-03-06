import { fontWeight } from '../rules/font-weight'
import { fontFamily } from '../rules/font-family'
import { fontSize } from '../rules/font-size'
import { spacing } from '../rules/spacing'
import { width } from '../rules/width'
import { height } from '../rules/height'
import { minWidth } from '../rules/min-width'
import { minHeight } from '../rules/min-height'
import { letterSpacing } from '../rules/letter-spacing'
import { fontSmoothing } from '../rules/font-smoothing'
import { fontStyle } from '../rules/font-style'
import { fontVariantNumeric } from '../rules/font-variant-numeric'
import { fontFeatureSettings } from '../rules/font-feature-settings'
import { lineHeight } from '../rules/line-height'
import { objectFit } from '../rules/object-fit'
import { objectPosition } from '../rules/object-position'
import { textAlign } from '../rules/text-align'
import { textDecoration } from '../rules/text-decoration'
import { textTransform } from '../rules/text-transform'
import { verticalAlign } from '../rules/vertical-align'
import { lines } from '../rules/lines'
import { transformOrigin } from '../rules/transform-origin'
import { transformStyle } from '../rules/transform-style'
import { transformBox } from '../rules/transform-box'
import { transform } from '../rules/transform'
import { transition } from '../rules/transition'
import { transitionDelay } from '../rules/transition-delay'
import { transitionDuration } from '../rules/transition-duration'
import { transitionProperty } from '../rules/transition-property'
import { transitionTimingFunction } from '../rules/transition-timing-function'
import { maxHeight } from '../rules/max-height'
import { maxWidth } from '../rules/max-width'
import { display } from '../rules/display'
import { boxSizing } from '../rules/box-sizing'
import { opacity } from '../rules/opacity'
import { visibility } from '../rules/visibility'
import { clear } from '../rules/clear'
import { float } from '../rules/float'
import { isolation } from '../rules/isolation'
import { overflow } from '../rules/overflow'
import { overscrollBehavior } from '../rules/overscroll-behavior'
import { zIndex } from '../rules/z-index'
import { animationDelay } from '../rules/animation-delay'
import { animationDirection } from '../rules/animation-direction'
import { animationFillMode } from '../rules/animation-fill-mode'
import { animationIterationCount } from '../rules/animation-iteration-count'
import { animationName } from '../rules/animation-name'
import { animationPlayState } from '../rules/animation-play-state'
import { animationTimingFunction } from '../rules/animation-timing-function'
import { animation } from '../rules/animation'
import { borderColor } from '../rules/border-color'
import { borderRadius } from '../rules/border-radius'
import { borderStyle } from '../rules/border-style'
import { borderWidth } from '../rules/border-width'
import { border } from '../rules/border'
import { backgroundAttachment } from '../rules/background-attachment'
import { backgroundBlendMode } from '../rules/background-blend-mode'
import { backgroundClip } from '../rules/background-clip'
import { backgroundColor } from '../rules/background-color'
import { backgroundOrigin } from '../rules/background-origin'
import { backgroundPosition } from '../rules/background-position'
import { backgroundRepeat } from '../rules/background-repeat'
import { backgroundSize } from '../rules/background-size'
import { backgroundImage } from '../rules/background-image'
import { background } from '../rules/background'
import { mixBlendMode } from '../rules/mix-blend-mode'
import { position } from '../rules/position'
import { backdropFilter } from '../rules/backdrop-filter'
import { fill } from '../rules/fill'
import { stroke } from '../rules/stroke'
import { strokeWidth } from '../rules/stroke-width'
import { filter } from '../rules/filter'
import { cursor } from '../rules/cursor'
import { pointerEvents } from '../rules/pointer-events'
import { resize } from '../rules/resize'
import { touchAction } from '../rules/touch-action'
import { userDrag } from '../rules/user-drag'
import { userSelect } from '../rules/user-select'
import { boxShadow } from '../rules/box-shadow'
import { textShadow } from '../rules/text-shadow'
import { textSize } from '../rules/text-size'
import { wordBreak } from '../rules/word-break'
import { gridColumns } from '../rules/grid-columns'
import { gridRows } from '../rules/grid-rows'
import { gap } from '../rules/gap'
import { wordSpacing } from '../rules/word-spacing'
import { variable } from '../rules/variable'
import { aspectRatio } from '../rules/aspect-ratio'
import { boxDecorationBreak } from '../rules/box-decoration-break'
import { breakAfter } from '../rules/break-after'
import { breakBefore } from '../rules/break-before'
import { breakInside } from '../rules/break-inside'
import { flexShrink } from '../rules/flex-shrink'
import { flexDirection } from '../rules/flex-direction'
import { flexGrow } from '../rules/flex-grow'
import { flexWrap } from '../rules/flex-wrap'
import { flexBasis } from '../rules/flex-basis'
import { flex } from '../rules/flex'
import { order } from '../rules/order'
import { gridColumn } from '../rules/grid-column'
import { columnSpan } from '../rules/column-span'
import { gridRow } from '../rules/grid-row'
import { color } from '../rules/color'
import { alignContent } from '../rules/align-content'
import { alignItems } from '../rules/align-items'
import { alignSelf } from '../rules/align-self'
import { gridAutoColumns } from '../rules/grid-auto-columns'
import { gridAutoFlow } from '../rules/grid-auto-flow'
import { gridAutoRows } from '../rules/grid-auto-rows'
import { justifyContent } from '../rules/justify-content'
import { justifyItems } from '../rules/justify-items'
import { justifySelf } from '../rules/justify-self'
import { placeContent } from '../rules/place-content'
import { placeItems } from '../rules/place-items'
import { placeSelf } from '../rules/place-self'
import { padding } from '../rules/padding'
import { margin } from '../rules/margin'
import { textOverflow } from '../rules/text-overflow'
import { listStylePosition } from '../rules/list-style-position'
import { listStyleType } from '../rules/list-style-type'
import { listStyle } from '../rules/list-style'
import { textDecorationColor } from '../rules/text-decoration-color'
import { textDecorationStyle } from '../rules/text-decoration-style'
import { textDecorationThickness } from '../rules/text-decoration-thickness'
import { textIndent } from '../rules/text-indent'
import { content } from '../rules/content'
import { outlineColor } from '../rules/outline-color'
import { outlineOffset } from '../rules/outline-offset'
import { outlineStyle } from '../rules/outline-style'
import { outlineWidth } from '../rules/outline-width'
import { outline } from '../rules/outline'
import { borderCollapse } from '../rules/border-collapse'
import { borderSpacing } from '../rules/border-spacing'
import { tableLayout } from '../rules/table-layout'
import { accentColor } from '../rules/accent-color'
import { appearance } from '../rules/appearance'
import { caretColor } from '../rules/caret-color'
import { scrollBehavior } from '../rules/scroll-behavior'
import { scrollMargin } from '../rules/scroll-margin'
import { scrollPadding } from '../rules/scroll-padding'
import { scrollSnapAlign } from '../rules/scroll-snap-align'
import { scrollSnapStop } from '../rules/scroll-snap-stop'
import { scrollSnapType } from '../rules/scroll-snap-type'
import { willChange } from '../rules/will-change'
import { textUnderlineOffset } from '../rules/text-underline-offset'
import { inset } from '../rules/inset'
import { columns } from '../rules/columns'
import { whiteSpace } from '../rules/white-space'
import { textOrientation } from '../rules/text-orientation'
import { writingMode } from '../rules/writing-mode'
import { contain } from '../rules/contain'
import { animationDuration } from '../rules/animation-duration'
import { textRendering } from '../rules/text-rendering'
import { direction } from '../rules/direction'
import { textDecorationLine } from '../rules/text-decoration-line'
import { gridColumnStart } from '../rules/grid-column-start'
import { listStyleImage } from '../rules/list-style-image'
import { shapeOutside } from '../rules/shape-outside'
import { shapeMargin } from '../rules/shape-margin'
import { shapeImageThreshold } from '../rules/shape-image-threshold'
import { clipPath } from '../rules/clip-path'
import { grid } from '../rules/grid'
import { font } from '../rules/font'
import { quotes } from '../rules/quotes'
import { gridTemplate } from '../rules/grid-template'
import { gridRowStart } from '../rules/grid-row-start'
import { gridTemplateAreas } from '../rules/grid-template-areas'
import { gridTemplateColumns } from '../rules/grid-template-columns'
import { gridTemplateRows } from '../rules/grid-template-rows'
import { gridArea } from '../rules/grid-area'
import { gridColumnEnd } from '../rules/grid-column-end'
import { gridRowEnd } from '../rules/grid-row-end'
import { maskImage } from '../rules/mask-image'
import { textFillColor } from '../rules/text-fill-color'
import { textStroke } from '../rules/text-stroke'
import { textStrokeWidth } from '../rules/text-stroke-width'
import { textStrokeColor } from '../rules/text-stroke-color'
import { strokeDasharray } from '../rules/stroke-dasharray'
import { strokeDashoffset } from '../rules/stroke-dashoffset'
import { x } from '../rules/x'
import { y } from '../rules/y'
import { cx } from '../rules/cx'
import { cy } from '../rules/cy'
import { rx } from '../rules/rx'
import { ry } from '../rules/ry'
import { borderImageOutset } from '../rules/border-image-outset'
import { borderImageRepeat } from '../rules/border-image-repeat'
import { borderImageSlice } from '../rules/border-image-slice'
import { borderImageSource } from '../rules/border-image-source'
import { borderImageWidth } from '../rules/border-image-width'
import { borderImage } from '../rules/border-image'
import { group } from '../rules/group'
import { counterIncrement } from '../rules/counter-increment'
import { counterReset } from '../rules/counter-reset'
import { wH } from '../rules/wh'
import { minWH } from '../rules/min-wh'
import { maxWH } from '../rules/max-wh'

export const rules = {
    group,
    variable,
    fontSize,
    fontWeight,
    fontFamily,
    fontSmoothing,
    fontStyle,
    fontVariantNumeric,
    fontFeatureSettings,
    font,
    color,
    spacing,
    margin,
    padding,
    flexBasis,
    flexWrap,
    flexGrow,
    flexShrink,
    flexDirection,
    flex,
    display,
    width,
    height,
    minWidth,
    minHeight,
    wH,
    minWH,
    maxWH,
    contain,
    content,
    counterIncrement,
    counterReset,
    letterSpacing,
    lineHeight,
    objectFit,
    objectPosition,
    textAlign,
    textDecorationColor,
    textDecorationStyle,
    textDecorationThickness,
    textDecorationLine,
    textDecoration,
    textUnderlineOffset,
    textOverflow,
    textOrientation,
    textTransform,
    textRendering,
    textIndent,
    verticalAlign,
    columns,
    whiteSpace,
    inset,
    lines,
    maxHeight,
    maxWidth,
    boxSizing,
    opacity,
    visibility,
    clear,
    float,
    isolation,
    overflow,
    overscrollBehavior,
    zIndex,
    position,
    cursor,
    pointerEvents,
    resize,
    touchAction,
    wordBreak,
    wordSpacing,
    userDrag,
    userSelect,
    textShadow,
    textSize,
    textFillColor,
    textStrokeWidth,
    textStrokeColor,
    textStroke,
    boxShadow,
    tableLayout,
    transformBox,
    transformStyle,
    transformOrigin,
    transform,
    transitionProperty,
    transitionTimingFunction,
    transitionDuration,
    transitionDelay,
    transition,
    animationDelay,
    animationDirection,
    animationDuration,
    animationFillMode,
    animationIterationCount,
    animationName,
    animationPlayState,
    animationTimingFunction,
    animation,
    borderColor,
    borderRadius,
    borderStyle,
    borderWidth,
    borderCollapse,
    borderSpacing,
    borderImageOutset,
    borderImageRepeat,
    borderImageSlice,
    borderImageSource,
    borderImageWidth,
    borderImage,
    border,
    backgroundAttachment,
    backgroundBlendMode,
    backgroundColor,
    backgroundClip,
    backgroundOrigin,
    backgroundPosition,
    backgroundRepeat,
    backgroundSize,
    backgroundImage,
    background,
    mixBlendMode,
    backdropFilter,
    filter,
    fill,
    strokeDasharray,
    strokeDashoffset,
    strokeWidth,
    stroke,
    x,
    y,
    cx,
    cy,
    rx,
    ry,
    gridColumnStart,
    gridColumnEnd,
    gridColumn,
    gridColumns,
    gridRowStart,
    gridRowEnd,
    gridRow,
    gridRows,
    gridAutoColumns,
    gridAutoFlow,
    gridAutoRows,
    gridTemplateAreas,
    gridTemplateColumns,
    gridTemplateRows,
    gridTemplate,
    gridArea,
    grid,
    gap,
    order,
    breakInside,
    breakBefore,
    breakAfter,
    boxDecorationBreak,
    aspectRatio,
    columnSpan,
    alignContent,
    alignItems,
    alignSelf,
    justifyContent,
    justifyItems,
    justifySelf,
    placeContent,
    placeItems,
    placeSelf,
    listStylePosition,
    listStyleType,
    listStyleImage,
    listStyle,
    outlineColor,
    outlineOffset,
    outlineStyle,
    outlineWidth,
    outline,
    accentColor,
    appearance,
    caretColor,
    scrollBehavior,
    scrollMargin,
    scrollPadding,
    scrollSnapAlign,
    scrollSnapStop,
    scrollSnapType,
    willChange,
    writingMode,
    direction,
    shapeOutside,
    shapeMargin,
    shapeImageThreshold,
    clipPath,
    quotes,
    maskImage
}
