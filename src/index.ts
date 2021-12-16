import { StyleSheet } from '@master/style';

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
import { AspectRadioStyle } from './aspect-radio';
import { BoxDecorationBreakStyle } from './box-decoration-break';
import { BreakAfterStyle } from './break-after';
import { BreakBeforeStyle } from './break-before';
import { BreakInsideStyle } from './break-inside';
import { FlexShrinkStyle } from './flex-shrink';
import { FlexDirectionStyle } from './flex-direction';
import { FlexGrowStyle } from './flex-grow';
import { FlexWrapStyle } from './flex-wrap';
import { FlexBasisStyle } from './flex-basis';
import { FlexStyle } from './flex';
import { OrderStyle } from './order';
import { GridColumnStyle } from './grid-column';
import { ColumnSpanStyle } from './column-span';
import { GridRowStyle } from './grid-row';
import { FontColorStyle } from './font-color';
import { AlignContentStyle } from './align-content';
import { AlignItemsStyle } from './align-items';
import { AlignSelfStyle } from './align-self';
import { GridAutoColumnsStyle } from './grid-auto-columns';
import { GridAutoFlowStyle } from './grid-auto-flow';
import { GridAutoRowsStyle } from './grid-auto-rows';
import { JustifyContentStyle } from './justify-content';
import { JustifyItemsStyle } from './justify-items';
import { JustifySelfStyle } from './justify-self';
import { PlaceContentStyle } from './place-content';
import { PlaceItemsStyle } from './place-items';
import { PlaceSelfStyle } from './place-self';
import { PaddingStyle } from './padding';
import { MarginStyle } from './margin';
import { TextOverflowStyle } from './text-overflow';
import { ListStylePositionStyle } from './list-style-position';
import { ListStyleTypeStyle } from './list-style-type';

window.addEventListener('DOMContentLoaded', (event) => {
    /**
     * 創建監聽器已追蹤整個 document 的 class
     */
    StyleSheet.Styles.push(
        VariableStyle,
        FontWeightStyle,
        FontFamilyStyle,
        FontColorStyle,
        SpacingStyle,
        MarginStyle,
        PaddingStyle,
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
        TextOverflowStyle,
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
        GridColumnStyle,
        GridColumnsStyle,
        GridRowStyle,
        GridRowsStyle,
        GridAutoColumnsStyle,
        GridAutoFlowStyle,
        GridAutoRowsStyle,
        GapStyle,
        OrderStyle,
        // flex
        FlexBasisStyle,
        FlexWrapStyle,
        FlexGrowStyle,
        FlexShrinkStyle,
        FlexDirectionStyle,
        FlexStyle, // last
        // break
        BreakInsideStyle,
        BreakBeforeStyle,
        BreakAfterStyle,
        BoxDecorationBreakStyle,
        AspectRadioStyle,
        ColumnSpanStyle,
        // align
        AlignContentStyle,
        AlignItemsStyle,
        AlignSelfStyle,
        // justify
        JustifyContentStyle,
        JustifyItemsStyle,
        JustifySelfStyle,
        // place
        PlaceContentStyle,
        PlaceItemsStyle,
        PlaceSelfStyle,
        ListStylePositionStyle,
        ListStyleTypeStyle
    )
    const sheet = new StyleSheet(document.head);
    StyleSheet.root = sheet;
    sheet.observe(document.documentElement, { subtree: false, childList: false });
    sheet.observe(document.body);
})
