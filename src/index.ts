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
import { FontSmoothStyle } from './font-smooth';
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
    FontSmoothStyle,
    FontStyleStyle,
    FontVariantNumericStyle,
    LineHeightStyle,
    ObjectFitStyle,
    ObjectPositionStyle,
    TextAlignStyle,
    TextDecorationColorStyle,
    TextDecorationStyleStyle,
    TextDecorationThicknessStyle,
    TextDecorationStyle,
    TextUnderlineOffsetStyle,
    TextOverflowStyle,
    TextOrientationStyle,
    TextTransformStyle,
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
    GridColumnStyle,
    GridColumnsStyle,
    GridRowStyle,
    GridRowsStyle,
    GridAutoColumnsStyle,
    GridAutoFlowStyle,
    GridAutoRowsStyle,
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
    WritingModeStyle
)

window.addEventListener('DOMContentLoaded', (event) => {
    const palettes = {
        blue: ['edf5ff', 'd0e2ff', 'a6c8ff', '78a9ff', '4589ff', '0f62fe', '0043ce', '002d9c', '001d6c', '001141'],
        red: ['fff1f1', 'ffd7d9', 'ffb3b8', 'ff8389', 'fa4d56', 'da1e28', 'a2191f', '750e13', '520408', '2d0709'],
        purple: ['f6f2ff', 'e8daff', 'd4bbff', 'be95ff', 'a56eff', '8a3ffc', '6929c4', '491d8b', '31135e', '1c0f30'],
        gray: ['f4f4f5', 'e0e0e1', 'c6c6c7', 'a8a8a9', '8d8d8e', '6f6f70', '525253', '39393a', '262627', '161617'],
        fade: ['f2f4f8', 'dde1e6', 'c1c7cd', 'a2a9b0', '878d96', '697077', '4d5358', '343a3f', '21272a', '121619'],
        green: ['defbe6', 'a7f0ba', '6fdc8c', '42be65', '24a148', '198038', '0e6027', '044317', '022d0d', '071908'],
        pink: ['fff0f7', 'ffd6e8', 'ffafd2', 'ff7eb6', 'ee5396', 'd02670', '9f1853', '740937', '510224', '2a0a18'],
        cyan: ['e5f6ff', 'bae6ff', '82cfff', '33b1ff', '1192e8', '0072c3', '00539a', '003a6d', '012749', '061727'],
        teal: ['d9fbfb', '9ef0f0', '3ddbd9', '08bdba', '009d9a', '007d79', '005d5d', '004144', '022b30', '081a1c'],
    };
    const colors = {
        black: '000000',
        white: 'ffffff'
    };
    for (const colorName in palettes) {
        const colorCodes = palettes[colorName];
        const eachColors = colors[colorName] = {};
        let level = 10;
        for (const colorCode of colorCodes) {
            eachColors[level] = colorCode
            level += 10;
        }
    }
    Object.assign(Style.colors, colors);
    const sheet = new StyleSheet(document.head);
    StyleSheet.root = sheet;
    sheet.observe(document.documentElement);
})
