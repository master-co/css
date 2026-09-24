
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  flattenMasterCSSManifestVariables,
  type MasterCSSManifest
} from '@master/css-schema/manifest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import clsx from 'clsx'
import Portal from './Portal'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest
const variables = flattenMasterCSSManifestVariables(defaultManifest.variables)

const screenVariableValues = Object.fromEntries(variables.flatMap(({ namespace, key, value }) =>
  namespace === 'screen' && typeof value === 'number'
    ? [[key, value] as const]
    : []
)) as Record<string, number>

function roundTo2(num: number) {
  return Math.round(num * 100) / 100
}

export default function Resizable({
  showRuler,
  handlerStyle,
  children,
  rulerPlacement = 'top',
  ruleClassName = 'fixed',
  onResize,
  originX = 'left',
  originY = 'top',
  overlay = true,
  showHandler = [false, true],
  showHeight,
  viewports,
  onResizeEnd,
  onResizeStart,
  widthChange,
  heightChange,
  width,
  height,
  ...props
}: any) {
  const [currentWidth, setCurrentWidth] = useState(width)
  const [currentHeight, setCurrentHeight] = useState(height)
  const ref = useRef<HTMLDivElement>(null)
  const [resizing, setResizing] = useState(false)
  const [currentHandler, setCurrentHandler] = useState<string>('')
  const sortedBreakpoints: any[] = useMemo(() => {
    const newBreakpoints: any = (screenVariableValues || viewports)
    return Object.values(newBreakpoints)
      .map((eachNewBreakpointValue) => {
        const eachNewBreakpointName = Object.keys(newBreakpoints).find(key => newBreakpoints[key] === eachNewBreakpointValue)
        return {
          name: eachNewBreakpointName,
          value: eachNewBreakpointValue
        }
      })
      .sort((a: any, b: any) => {
        return b.value - a.value
      })
  }, [viewports])

  useMemo(() => {
    setCurrentWidth(width)
  }, [width])

  useMemo(() => {
    setCurrentHeight(height)
  }, [height])

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      onResize?.(rect.width, rect.height)
    }
  }, [onResize])

  useEffect(() => {
    const target = ref.current
    if (!resizing || !target) return
    const rect = target.getBoundingClientRect()
    let movingWidth = rect.width
    let movingHeight = rect.height
    const options = { passive: true }
    onResizeStart?.()
    const moveEventHandler = (event: MouseEvent) => {
      switch (currentHandler) {
        case 'left':
        case 'right':
          movingWidth += event.movementX
            * (originX === 'center' ? 2 : (originX === 'right' ? -1 : 1))
            * (currentHandler === 'left' ? -1 : 1)
          setCurrentWidth(movingWidth + 'px')
          widthChange?.(movingWidth + 'px')
          onResize?.(movingWidth)
          break
        case 'top':
        case 'bottom':
          movingHeight += event.movementY
            * (originY === 'center' ? 2 : (originY === 'bottom' ? -1 : 1))
            * (currentHandler === 'top' ? -1 : 1)
          setCurrentHeight(movingHeight + 'px')
          heightChange?.(movingHeight + 'px')
          onResize?.(movingHeight)
          break
      }
    }
    const endEventHandler = (event: any) => {
      setResizing(false)
      window.removeEventListener('mousemove', moveEventHandler)
      window.removeEventListener('mouseup', endEventHandler)
      window.removeEventListener('touchend', endEventHandler)
      window.removeEventListener('touchcancel', endEventHandler)
      onResizeEnd?.()
    }
    window.addEventListener('mousemove', moveEventHandler, options)
    window.addEventListener('mouseup', endEventHandler, options)
    window.addEventListener('touchend', endEventHandler, options)
    window.addEventListener('touchcancel', endEventHandler, options)
    return () => {
      endEventHandler(null)
    }
  }, [currentHandler, heightChange, onResize, onResizeEnd, onResizeStart, originX, originY, resizing, widthChange])

  return (
    <>
      {(resizing && showRuler || showRuler === 'always') &&
        <div className={clsx(
          ruleClassName,
          'left z:1070 flex items-center justify-center h:32px w:100% bb:1px|solid|var(--color-line-subtle) font-xs bg-surface-base text-strong',
          rulerPlacement + ':0'
        )}>
          {
            sortedBreakpoints.map((eachBreakpoint: any, i) => {
              const last = i === sortedBreakpoints.length - 1
              const width = +currentWidth?.replace('px', '')
              return (
                <div key={eachBreakpoint.name} className={clsx('abs bottom top flex items-center h:100% m:auto bx:1px|solid|var(--color-line-subtle)',
                  (eachBreakpoint.value - 0.02 >= width && (last || width >= sortedBreakpoints[i + 1]?.value))
                    ? 'bg-surface-base'
                    : 'text-disabled'
                )} style={{ width: eachBreakpoint.value }}>
                  <div className="abs left-xs">{eachBreakpoint.name}</div>
                  <div className="abs right-xs">{eachBreakpoint.name}</div>
                </div>
              )
            })
          }
          <div className="rel">{currentWidth?.replace('px', '')}{showHeight ? ' × ' + currentHeight?.replace('px', '') : ''}</div>
        </div>
      }
      <div ref={ref} {...props}
        className={clsx('rel flex flex-col flex:0|0|auto', props.className, {
          'z:1060 user-select:none resizing': resizing,
        })}
        style={{ width: currentWidth, height: currentHeight }}
      >
        <div className={clsx('contents', { 'untouchable': resizing })}>
          {children}
        </div>
        {!(showHandler !== true && showHandler === false
          || showHandler.length === 1 && showHandler[0] !== true
          || showHandler.length === 2 && showHandler[1] !== true
          || showHandler.length === 3 && showHandler[1] !== true
          || showHandler.length === 4 && showHandler[3] !== true) &&
          <Handler  {...props} resizing={resizing} setResizing={setResizing} handlerStyle={handlerStyle} setCurrentHandler={setCurrentHandler} overlay={overlay}
            className={clsx(
              'bottom left top items-center cursor:col-resize hidden@media((width<52.125rem))',
              {
                'transform:translateX(-100%) transform:translateX(-50%).active h:40px.active>svg': !handlerStyle,
                'transform:translateX(-50%)': handlerStyle === 'hidden'
              }
            )}
            currentHandler="left" />
        }
        {!(showHandler !== true && showHandler === false
          || showHandler.length === 1 && showHandler[0] !== true
          || showHandler.length === 2 && showHandler[1] !== true
          || showHandler.length === 3 && showHandler[1] !== true
          || showHandler.length === 4 && showHandler[1] !== true) &&
          <Handler {...props} resizing={resizing} setResizing={setResizing} handlerStyle={handlerStyle} setCurrentHandler={setCurrentHandler} overlay={overlay}
            className={clsx(
              'bottom right top items-center cursor:col-resize hidden@media((width<52.125rem))',
              {
                'transform:translateX(100%) transform:translateX(50%).active h:40px.active>svg': !handlerStyle,
                'transform:translateX(50%)': handlerStyle === 'hidden'
              }
            )}
            currentHandler="right" />
        }
        {!(showHandler !== true && showHandler === false
          || showHandler.length === 1 && showHandler[0] !== true
          || showHandler.length === 2 && showHandler[0] !== true
          || showHandler.length === 3 && showHandler[0] !== true
          || showHandler.length === 4 && showHandler[0] !== true) &&
          <Handler  {...props} resizing={resizing} setResizing={setResizing} handlerStyle={handlerStyle} setCurrentHandler={setCurrentHandler} overlay={overlay}
            className={clsx(
              'left right top justify-center cursor:row-resize',
              {
                'transform:translateY(-100%) transform:translateY(-50%).active w:40px.active>svg': !handlerStyle,
                'transform:translateY(-50%)': handlerStyle === 'hidden'
              },
            )}
            currentHandler="top" />
        }
        {!(showHandler !== true && showHandler === false
          || showHandler.length === 1 && showHandler[0] !== true
          || showHandler.length === 2 && showHandler[0] !== true
          || showHandler.length === 3 && showHandler[2] !== true
          || showHandler.length === 4 && showHandler[2] !== true) &&
          <Handler {...props} resizing={resizing} setResizing={setResizing} handlerStyle={handlerStyle} setCurrentHandler={setCurrentHandler} overlay={overlay}
            className={clsx(
              'bottom left right justify-center cursor:row-resize',
              {
                'transform:translateY(100%) w:2.5rem>svg transform:translateY(0%).active>svg transform:translateY(50%).active': !handlerStyle,
                'transform:translateY(50%)': handlerStyle === 'hidden'
              }
            )}
            currentHandler="bottom" />
        }
      </div>
      {resizing &&
        <Portal><div className={clsx('fixed left top z:1040 full animation:fade|.2s contain:strict', {
          'bg-black/.5': overlay // prevent mouse move into iframe
        })}></div></Portal>
      }
    </>
  )
}


const Handler = (({ className, currentHandler, resizing, handlerStyle, setResizing, setCurrentHandler, overlay }: any) => {
  const startResize = useCallback((event: any) => {
    setResizing(true)
    setCurrentHandler(currentHandler)
  }, [currentHandler, setCurrentHandler, setResizing])
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className={clsx(`${className} abs flex margin:auto user-drag:none user-select:none z:1020`,
      {
        'p:0.625rem transition:transform|.2s': !handlerStyle,
        'p-xs bg-line-subtle:hover': handlerStyle === 'hidden',
        'active': resizing
      }
    )}
      onMouseDown={startResize}
      onTouchStart={startResize}>
      {!handlerStyle &&
        <svg className={clsx(
          'rounded bg-line-subtle',
          {
            'bg-white!': overlay && resizing,
            'h:24px w:5px transition:transform|.2s,height|.2s': currentHandler === 'left' || currentHandler === 'right',
            'h:5px w:24px transition:transform|.2s,width|.2s': currentHandler === 'top' || currentHandler === 'bottom',
          }
        )}>
        </svg>
      }
    </div>
  )
})
