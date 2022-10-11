const { FontWeight } = require('../rules/font-weight');
const { FontFamily } = require('../rules/font-family');
const { FontSize } = require('../rules/font-size');
const { Spacing } = require('../rules/spacing');
const { Width } = require('../rules/width');
const { Height } = require('../rules/height');
const { MinWidth } = require('../rules/min-width');
const { MinHeight } = require('../rules/min-height');
const { LetterSpacing } = require('../rules/letter-spacing');
const { FontSmoothing } = require('../rules/font-smoothing');
const { FontStyle } = require('../rules/font-style');
const { FontVariantNumeric } = require('../rules/font-variant-numeric');
const { LineHeight } = require('../rules/line-height');
const { ObjectFit } = require('../rules/object-fit');
const { ObjectPosition } = require('../rules/object-position');
const { TextAlign } = require('../rules/text-align');
const { TextDecoration } = require('../rules/text-decoration');
const { TextTransform } = require('../rules/text-transform');
const { VerticalAlign } = require('../rules/vertical-align');
const { Lines } = require('../rules/lines');
const { TransformOrigin } = require('../rules/transform-origin');
const { TransformStyle } = require('../rules/transform-style');
const { TransformBox } = require('../rules/transform-box');
const { Transform } = require('../rules/transform');
const { Transition } = require('../rules/transition');
const { TransitionDelay } = require('../rules/transition-delay');
const { TransitionDuration } = require('../rules/transition-duration');
const { TransitionProperty } = require('../rules/transition-property');
const { TransitionTimingFunction } = require('../rules/transition-timing-function');
const { MaxHeight } = require('../rules/max-height');
const { MaxWidth } = require('../rules/max-width');
const { Display } = require('../rules/display');
const { BoxSizing } = require('../rules/box-sizing');
const { Opacity } = require('../rules/opacity');
const { Visibility } = require('../rules/visibility');
const { Clear } = require('../rules/clear');
const { Float } = require('../rules/float');
const { Isolation } = require('../rules/isolation');
const { Overflow } = require('../rules/overflow');
const { OverscrollBehavior } = require('../rules/overscroll-behavior');
const { ZIndex } = require('../rules/z-index');
const { AnimationDelay } = require('../rules/animation-delay');
const { AnimationDirection } = require('../rules/animation-direction');
const { AnimationFillMode } = require('../rules/animation-fill-mode');
const { AnimationIterationCount } = require('../rules/animation-iteration-count');
const { AnimationName } = require('../rules/animation-name');
const { AnimationPlayState } = require('../rules/animation-play-state');
const { AnimationTimingFunction } = require('../rules/animation-timing-function');
const { Animation } = require('../rules/animation');
const { BorderColor } = require('../rules/border-color');
const { BorderRadius } = require('../rules/border-radius');
const { BorderStyle } = require('../rules/border-style');
const { BorderWidth } = require('../rules/border-width');
const { Border } = require('../rules/border');
const { BackgroundAttachment } = require('../rules/background-attachment');
const { BackgroundBlendMode } = require('../rules/background-blend-mode');
const { BackgroundClip } = require('../rules/background-clip');
const { BackgroundColor } = require('../rules/background-color');
const { BackgroundOrigin } = require('../rules/background-origin');
const { BackgroundPosition } = require('../rules/background-position');
const { BackgroundRepeat } = require('../rules/background-repeat');
const { BackgroundSize } = require('../rules/background-size');
const { BackgroundImage } = require('../rules/background-image');
const { Background } = require('../rules/background');
const { MixBlendMode } = require('../rules/mix-blend-mode');
const { Position } = require('../rules/position');
const { Placement } = require('../rules/placement');
const { BackdropFilter } = require('../rules/backdrop-filter');
const { Fill } = require('../rules/fill');
const { Stroke } = require('../rules/stroke');
const { StrokeWidth } = require('../rules/stroke-width');
const { Filter } = require('../rules/filter');
const { Cursor } = require('../rules/cursor');
const { PointerEvents } = require('../rules/pointer-events');
const { Resize } = require('../rules/resize');
const { TouchAction } = require('../rules/touch-action');
const { UserDrag } = require('../rules/user-drag');
const { UserSelect } = require('../rules/user-select');
const { BoxShadow } = require('../rules/box-shadow');
const { TextShadow } = require('../rules/text-shadow');
const { TextSize } = require('../rules/text-size');
const { WordBreak } = require('../rules/word-break');
const { GridColumns } = require('../rules/grid-columns');
const { GridRows } = require('../rules/grid-rows');
const { Gap } = require('../rules/gap');
const { WordSpacing } = require('../rules/word-spacing');
const { Variable } = require('../rules/variable');
const { AspectRadio } = require('../rules/aspect-radio');
const { BoxDecorationBreak } = require('../rules/box-decoration-break');
const { BreakAfter } = require('../rules/break-after');
const { BreakBefore } = require('../rules/break-before');
const { BreakInside } = require('../rules/break-inside');
const { FlexShrink } = require('../rules/flex-shrink');
const { FlexDirection } = require('../rules/flex-direction');
const { FlexGrow } = require('../rules/flex-grow');
const { FlexWrap } = require('../rules/flex-wrap');
const { FlexBasis } = require('../rules/flex-basis');
const { Flex } = require('../rules/flex');
const { Order } = require('../rules/order');
const { GridColumn } = require('../rules/grid-column');
const { ColumnSpan } = require('../rules/column-span');
const { GridRow } = require('../rules/grid-row');
const { Color } = require('../rules/color');
const { AlignContent } = require('../rules/align-content');
const { AlignItems } = require('../rules/align-items');
const { AlignSelf } = require('../rules/align-self');
const { GridAutoColumns } = require('../rules/grid-auto-columns');
const { GridAutoFlow } = require('../rules/grid-auto-flow');
const { GridAutoRows } = require('../rules/grid-auto-rows');
const { JustifyContent } = require('../rules/justify-content');
const { JustifyItems } = require('../rules/justify-items');
const { JustifySelf } = require('../rules/justify-self');
const { PlaceContent } = require('../rules/place-content');
const { PlaceItems } = require('../rules/place-items');
const { PlaceSelf } = require('../rules/place-self');
const { Padding } = require('../rules/padding');
const { Margin } = require('../rules/margin');
const { TextOverflow } = require('../rules/text-overflow');
const { ListStylePosition } = require('../rules/list-style-position');
const { ListStyleType } = require('../rules/list-style-type');
const { ListStyle } = require('../rules/list-style');
const { TextDecorationColor } = require('../rules/text-decoration-color');
const { TextDecorationStyle } = require('../rules/text-decoration-style');
const { TextDecorationThickness } = require('../rules/text-decoration-thickness');
const { TextIndent } = require('../rules/text-indent');
const { Content } = require('../rules/content');
const { OutlineColor } = require('../rules/outline-color');
const { OutlineOffset } = require('../rules/outline-offset');
const { OutlineStyle } = require('../rules/outline-style');
const { OutlineWidth } = require('../rules/outline-width');
const { Outline } = require('../rules/outline');
const { BorderCollapse } = require('../rules/border-collapse');
const { BorderSpacing } = require('../rules/border-spacing');
const { TableLayout } = require('../rules/table-layout');
const { AccentColor } = require('../rules/accent-color');
const { Appearance } = require('../rules/appearance');
const { CaretColor } = require('../rules/caret-color');
const { ScrollBehavior } = require('../rules/scroll-behavior');
const { ScrollMargin } = require('../rules/scroll-margin');
const { ScrollPadding } = require('../rules/scroll-padding');
const { ScrollSnapAlign } = require('../rules/scroll-snap-align');
const { ScrollSnapStop } = require('../rules/scroll-snap-stop');
const { ScrollSnapType } = require('../rules/scroll-snap-type');
const { WillChange } = require('../rules/will-change');
const { TextUnderlineOffset } = require('../rules/text-underline-offset');
const { Inset } = require('../rules/inset');
const { Columns } = require('../rules/columns');
const { WhiteSpace } = require('../rules/white-space');
const { TextOrientation } = require('../rules/text-orientation');
const { WritingMode } = require('../rules/writing-mode');
const { Contain } = require('../rules/contain');
const { AnimationDuration } = require('../rules/animation-duration');
const { TextRendering } = require('../rules/text-rendering');
const { Direction } = require('../rules/direction');
const { TextDecorationLine } = require('../rules/text-decoration-line');
const { GridColumnStart } = require('../rules/grid-column-start');
const { ListStyleImage } = require('../rules/list-style-image');
const { ShapeOutside } = require('../rules/shape-outside');
const { ShapeMargin } = require('../rules/shape-margin');
const { ShapeImageThreshold } = require('../rules/shape-image-threshold');
const { ClipPath } = require('../rules/clip-path');
const { Grid } = require('../rules/grid');
const { Font } = require('../rules/font');
const { Quotes } = require('../rules/quotes');
const { GridTemplate } = require('../rules/grid-template');
const { GridRowStart } = require('../rules/grid-row-start');
const { GridTemplateAreas } = require('../rules/grid-template-areas');
const { GridTemplateColumns } = require('../rules/grid-template-columns');
const { GridTemplateRows } = require('../rules/grid-template-rows');
const { GridArea } = require('../rules/grid-area');
const { GridColumnEnd } = require('../rules/grid-column-end');
const { GridRowEnd } = require('../rules/grid-row-end');
const { MaskImage } = require('../rules/mask-image');
const { TextFillColor } = require('../rules/text-fill-color');
const { TextStroke } = require('../rules/text-stroke');
const { TextStrokeWidth } = require('../rules/text-stroke-width');
const { TextStrokeColor } = require('../rules/text-stroke-color');
const { StrokeDasharray } = require('../rules/stroke-dasharray');
const { StrokeDashoffset } = require('../rules/stroke-dashoffset');
const { X } = require('../rules/x');
const { Y } = require('../rules/y');
const { Cx } = require('../rules/cx');
const { Cy } = require('../rules/cy');
const { Rx } = require('../rules/rx');
const { Ry } = require('../rules/ry');
const { BorderImageOutset } = require('../rules/border-image-outset');
const { BorderImageRepeat } = require('../rules/border-image-repeat');
const { BorderImageSlice } = require('../rules/border-image-slice');
const { BorderImageSource } = require('../rules/border-image-source');
const { BorderImageWidth } = require('../rules/border-image-width');
const { BorderImage } = require('../rules/border-image');
const { Group } = require('../rules/group');
const { CounterIncrement } = require('../rules/counter-increment');

