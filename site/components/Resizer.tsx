import { useEffect, useRef, useState } from 'react';
import { cls } from '~/utils/cls';
import { Style } from '@master/css';
import { isBrowser } from '~/utils/isBrowser';
import clsx from 'clsx';

function roundTo2(num: number) {
    return Math.round(num * 100) / 100;
}

export default function Resizer({
    width,
    height,
    verticalCenter,
    containerClassName,
    showRuler,
    disableRuler,
    onResizeStart,
    onResizeEnd,
    widthChange,
    heightChange,
    children,
    className,
    ruleClassName = 'fixed',
    onResize,
    center = true,
    overlay = true,
    showHandler = [false, true],
    showHeight
}: any) {
    const outerWidth = isBrowser ? window.outerWidth : 1920;
    const breakpoints = Object
        .keys(Style.breakpoints)
        .filter(key => Style.breakpoints[key] <= outerWidth)
        .map(key => ({
            name: key,
            value: Style.breakpoints[key]
        }))
        .reverse();

    const [_width, setWidth] = useState(width ?? '100%')
    const [_height, setHeight] = useState(height ?? '100%')

    useEffect(() => {
        setWidth(width ?? '100%')
        setHeight(height ?? '100%')
    }, [width, height]);

    const containerRef = useRef<HTMLDivElement>(null)
    const [resizing, setResizing] = useState(false)
    const [backdrop, setBackdrop] = useState<HTMLElement>()
    const handlerProps = {
        resizing,
        containerRef,
        backdrop,
        setResizing,
        setWidth,
        widthChange,
        onResizeStart,
        center,
        setHeight,
        heightChange,
        onResizeEnd,
        verticalCenter,
        onResize
    };

    useEffect(() => {
        (async () => {
            const newBackdroup = document.createElement('div')
            newBackdroup.className = 'fixed z:1040 left:0 top:0 full contain:strict';
            if (overlay) {
                newBackdroup.classList.add('bg:black/.5', '@fade|.2s')
            }
            setBackdrop(newBackdroup)
        })()
    }, [overlay]);

    useEffect(() => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            onResize?.(rect.width, rect.height);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={clsx('flex flex:col', className, {
            'align-items:center': center,
            'justify-items:center': verticalCenter
        })}>
            {(resizing || showRuler) && !disableRuler &&
                <div className={clsx(ruleClassName, 'top:0 left:0 z:1060 w:full t:center f:12 py:10 bg:gray-22@dark bg:fade-90')}>
                    {
                        breakpoints.map((eachBreakpoint, i) => {
                            const last = i === breakpoints.length - 1;
                            const currentWidth = +_width.replace('px', '');

                            return (
                                <div key={eachBreakpoint.name} className={cls`abs inset:0 m:auto w:${eachBreakpoint.value} h:full bx:2|solid|fade-88 b:gray-10@dark flex align-items:center
                                    ${(eachBreakpoint.value >= currentWidth && (last || currentWidth >= breakpoints[i + 1]?.value))
                                        ? 'bg:gray-26@dark bg:white f:semibold'
                                        : 'f:gray-44@dark f:fade-56'}
                                `}>
                                    <div className="abs left:8">{eachBreakpoint.name}</div>
                                    <div className="abs right:8">{eachBreakpoint.name}</div>
                                </div>
                            )
                        })
                    }
                    <div className="rel">{_width.replace('px', '')}{showHeight ? ' × ' + _height.replace('px', '') : ''} px</div>
                </div>
            }
            <div ref={containerRef} className={clsx(containerClassName, `rel flex:0|0|auto`, { 'z:1050': resizing })} style={{ width: _width, height: _height }}>
                {children}
                {!(showHandler !== true && showHandler === false
                    || showHandler.length === 1 && showHandler[0] !== true
                    || showHandler.length === 2 && showHandler[1] !== true
                    || showHandler.length === 3 && showHandler[1] !== true
                    || showHandler.length === 4 && showHandler[3] !== true) &&
                    <Handler className="hide@<sm translateX(-100%) left:0 translateX(-50%):active top:0 bottom:0 h:40:active>svg align-items:center cursor:col-resize"
                        direction="x"
                        {...handlerProps} />
                }
                {!(showHandler !== true && showHandler === false
                    || showHandler.length === 1 && showHandler[0] !== true
                    || showHandler.length === 2 && showHandler[1] !== true
                    || showHandler.length === 3 && showHandler[1] !== true
                    || showHandler.length === 4 && showHandler[1] !== true) &&
                    <Handler className="hide@<sm translateX(100%) right:0 translateX(50%):active top:0 bottom:0 h:40:active>svg align-items:center cursor:col-resize"
                        direction="x"
                        {...handlerProps} />
                }
                {!(showHandler !== true && showHandler === false
                    || showHandler.length === 1 && showHandler[0] !== true
                    || showHandler.length === 2 && showHandler[0] !== true
                    || showHandler.length === 3 && showHandler[0] !== true
                    || showHandler.length === 4 && showHandler[0] !== true) &&
                    <Handler className="translateY(-100%) top:0 translateY(-50%):active left:0 right:0 w:40:active>svg justify-content:center cursor:row-resize"
                        direction="y"
                        {...handlerProps} />
                }
                {!(showHandler !== true && showHandler === false
                    || showHandler.length === 1 && showHandler[0] !== true
                    || showHandler.length === 2 && showHandler[0] !== true
                    || showHandler.length === 3 && showHandler[2] !== true
                    || showHandler.length === 4 && showHandler[2] !== true) &&
                    <Handler className="translateY(100%) bottom:0 translateY(50%):active left:0 right:0 w:40:active>svg justify-content:center cursor:row-resize"
                        direction="y"
                        {...handlerProps} />
                }
            </div>
        </div>
    )
}

