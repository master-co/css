import { StyleSheet, Style } from '@master/style';

import { FontWeight } from './font-weight';
import { FontFamily } from './font-family';
import { FontSize } from './font-size';
import { Spacing } from './spacing';
import { Width } from './width';
import { Height } from './height';
import { MinWidth } from './min-width';
import { MinHeight } from './min-height';
import { LetterSpacing } from './letter-spacing';
import { FontSmoothing } from './font-smoothing';
import { FontStyle } from './font-style';
import { FontVariantNumeric } from './font-variant-numeric';
import { LineHeight } from './line-height';
import { ObjectFit } from './object-fit';
import { ObjectPosition } from './object-position';
import { TextAlign } from './text-align';
import { TextDecoration } from './text-decoration';
import { TextTransform } from './text-transform';
import { VerticalAlign } from './vertical-align';
import { Lines } from './lines';
import { TransformOrigin } from './transform-origin';
import { TransformStyle } from './transform-style';
import { TransformBox } from './transform-box';
import { Transform } from './transform';
import { Transition } from './transition';
import { TransitionDelay } from './transition-delay';
import { TransitionDuration } from './transition-duration';
import { TransitionProperty } from './transition-property';
import { TransitionTimingFunction } from './transition-timing-function';
import { MaxHeight } from './max-height';
import { MaxWidth } from './max-width';
import { Display } from './display';
import { BoxSizing } from './box-sizing';
import { Opacity } from './opacity';
import { Visibility } from './visibility';
import { Clear } from './clear';
import { Float } from './float';
import { Isolation } from './isolation';
import { Overflow } from './overflow';
import { OverscrollBehavior } from './overscroll-behavior';
import { ZIndex } from './z-index';
import { AnimationDelay } from './animation-delay';
import { AnimationDirection } from './animation-direction';
import { AnimationFillMode } from './animation-fill-mode';
import { AnimationIterationCount } from './animation-iteration-count';
import { AnimationName } from './animation-name';
import { AnimationPlayState } from './animation-play-state';
import { AnimationTimingFunction } from './animation-timing-function';
import { Animation } from './animation';
import { BorderColor } from './border-color';
import { BorderRadius } from './border-radius';
import { BorderStyle } from './border-style';
import { BorderWidth } from './border-width';
import { Border } from './border';
import { BackgroundAttachment } from './background-attachment';
import { BackgroundBlendMode } from './background-blend-mode';
import { BackgroundClip } from './background-clip';
import { BackgroundColor } from './background-color';
import { BackgroundOrigin } from './background-origin';
import { BackgroundPosition } from './background-position';
import { BackgroundRepeat } from './background-repeat';
import { BackgroundSize } from './background-size';
import { BackgroundImage } from './background-image';
import { Background } from './background';
import { MixBlendMode } from './mix-blend-mode';
import { Position } from './position';
import { Placement } from './placement';
import { BackdropFilter } from './backdrop-filter';
import { Fill } from './fill';
import { Stroke } from './stroke';
import { StrokeWidth } from './stroke-width';
import { Filter } from './filter';
import { Cursor } from './cursor';
import { PointerEvents } from './pointer-events';
import { Resize } from './resize';
import { TouchAction } from './touch-action';
import { UserDrag } from './user-drag';
import { UserSelect } from './user-select';
import { BoxShadow } from './box-shadow';
import { TextShadow } from './text-shadow';
import { TextSize } from './text-size';
import { WordBreak } from './word-break';
import { GridColumns } from './grid-columns';
import { GridRows } from './grid-rows';
import { Gap } from './gap';
import { WordSpacing } from './word-spacing';
import { Variable } from './variable';
import { AspectRadio } from './aspect-radio';
import { BoxDecorationBreak } from './box-decoration-break';
import { BreakAfter } from './break-after';
import { BreakBefore } from './break-before';
import { BreakInside } from './break-inside';
import { FlexShrink } from './flex-shrink';
import { FlexDirection } from './flex-direction';
import { FlexGrow } from './flex-grow';
import { FlexWrap } from './flex-wrap';
import { FlexBasis } from './flex-basis';
import { Flex } from './flex';
import { Order } from './order';
import { GridColumn } from './grid-column';
import { ColumnSpan } from './column-span';
import { GridRow } from './grid-row';
import { FontColor } from './font-color';
import { AlignContent } from './align-content';
import { AlignItems } from './align-items';
import { AlignSelf } from './align-self';
import { GridAutoColumns } from './grid-auto-columns';
import { GridAutoFlow } from './grid-auto-flow';
import { GridAutoRows } from './grid-auto-rows';
import { JustifyContent } from './justify-content';
import { JustifyItems } from './justify-items';
import { JustifySelf } from './justify-self';
import { PlaceContent } from './place-content';
import { PlaceItems } from './place-items';
import { PlaceSelf } from './place-self';
import { Padding } from './padding';
import { Margin } from './margin';
import { TextOverflow } from './text-overflow';
import { ListStylePosition } from './list-style-position';
import { ListStyleType } from './list-style-type';
import { ListStyle } from './list-style';
import { TextDecorationColor } from './text-decoration-color';
import { TextDecorationStyle } from './text-decoration-style';
import { TextDecorationThickness } from './text-decoration-thickness';
import { TextIndent } from './text-indent';
import { Content } from './content';
import { OutlineColor } from './outline-color';
import { OutlineOffset } from './outline-offset';
import { OutlineStyle } from './outline-style';
import { OutlineWidth } from './outline-width';
import { Outline } from './outline';
import { BorderCollapse } from './border-collapse';
import { BorderSpacing } from './border-spacing';
import { TableLayout } from './table-layout';
import { AccentColor } from './accent-color';
import { Appearance } from './appearance';
import { CaretColor } from './caret-color';
import { ScrollBehavior } from './scroll-behavior';
import { ScrollMargin } from './scroll-margin';
import { ScrollPadding } from './scroll-padding';
import { ScrollSnapAlign } from './scroll-snap-align';
import { ScrollSnapStop } from './scroll-snap-stop';
import { ScrollSnapType } from './scroll-snap-type';
import { WillChange } from './will-change';
import { TextUnderlineOffset } from './text-underline-offset';
import { Inset } from './inset';
import { Columns } from './columns';
import { WhiteSpace } from './white-space';
import { TextOrientation } from './text-orientation';
import { WritingMode } from './writing-mode';
import { Contain } from './contain';
import { AnimationDuration } from './animation-duration';
import { TextRendering } from './text-rendering';
import { Direction } from './direction';
import { TextDecorationLine } from './text-decoration-line';
import { GridColumnStart } from './grid-column-start';
import { ListStyleImage } from './list-style-image';
import { ShapeOutside } from './shape-outside';
import { ShapeMargin } from './shape-margin';
import { ShapeImageThreshold } from './shape-image-threshold';
import { ClipPath } from './clip-path';
import { Grid } from './grid';
import { Font } from './font';
import { Quotes } from './quotes';
import { GridTemplate } from './grid-template';
import { GridRowStart } from './grid-row-start';
import { GridTemplateAreas } from './grid-template-areas';
import { GridTemplateColumns } from './grid-template-columns';
import { GridTemplateRows } from './grid-template-rows';
import { GridArea } from './grid-area';
import { GridColumnEnd } from './grid-column-end';
import { GridRowEnd } from './grid-row-end';
import { MaskImage } from './mask-image';
import { TextFillColor } from './text-fill-color';
import { TextStroke } from './text-stroke';
import { TextStrokeWidth } from './text-stroke-width';
import { TextStrokeColor } from './text-stroke-color';
import { StrokeDasharray } from './stroke-dasharray';
import { StrokeDashoffset } from './stroke-dashoffset';