module.exports = [
    Group,
    Variable,
    FontWeight,
    FontFamily,
    Color,
    Spacing,
    Margin,
    Padding,
    FontSize,
    FlexBasis,
    FlexWrap,
    FlexGrow,
    FlexShrink,
    FlexDirection,
    Flex,
    Display,
    Width,
    Height,
    MinWidth,
    MinHeight,
    Contain,
    Content,
    CounterIncrement,
    LetterSpacing,
    FontSmoothing,
    FontStyle,
    FontVariantNumeric,
    Font,
    LineHeight,
    ObjectFit,
    ObjectPosition,
    TextAlign,
    TextDecorationColor,
    TextDecorationStyle,
    TextDecorationThickness,
    TextDecorationLine,
    TextDecoration,
    TextUnderlineOffset,
    TextOverflow,
    TextOrientation,
    TextTransform,
    TextRendering,
    TextIndent,
    VerticalAlign,
    Columns,
    WhiteSpace,
    Inset,
    Lines,
    MaxHeight,
    MaxWidth,
    BoxSizing,
    Opacity,
    Visibility,
    Clear,
    Float,
    Isolation,
    Overflow,
    OverscrollBehavior,
    ZIndex,
    Position,
    Placement,
    Cursor,
    PointerEvents,
    Resize,
    TouchAction,
    WordBreak,
    WordSpacing,
    UserDrag,
    UserSelect,
    TextShadow,
    TextSize,
    TextFillColor,
    TextStrokeWidth,
    TextStrokeColor,
    TextStroke,
    BoxShadow,
    TableLayout,
    TransformBox,
    TransformStyle,
    TransformOrigin,
    Transform,
    TransitionProperty,
    TransitionTimingFunction,
    TransitionDuration,
    TransitionDelay,
    Transition,
    AnimationDelay,
    AnimationDirection,
    AnimationDuration,
    AnimationFillMode,
    AnimationIterationCount,
    AnimationName,
    AnimationPlayState,
    AnimationTimingFunction,
    Animation,
    BorderColor,
    BorderRadius,
    BorderStyle,
    BorderWidth,
    BorderCollapse,
    BorderSpacing,
    Border,
    BorderImageOutset,
    BorderImageRepeat,
    BorderImageSlice,
    BorderImageSource,
    BorderImageWidth,
    BorderImage,
    BackgroundAttachment,
    BackgroundBlendMode,
    BackgroundClip,
    BackgroundColor,
    BackgroundOrigin,
    BackgroundPosition,
    BackgroundRepeat,
    BackgroundSize,
    BackgroundImage,
    Background,
    MixBlendMode,
    BackdropFilter,
    Filter,
    Fill,
    StrokeDasharray,
    StrokeDashoffset,
    StrokeWidth,
    Stroke,
    X,
    Y,
    Cx,
    Cy,
    Rx,
    Ry,
    GridColumnStart,
    GridColumnEnd,
    GridColumn,
    GridColumns,
    GridRowStart,
    GridRowEnd,
    GridRow,
    GridRows,
    GridAutoColumns,
    GridAutoFlow,
    GridAutoRows,
    GridTemplateAreas,
    GridTemplateColumns,
    GridTemplateRows,
    GridTemplate,
    GridArea,
    Grid,
    Gap,
    Order,
    BreakInside,
    BreakBefore,
    BreakAfter,
    BoxDecorationBreak,
    AspectRadio,
    ColumnSpan,
    AlignContent,
    AlignItems,
    AlignSelf,
    JustifyContent,
    JustifyItems,
    JustifySelf,
    PlaceContent,
    PlaceItems,
    PlaceSelf,
    ListStylePosition,
    ListStyleType,
    ListStyleImage,
    ListStyle,
    OutlineColor,
    OutlineOffset,
    OutlineStyle,
    OutlineWidth,
    Outline,
    AccentColor,
    Appearance,
    CaretColor,
    ScrollBehavior,
    ScrollMargin,
    ScrollPadding,
    ScrollSnapAlign,
    ScrollSnapStop,
    ScrollSnapType,
    WillChange,
    WritingMode,
    Direction,
    ShapeOutside,
    ShapeMargin,
    ShapeImageThreshold,
    ClipPath,
    Quotes,
    MaskImage
];