const Handler = ({
    className,
    direction,
    resizing,
    containerRef,
    backdrop,
    setResizing,
    setWidth,
    widthChange,
    onResizeStart,
    center,
    setHeight,
    heightChange,
    onResizeEnd,
    verticalCenter,
    onResize
}: any) => {

    async function resize(startEvent: any) {
        const target = containerRef.current;
        if (target) {
            const rect = target.getBoundingClientRect()
            const startX = startEvent.clientX;
            const startY = startEvent.clientY;
            document.body.appendChild(backdrop)
            setResizing(true)
            let tempWidth = rect.width;
            let tempHeight = rect.height;

            const options = { passive: true };
            const moveEventHandler = (event: any) => {
                onResizeStart?.()
                switch (direction) {
                    case 'x':
                        tempWidth = roundTo2(rect.width
                            + (event.clientX - startX)
                            * (center ? 2 : 1)
                            * (startX > rect.x ? 1 : -1))
                            + 'px';
                        setWidth(tempWidth)
                        widthChange?.(tempWidth)
                        onResize?.(+tempWidth.slice(0, -2))
                        break;
                    case 'y':
                        tempHeight = roundTo2(rect.height
                            + (event.clientY - startY)
                            * (verticalCenter ? 2 : 1)
                            * (startY > rect.y ? 1 : -1))
                            + 'px';
                        setHeight(tempHeight)
                        heightChange?.(tempHeight)
                        onResize?.(+tempHeight.slice(0, -2))
                        break;
                }
            };
            const endEventHandler = () => {
                window.removeEventListener('mousemove', moveEventHandler)
                window.removeEventListener('touchmove', moveEventHandler)
                window.removeEventListener('mouseup', endEventHandler)
                window.removeEventListener('touchend', endEventHandler)

                target.style.removeProperty('pointer-events')
                backdrop?.remove()
                setResizing(false)
                onResizeEnd?.()
            };

            window.addEventListener('mousemove', moveEventHandler, options)
            window.addEventListener('touchmove', moveEventHandler, options)
            window.addEventListener('mouseup', endEventHandler, options)
            window.addEventListener('touchend', endEventHandler, options)
            target.style.setProperty('pointer-events', 'none');
        }
    };

    return (
        <div className={clsx(cls`
                ${className} abs z:9 margin:auto
                bg:gray-30>svg@dark
                bg:gray-40:hover>svg@dark
                bg:gray-50:active>svg@dark
                bg:fade-76>svg
                bg:fade-80:hover>svg
                bg:fade-84:active>svg
                user-select:none
                p:10
                flex
                ~transform|.2s`,
            {
                'z:1040': resizing
            })}
            style={{ contain: 'content' }}
            onMouseDown={resize}
            onTouchStart={resize}>
            <svg className={cls`
                rounded
                ${direction === 'x' ? 'w:5 h:24' : 'w:24 h:5'}
                ${'~' + (direction === 'x' ? 'height' : 'width') + '|.2s'}`}>
            </svg>
        </div>
    )
}