export const Styles = [
    Variable,
    FontWeight,
    FontFamily,
    FontColor,
    Spacing,
    Margin,
    Padding,
    FontSize,
    // flex
    FlexBasis,
    FlexWrap,
    FlexGrow,
    FlexShrink,
    FlexDirection,
    Flex, // last
    Display, // after FlexStyle
    Width,
    Height,
    MinWidth,
    MinHeight,
    Contain,
    Content,
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
    // transform
    TransformBox,
    TransformStyle,
    TransformOrigin,
    Transform, // last
    // transition
    TransitionProperty,
    TransitionTimingFunction,
    TransitionDuration,
    TransitionDelay,
    Transition, // last
    // animation
    AnimationDelay,
    AnimationDirection,
    AnimationDuration,
    AnimationFillMode,
    AnimationIterationCount,
    AnimationName,
    AnimationPlayState,
    AnimationTimingFunction,
    Animation,
    // border
    BorderColor,
    BorderRadius,
    BorderStyle,
    BorderWidth,
    BorderCollapse,
    BorderSpacing,
    Border,
    // background
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
    // effect
    MixBlendMode,
    BackdropFilter,
    Filter,
    // svg
    Fill,
    StrokeDasharray,
    StrokeDashoffset,
    StrokeWidth,
    Stroke,
    // grid
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
    // break
    BreakInside,
    BreakBefore,
    BreakAfter,
    BoxDecorationBreak,
    AspectRadio,
    ColumnSpan,
    // align
    AlignContent,
    AlignItems,
    AlignSelf,
    // justify
    JustifyContent,
    JustifyItems,
    JustifySelf,
    // place
    PlaceContent,
    PlaceItems,
    PlaceSelf,
    ListStylePosition,
    ListStyleType,
    ListStyleImage,
    ListStyle,
    // outline
    OutlineColor,
    OutlineOffset,
    OutlineStyle,
    OutlineWidth,
    Outline,
    AccentColor,
    Appearance,
    CaretColor,
    // scroll
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
] as Styles;

