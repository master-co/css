import { MasterStyle } from '@master/style';
import { FontWeightStyle } from './font-weight';
import { FontFamilyStyle } from './font-family';
import { FontSizeStyle } from './font-size';
import { SpacingStyle } from './spacing';
import { WidthStyle } from './width';
import { HeightStyle } from './height';
import { MinWidthStyle } from './min-width';
import { MinHeightStyle } from './min-height';
import { LetterSpacingStyle } from './letter-spacing';
import { FontSmoothingStyle } from './font-smoothing';
import { FontStyleStyle } from './font-style';
import { FontVariantNumericStyle } from './font-variant-numeric';
import { LineHeightStyle } from './line-height';
import { ObjectFitStyle } from './object-fit';
import { ObjectPositionStyle } from './object-position';
import { TextAlignStyle } from './text-align';
import { TextDecorationStyle } from './text-decoration';
import { TextLeadingStyle } from './text-leading';
import { TextTransformStyle } from './text-transform';
import { VerticalAlignStyle } from './vertical-align';
import { LinesStyle } from './lines';
import { TransformOriginStyle } from './transform-origin';
import { TransformStyleStyle } from './transform-style';
import { TransformBoxStyle } from './transform-box';
import { TransformStyle } from './transform';
import { TransitionStyle } from './transition';
import { TransitionDelayStyle } from './transition-delay';
import { TransitionDurationStyle } from './transition-duration';
import { TransitionPropertyStyle } from './transition-property';
import { TransitionTimingFunctionStyle } from './transition-timing-function';
import { MaxHeightStyle } from './max-height';
import { MaxWidthStyle } from './max-width';
import { DisplayStyle } from './display';
import { BoxSizingStyle } from './box-sizing';
import { OpacityStyle } from './opacity';
import { VisibilityStyle } from './visibility';
import { ClearStyle } from './clear';
import { FloatStyle } from './float';
import { IsolationStyle } from './isolation';
import { OverflowStyle } from './overflow';
import { OverscrollBehaviorStyle } from './overscroll-behavior';
import { ZIndexStyle } from './z-index';
import { AnimationDelayStyle } from './animation-delay';
import { AnimationDirectionStyle } from './animation-direction';
import { AnimationFillModeStyle } from './animation-fill-mode';
import { AnimationIterationCountStyle } from './animation-iteration-count';
import { AnimationNameStyle } from './animation-name';
import { AnimationPlayStateStyle } from './animation-play-state';
import { AnimationTimingFunctionStyle } from './animation-timing-function';
import { AnimationStyle } from './animation';
import { BorderColorStyle } from './border-color';
import { BorderRadiusStyle } from './border-radius';
import { BorderStyleStyle } from './border-style';
import { BorderWidthStyle } from './border-width';
import { BorderStyle } from './border';
import { BackgroundAttachmentStyle } from './background-attachment';
import { BackgroundBlendModeStyle } from './background-blend-mode';
import { BackgroundClipStyle } from './background-clip';
import { BackgroundColorStyle } from './background-color';
import { BackgroundOriginStyle } from './background-origin';
import { BackgroundPositionStyle } from './background-position';
import { BackgroundRepeatStyle } from './background-repeat';
import { BackgroundSizeStyle } from './background-size';
import { BackgroundImageStyle } from './background-image';
import { BackgroundStyle } from './background';
import { MixBlendModeStyle } from './mix-blend-mode';
import { PositionStyle } from './position';
import { PlacementStyle } from './placement';
import { BackdropFilterStyle } from './backdrop-filter';
import { FillStyle } from './fill';
import { StrokeStyle } from './stroke';
import { StrokeWidthStyle } from './stroke-width';
import { FilterStyle } from './filter';
import { CursorStyle } from './cursor';
import { PointerEventsStyle } from './pointer-events';
import { ResizeStyle } from './resize';
import { TouchActionStyle } from './touch-action';
import { UserDragStyle } from './user-drag';
import { UserSelectStyle } from './user-select';
import { BoxShadowStyle } from './box-shadow';
import { TextShadowStyle } from './text-shadow';
import { TextSizeStyle } from './text-size';
import { WordBreakStyle } from './word-break';
import { GridColumnsStyle } from './grid-columns';
import { GridRowsStyle } from './grid-rows';
import { GapStyle } from './gap';
import { WordSpacingStyle } from './word-spacing';
import { VariableStyle } from './variable';

MasterStyle.Subscriptions.push(
    VariableStyle,
    FontWeightStyle,
    FontFamilyStyle,
    SpacingStyle,
    FontSizeStyle,
    DisplayStyle,
    WidthStyle,
    HeightStyle,
    MinWidthStyle,
    MinHeightStyle,
    LetterSpacingStyle,
    FontSmoothingStyle,
    FontStyleStyle,
    FontVariantNumericStyle,
    LineHeightStyle,
    ObjectFitStyle,
    ObjectPositionStyle,
    TextAlignStyle,
    TextDecorationStyle,
    TextLeadingStyle,
    TextTransformStyle,
    VerticalAlignStyle,
    LinesStyle,
    MaxHeightStyle,
    MaxWidthStyle,
    BoxSizingStyle,
    OpacityStyle,
    VisibilityStyle,
    ClearStyle,
    FloatStyle,
    IsolationStyle,
    OverflowStyle,
    OverscrollBehaviorStyle,
    ZIndexStyle,
    PositionStyle,
    PlacementStyle,
    CursorStyle,
    PointerEventsStyle,
    ResizeStyle,
    TouchActionStyle,
    WordBreakStyle,
    WordSpacingStyle,
    UserDragStyle,
    UserSelectStyle,
    TextShadowStyle,
    TextSizeStyle,
    BoxShadowStyle,
    // transform
    TransformBoxStyle,
    TransformStyleStyle,
    TransformOriginStyle,
    TransformStyle, // last
    // transition
    TransitionPropertyStyle,
    TransitionTimingFunctionStyle,
    TransitionDurationStyle,
    TransitionDelayStyle,
    TransitionStyle, // last
    // animation
    AnimationDelayStyle,
    AnimationDirectionStyle,
    AnimationFillModeStyle,
    AnimationIterationCountStyle,
    AnimationNameStyle,
    AnimationPlayStateStyle,
    AnimationTimingFunctionStyle,
    AnimationStyle,
    // border
    BorderColorStyle,
    BorderRadiusStyle,
    BorderStyleStyle,
    BorderWidthStyle,
    BorderStyle,
    // background
    BackgroundAttachmentStyle,
    BackgroundBlendModeStyle,
    BackgroundClipStyle,
    BackgroundColorStyle,
    BackgroundOriginStyle,
    BackgroundPositionStyle,
    BackgroundRepeatStyle,
    BackgroundSizeStyle,
    BackgroundImageStyle,
    BackgroundStyle,
    // effect
    MixBlendModeStyle,
    BackdropFilterStyle,
    FilterStyle,
    // svg
    FillStyle,
    StrokeStyle,
    StrokeWidthStyle,
    // grid
    GridColumnsStyle,
    GridRowsStyle,
    GapStyle
)