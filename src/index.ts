import { MasterStyle } from '@master/style';
import { MasterFontWeightStyle } from './font-weight';
import { MasterFontFamilyStyle } from './font-family';
import { MasterFontSizeStyle } from './font-size';
import { MasterSpacingStyle } from './spacing';
import { MasterWidthStyle } from './width';
import { MasterHeightStyle } from './height';
import { MasterMinWidthStyle } from './min-width';
import { MasterMinHeightStyle } from './min-height';
import { MasterLetterSpacingStyle } from './letter-spacing';
import { MasterFontSmoothingStyle } from './font-smoothing';
import { MasterFontStyleStyle } from './font-style';
import { MasterFontVariantNumericStyle } from './font-variant-numeric';
import { MasterLineHeightStyle } from './line-height';
import { MasterObjectFitStyle } from './object-fit';
import { MasterObjectPositionStyle } from './object-position';
import { MasterTextAlignStyle } from './text-align';
import { MasterTextDecorationStyle } from './text-decoration';
import { MasterTextLeadingStyle } from './text-leading';
import { MasterTextTransformStyle } from './text-transform';
import { MasterVerticalAlignStyle } from './vertical-align';
import { MasterLinesStyle } from './lines';
import { MasterTransformOriginStyle } from './transform-origin';
import { MasterTransformStyleStyle } from './transform-style';
import { MasterTransformBoxStyle } from './transform-box';
import { MasterTransformStyle } from './transform';
import { MasterTransitionStyle } from './transition';
import { MasterTransitionDelayStyle } from './transition-delay';
import { MasterTransitionDurationStyle } from './transition-duration';
import { MasterTransitionPropertyStyle } from './transition-property';
import { MasterTransitionTimingFunctionStyle } from './transition-timing-function';
import { MasterMaxHeightStyle } from './max-height';
import { MasterMaxWidthStyle } from './max-width';
import { MasterDisplayStyle } from './display';
import { MasterBoxSizingStyle } from './box-sizing';
import { MasterOpacityStyle } from './opacity';
import { MasterVisibilityStyle } from './visibility';
import { MasterClearStyle } from './clear';
import { MasterFloatStyle } from './float';
import { MasterIsolationStyle } from './isolation';
import { MasterOverflowStyle } from './overflow';
import { MasterOverscrollBehaviorStyle } from './overscroll-behavior';
import { MasterZIndexStyle } from './z-index';
import { MasterAnimationDelayStyle } from './animation-delay';
import { MasterAnimationDirectionStyle } from './animation-direction';
import { MasterAnimationFillModeStyle } from './animation-fill-mode';
import { MasterAnimationIterationCountStyle } from './animation-iteration-count';
import { MasterAnimationNameStyle } from './animation-name';
import { MasterAnimationPlayStateStyle } from './animation-play-state';
import { MasterAnimationTimingFunctionStyle } from './animation-timing-function';
import { MasterAnimationStyle } from './animation';
import { MasterBorderColorStyle } from './border-color';
import { MasterBorderRadiusStyle } from './border-radius';
import { MasterBorderStyleStyle } from './border-style';
import { MasterBorderWidthStyle } from './border-width';
import { MasterBorderStyle } from './border';
import { MasterBackgroundAttachmentStyle } from './background-attachment';
import { MasterBackgroundBlendModeStyle } from './background-blend-mode';
import { MasterBackgroundClipStyle } from './background-clip';
import { MasterBackgroundColorStyle } from './background-color';
import { MasterBackgroundOriginStyle } from './background-origin';
import { MasterBackgroundPositionStyle } from './background-position';
import { MasterBackgroundRepeatStyle } from './background-repeat';
import { MasterBackgroundSizeStyle } from './background-size';
import { MasterBackgroundImageStyle } from './background-image';
import { MasterBackgroundStyle } from './background';
import { MasterMixBlendModeStyle } from './mix-blend-mode';
import { MasterPositionStyle } from './position';
import { MasterPlacementStyle } from './placement';
import { MasterBackdropFilterStyle } from './backdrop-filter';
import { MasterFillStyle } from './fill';
import { MasterStrokeStyle } from './stroke';
import { MasterStrokeWidthStyle } from './stroke-width';
import { MasterFilterStyle } from './filter';
import { MasterCursorStyle } from './cursor';
import { MasterPointerEventsStyle } from './pointer-events';
import { MasterResizeStyle } from './resize';
import { MasterTouchActionStyle } from './touch-action';
import { MasterUserDragStyle } from './user-drag';
import { MasterUserSelectStyle } from './user-select';
import { MasterBoxShadowStyle } from './box-shadow';
import { MasterTextShadowStyle } from './text-shadow';
import { MasterTextSizeStyle } from './text-size';
import { MasterWordBreakStyle } from './word-break';
import { MasterGridColumnsStyle } from './grid-columns';
import { MasterGridRowsStyle } from './grid-rows';
import { MasterGapStyle } from './gap';
import { MasterWordSpacingStyle } from './word-spacing';
import { MasterVariableStyle } from './variable';