/**
 * @param query fontSize, 'font-size' 
 * */
const get = Styles.get = (query: string) => Styles.find((EachStyle) =>
    query === EachStyle.id || query === EachStyle.key?.replace(/-./g, (m) => m[1].toUpperCase()) || query === EachStyle.key
);

/**
 * @param property 'values', 'semantics' and all of the Style members
 * */
Styles.extend = (property, settings, refresh = true) => {
    for (const query in settings) {
        const EachStyle = get(query);
        if (EachStyle) {
            const eachSettings = settings[query];
            EachStyle.extend(property, eachSettings);
        }
    }
    if (refresh) {
        StyleSheet.refresh();
    }
}

// @ts-ignore
export const colors = {
    fade: {
        10: 'f4f4f6',
        20: 'c3c6cf',
        30: 'a6abb8',
        40: '878d9f',
        50: '63697c',
        60: '4c515f',
        70: '363944',
        80: '24262d',
        90: '131518'
    },
    gray: {
        10: 'f4f4f6',
        20: 'c6c6c8',
        30: 'aaaaac',
        40: '8d8d8f',
        50: '6a6a6c',
        60: '515153',
        70: '39393b',
        80: '242424',
        90: '151515'
    },
    brown: {
        10: 'f8f3f1',
        20: 'd8c2b8',
        30: 'c4a394',
        40: 'af836e',
        50: '8a604c',
        60: '6a4a3a',
        70: '4b3429',
        80: '31221b',
        90: '1c130f',
    },
    orange: {
        10: 'fcf1e7',
        20: 'efbd92',
        30: 'e79855',
        40: 'd5731e',
        50: 'a15717',
        60: '7c4312',
        70: '582f0d',
        80: '3a1f08',
        90: '221205',
    },
    gold: {
        10: 'fff3da',
        20: 'ffba30',
        30: 'e89a00',
        40: 'c08000',
        50: '906000',
        60: '6e4900',
        70: '4e3400',
        80: '342300',
        90: '1e1400',
    },
    yellow: {
        10: 'fff5ca',
        20: 'f0c100',
        30: 'd0a700',
        40: 'ac8a00',
        50: '806700',
        60: '634f00',
        70: '473800',
        80: '2f2500',
        90: '1b1500',
    },
    grass: {
        10: 'ebfad4',
        20: '92da1a',
        30: '7dbc17',
        40: '689c13',
        50: '4e750e',
        60: '3c5a0b',
        70: '2a4008',
        80: '1c2a05',
        90: '101803'
    },
    green: {
        10: 'd5fde5',
        20: '0be561',
        30: '0ac553',
        40: '08a345',
        50: '067b34',
        60: '055f28',
        70: '03441d',
        80: '022d13',
        90: '011a0b'
    },
    beryl: {
        10: 'c9ffee',
        20: '00e19c',
        30: '00c387',
        40: '00a170',
        50: '007954',
        60: '005d41',
        70: '00432f',
        80: '002b1f',
        90: '001912'
    },
    teal: {
        10: 'c5fffb',
        20: '00ddce',
        30: '00bfb2',
        40: '009f94',
        50: '00776f',
        60: '005b55',
        70: '00413d',
        80: '002b28',
        90: '001918'
    },
    cyan: {
        10: 'dff8ff',
        20: '3dd7ff',
        30: '00b9e9',
        40: '0099c1',
        50: '007391',
        60: '005973',
        70: '003f51',
        80: '002a35',
        90: '00181f'
    },
    sky: {
        10: 'eaf6fe',
        20: '8ccefa',
        30: '4db3f7',
        40: '0b92ee',
        50: '086eb3',
        60: '065489',
        70: '043c61',
        80: '032841',
        90: '021726'
    },
    blue: {
        10: 'edf4fe',
        20: 'a5c7fd',
        30: '81acf3',
        40: '538cee',
        50: '175fe9',
        60: '1344c4',
        70: '0d318d',
        80: '09205e',
        90: '051338'
    },
    indigo: {
        10: 'f1f2ff',
        20: 'bfc2f4',
        30: 'a1a5ee',
        40: '7d84e8',
        50: '5a5bd5',
        60: '4835cc',
        70: '332592',
        80: '24195e',
        90: '161031',
    },
    violet: {
        10: 'f5f1ff',
        20: 'd0bdfb',
        30: 'b89bf9',
        40: '9e77f5',
        50: '7949e5',
        60: '641ed2',
        70: '491595',
        80: '310e63',
        90: '1f0839',
    },
    purple: {
        10: 'f9f0ff',
        20: 'dcbaf6',
        30: 'ca96f1',
        40: 'b56cec',
        50: '9832e4',
        60: '7719bd',
        70: '551287',
        80: '390c5b',
        90: '220736',
    },
    fuchsia: {
        10: 'feefff',
        20: 'f1b1f3',
        30: 'ea86ed',
        40: 'e04ee5',
        50: 'b61cbb',
        60: '8e1691',
        70: '68105f',
        80: '470b3d',
        90: '2b0720',
    },
    pink: {
        10: 'fff0f8',
        20: 'f7b2d6',
        30: 'f388c0',
        40: 'ee52a3',
        50: 'ca1473',
        60: '9d1059',
        70: '720c40',
        80: '4c082b',
        90: '2d0519',
    },
    crimson: {
        10: 'fff1f4',
        20: 'ffb1c6',
        30: 'f58ba7',
        40: 'ea5b82',
        50: 'ce1a4b',
        60: 'a20d35',
        70: '780522',
        80: '500317',
        90: '33020f',
    },
    red: {
        10: 'fff1f1',
        20: 'fdb3b5',
        30: 'fa8b8d',
        40: 'eb5f63',
        50: 'd11a1e',
        60: 'a60708',
        70: '780506',
        80: '530001',
        90: '350001',
    },
    black: '000000',
    white: 'ffffff'
}

export const breakpoints = {
    '3xs': 360,
    '2xs': 480,
    xs: 600,
    sm: 768,
    md: 1024,
    lg: 1280,
    xl: 1440,
    '2xl': 1600,
    '3xl': 1920,
    '4xl': 2560
};

export function init() {
    const sheet = new StyleSheet(document.head);
    StyleSheet.root = sheet;
    sheet.observe(document.documentElement);
}

Style.extend('colors', colors, false);
Style.extend('breakpoints', breakpoints, false);
StyleSheet.Styles.push(...Styles);

const MASTER_STYLES = 'MasterStyles';
const MASTER_STYLES_MANUAL = MASTER_STYLES + 'Manual';
if (typeof window !== 'undefined') {
    window['init' + MASTER_STYLES] = init;
    window[MASTER_STYLES] = Styles;
    if (!window[MASTER_STYLES_MANUAL]) {
        init();
    }
}

declare global {
    interface Window {
        MasterStyles: typeof Styles;
        MasterStylesManual: boolean;
    }
}

export interface Styles extends Array<typeof Style> {
    extend: (property: 'semantics' | 'values', settings: { [key: string]: { [key: string]: any } }, refresh?: boolean) => void;
    get: (query: string) => typeof Style
}
