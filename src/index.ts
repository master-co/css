import { StyleSheet, Style } from '@master/style';

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
import { ListStyleStyle } from './list-style';
import { TextDecorationColorStyle } from './text-decoration-color';
import { TextDecorationStyleStyle } from './text-decoration-style';
import { TextDecorationThicknessStyle } from './text-decoration-thickness';
import { TextIndentStyle } from './text-indent';
import { ContentStyle } from './content';
import { OutlineColorStyle } from './outline-color';
import { OutlineOffsetStyle } from './outline-offset';
import { OutlineStyleStyle } from './outline-style';
import { OutlineWidthStyle } from './outline-width';
import { OutlineStyle } from './outline';
import { BorderCollapseStyle } from './border-collapse';
import { BorderSpacingStyle } from './border-spacing';
import { TableLayoutStyle } from './table-layout';
import { AccentColorStyle } from './accent-color';
import { AppearanceStyle } from './appearance';
import { CaretColorStyle } from './caret-color';
import { ScrollBehaviorStyle } from './scroll-behavior';
import { ScrollMarginStyle } from './scroll-margin';
import { ScrollPaddingStyle } from './scroll-padding';
import { ScrollSnapAlignStyle } from './scroll-snap-align';
import { ScrollSnapStopStyle } from './scroll-snap-stop';
import { ScrollSnapTypeStyle } from './scroll-snap-type';
import { WillChangeStyle } from './will-change';
import { TextUnderlineOffsetStyle } from './text-underline-offset';
import { InsetStyle } from './inset';
import { ColumnsStyle } from './columns';
import { WhiteSpaceStyle } from './white-space';
import { TextOrientationStyle } from './text-orientation';
import { WritingModeStyle } from './writing-mode';
import { ContainStyle } from './contain';
import { AnimationDurationStyle } from './animation-duration';
import { TextRenderingStyle } from './text-rendering';
import { DirectionStyle } from './direction';
import { TextDecorationLineStyle } from './text-decoration-line';
import { GridColumnStartStyle } from './grid-column-start';
import { ListStyleImageStyle } from './list-style-image';
import { ShapeOutsideStyle } from './shape-outside';
import { ShapeMarginStyle } from './shape-margin';
import { ShapeImageThresholdStyle } from './shape-image-threshold';
import { ClipPathStyle } from './clip-path';
import { GridStyle } from './grid';
import { FontStyle } from './font';
import { QuotesStyle } from './quotes';
import { GridTemplateStyle } from './grid-template';
import { GridRowStartStyle } from './grid-row-start';
import { GridTemplateAreasStyle } from './grid-template-areas';
import { GridTemplateColumnsStyle } from './grid-template-columns';
import { GridTemplateRowsStyle } from './grid-template-rows';
import { GridAreaStyle } from './grid-area';
import { GridColumnEndStyle } from './grid-column-end';
import { GridRowEndStyle } from './grid-row-end';
import { MaskImageStyle } from './mask-image';
import { TextFillColorStyle } from './text-fill-color';
import { TextStrokeStyle } from './text-stroke';
import { TextStrokeWidthStyle } from './text-stroke-width';
import { TextStrokeColorStyle } from './text-stroke-color';

export const Styles = [
    VariableStyle,
    FontWeightStyle,
    FontFamilyStyle,
    FontColorStyle,
    SpacingStyle,
    MarginStyle,
    PaddingStyle,
    FontSizeStyle,
    // flex
    FlexBasisStyle,
    FlexWrapStyle,
    FlexGrowStyle,
    FlexShrinkStyle,
    FlexDirectionStyle,
    FlexStyle, // last
    DisplayStyle, // after FlexStyle
    WidthStyle,
    HeightStyle,
    MinWidthStyle,
    MinHeightStyle,
    ContainStyle,
    ContentStyle,
    LetterSpacingStyle,
    FontSmoothingStyle,
    FontStyleStyle,
    FontVariantNumericStyle,
    FontStyle,
    LineHeightStyle,
    ObjectFitStyle,
    ObjectPositionStyle,
    TextAlignStyle,
    TextDecorationColorStyle,
    TextDecorationStyleStyle,
    TextDecorationThicknessStyle,
    TextDecorationLineStyle,
    TextDecorationStyle,
    TextUnderlineOffsetStyle,
    TextOverflowStyle,
    TextOrientationStyle,
    TextTransformStyle,
    TextRenderingStyle,
    TextIndentStyle,
    VerticalAlignStyle,
    ColumnsStyle,
    WhiteSpaceStyle,
    InsetStyle,
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
    TextFillColorStyle,
    TextStrokeWidthStyle,
    TextStrokeColorStyle,
    TextStrokeStyle,
    BoxShadowStyle,
    TableLayoutStyle,
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
    AnimationDurationStyle,
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
    BorderCollapseStyle,
    BorderSpacingStyle,
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
    GridColumnStartStyle,
    GridColumnEndStyle,
    GridColumnStyle,
    GridColumnsStyle,
    GridRowStartStyle,
    GridRowEndStyle,
    GridRowStyle,
    GridRowsStyle,
    GridAutoColumnsStyle,
    GridAutoFlowStyle,
    GridAutoRowsStyle,
    GridTemplateAreasStyle,
    GridTemplateColumnsStyle,
    GridTemplateRowsStyle,
    GridTemplateStyle,
    GridAreaStyle,
    GridStyle,
    GapStyle,
    OrderStyle,
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
    ListStyleTypeStyle,
    ListStyleImageStyle,
    ListStyleStyle,
    // outline
    OutlineColorStyle,
    OutlineOffsetStyle,
    OutlineStyleStyle,
    OutlineWidthStyle,
    OutlineStyle,
    AccentColorStyle,
    AppearanceStyle,
    CaretColorStyle,
    // scroll
    ScrollBehaviorStyle,
    ScrollMarginStyle,
    ScrollPaddingStyle,
    ScrollSnapAlignStyle,
    ScrollSnapStopStyle,
    ScrollSnapTypeStyle,
    WillChangeStyle,
    WritingModeStyle,
    DirectionStyle,
    ShapeOutsideStyle,
    ShapeMarginStyle,
    ShapeImageThresholdStyle,
    ClipPathStyle,
    QuotesStyle,
    MaskImageStyle
]

export function init() {
    StyleSheet.Styles.push(...Styles);
    Style.singleColors.push('black', 'white');
    Object.assign(Style.colors, {
        black: '000000',
        white: 'ffffff',
        fade: '71798e',
        gray: '7c7c7e',
        brown: '936753',
        orange: 'ff6600',
        gold: 'ff9d00',
        yellow: 'ffc800',
        grass: '85d016',
        green: '2fb655',
        beryl: '00cc7e',
        teal: '00ccaa',
        cyan: '12d0ed',
        sky: '00a6ff',
        blue: '0f62fe',
        indigo: '4f46e5',
        violet: '6316e9',
        purple: '8318e7',
        fuchsia: 'cc22c9',
        pink: 'd92671',
        crimson: 'dc143c',
        red: 'ed1c24',
    });
    const sheet = new StyleSheet(document.head);
    StyleSheet.root = sheet;
    sheet.observe(document.documentElement);
}

if (typeof window !== 'undefined') {
    const MASTER_STYLES = 'MasterStyles';
    window['init' + MASTER_STYLES] = init;
    window[MASTER_STYLES] = Styles;
    if (!window[MASTER_STYLES + 'Manual']) {
        init();
    }
}