MasterStyle.Subscriptions.push(
    MasterVariableStyle,
    MasterFontWeightStyle,
    MasterFontFamilyStyle,
    MasterSpacingStyle,
    MasterFontSizeStyle,
    MasterDisplayStyle,
    MasterWidthStyle,
    MasterHeightStyle,
    MasterMinWidthStyle,
    MasterMinHeightStyle,
    MasterLetterSpacingStyle,
    MasterFontSmoothingStyle,
    MasterFontStyleStyle,
    MasterFontVariantNumericStyle,
    MasterLineHeightStyle,
    MasterObjectFitStyle,
    MasterObjectPositionStyle,
    MasterTextAlignStyle,
    MasterTextDecorationStyle,
    MasterTextLeadingStyle,
    MasterTextTransformStyle,
    MasterVerticalAlignStyle,
    MasterLinesStyle,
    MasterMaxHeightStyle,
    MasterMaxWidthStyle,
    MasterBoxSizingStyle,
    MasterOpacityStyle,
    MasterVisibilityStyle,
    MasterClearStyle,
    MasterFloatStyle,
    MasterIsolationStyle,
    MasterOverflowStyle,
    MasterOverscrollBehaviorStyle,
    MasterZIndexStyle,
    MasterPositionStyle,
    MasterPlacementStyle,
    MasterCursorStyle,
    MasterPointerEventsStyle,
    MasterResizeStyle,
    MasterTouchActionStyle,
    MasterWordBreakStyle,
    MasterWordSpacingStyle,
    MasterUserDragStyle,
    MasterUserSelectStyle,
    MasterTextShadowStyle,
    MasterTextSizeStyle,
    MasterBoxShadowStyle,
    // transform
    MasterTransformBoxStyle,
    MasterTransformStyleStyle,
    MasterTransformOriginStyle,
    MasterTransformStyle, // last
    // transition
    MasterTransitionPropertyStyle,
    MasterTransitionTimingFunctionStyle,
    MasterTransitionDurationStyle,
    MasterTransitionDelayStyle,
    MasterTransitionStyle, // last
    // animation
    MasterAnimationDelayStyle,
    MasterAnimationDirectionStyle,
    MasterAnimationFillModeStyle,
    MasterAnimationIterationCountStyle,
    MasterAnimationNameStyle,
    MasterAnimationPlayStateStyle,
    MasterAnimationTimingFunctionStyle,
    MasterAnimationStyle,
    // border
    MasterBorderColorStyle,
    MasterBorderRadiusStyle,
    MasterBorderStyleStyle,
    MasterBorderWidthStyle,
    MasterBorderStyle,
    // background
    MasterBackgroundAttachmentStyle,
    MasterBackgroundBlendModeStyle,
    MasterBackgroundClipStyle,
    MasterBackgroundColorStyle,
    MasterBackgroundOriginStyle,
    MasterBackgroundPositionStyle,
    MasterBackgroundRepeatStyle,
    MasterBackgroundSizeStyle,
    MasterBackgroundImageStyle,
    MasterBackgroundStyle,
    // effect
    MasterMixBlendModeStyle,
    MasterBackdropFilterStyle,
    MasterFilterStyle,
    // svg
    MasterFillStyle,
    MasterStrokeStyle,
    MasterStrokeWidthStyle,
    // grid
    MasterGridColumnsStyle,
    MasterGridRowsStyle,
    MasterGapStyle
)