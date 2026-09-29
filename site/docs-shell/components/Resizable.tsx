
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

const screenVariableValues = Object.fromEntries(variables.flatMap(({ namespace, key, numeric }) =>
  namespace === 'screen' && numeric
    ? [[key, numeric.value] as const]
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
  ruleClassName = 'position:fixed',
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
          'left:0 z-index:1070 display:flex align-items:center justify-content:center height:32px width:100% border-bottom:1px|solid|var(--color-line-subtle) font-xs bg-surface-base fg-text-strong',
          rulerPlacement + ':0'
        )}>
          {
            sortedBreakpoints.map((eachBreakpoint: any, i) => {
              const last = i === sortedBreakpoints.length - 1
              const width = +currentWidth?.replace('px', '')
              return (
                <div key={eachBreakpoint.name} className={clsx('position:absolute bottom:0 top:0 display:flex align-items:center height:100% margin:auto border-inline:1px|solid|var(--color-line-subtle)',
                  (eachBreakpoint.value - 0.02 >= width && (last || width >= sortedBreakpoints[i + 1]?.value))
                    ? 'bg-surface-base'
                    : 'fg-text-muted'
                )} style={{ width: eachBreakpoint.value }}>
                  <div className="position:absolute left-xs">{eachBreakpoint.name}</div>
                  <div className="position:absolute right-xs">{eachBreakpoint.name}</div>
                </div>
              )
            })
          }
          <div className="position:relative">{currentWidth?.replace('px', '')}{showHeight ? ' × ' + currentHeight?.replace('px', '') : ''}</div>
        </div>
      }
      <div ref={ref} {...props}
        className={clsx('position:relative display:flex flex:0|0|auto flex-direction:column', props.className, {
          'z-index:1060 user-select:none resizing': resizing,
        })}
        style={{ width: currentWidth, height: currentHeight }}
      >
        <div className={clsx('display:contents', { 'pointer-events:none': resizing })}>
          {children}
        </div>
        {!(showHandler !== true && showHandler === false
          || showHandler.length === 1 && showHandler[0] !== true
          || showHandler.length === 2 && showHandler[1] !== true
          || showHandler.length === 3 && showHandler[1] !== true
          || showHandler.length === 4 && showHandler[3] !== true) &&
          <Handler  {...props} resizing={resizing} setResizing={setResizing} handlerStyle={handlerStyle} setCurrentHandler={setCurrentHandler} overlay={overlay}
            className={clsx(
              'bottom:0 left:0 top:0 align-items:center cursor:col-resize display:none@media((width<52.125rem))',
              {
                'transform:translateX(-100%) height:40px.active>svg transform:translateX(-50%).active': !handlerStyle,
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
              'bottom:0 right:0 top:0 align-items:center cursor:col-resize display:none@media((width<52.125rem))',
              {
                'transform:translateX(100%) height:40px.active>svg transform:translateX(50%).active': !handlerStyle,
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
              'left:0 right:0 top:0 justify-content:center cursor:row-resize',
              {
                'transform:translateY(-100%) width:40px.active>svg transform:translateY(-50%).active': !handlerStyle,
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
              'bottom:0 left:0 right:0 justify-content:center cursor:row-resize',
              {
                'transform:translateY(100%) width:2.5rem>svg transform:translateY(0%).active>svg transform:translateY(50%).active': !handlerStyle,
                'transform:translateY(50%)': handlerStyle === 'hidden'
              }
            )}
            currentHandler="bottom" />
        }
      </div>
      {resizing &&
        <Portal><div className={clsx('position:fixed left:0 top:0 z-index:1040 height:100% width:100% animation:fade|.2s contain:strict', {
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
    <div className={clsx(`${className} position:absolute display:flex margin:auto user-drag:none user-select:none z-index:1020`,
      {
        'padding:0.625rem transition:transform|.2s': !handlerStyle,
        'p-xs bg-line-subtle:hover': handlerStyle === 'hidden',
        'active': resizing
      }
    )}
      onMouseDown={startResize}
      onTouchStart={startResize}>
      {!handlerStyle &&
        <svg className={clsx(
          'border-radius:1e9em bg-line-subtle',
          {
            'bg-white!': overlay && resizing,
            'height:24px width:5px transition:transform|.2s,height|.2s': currentHandler === 'left' || currentHandler === 'right',
            'height:5px width:24px transition:transform|.2s,width|.2s': currentHandler === 'top' || currentHandler === 'bottom',
          }
        )}>
        </svg>
      }
    </div>
  )
})
