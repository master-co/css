import SyntaxTable from '~/components/SyntaxTable'
import syntaxes from '../syntaxes'
import clsx from 'clsx'
import SyntaxTr from '~/components/SyntaxTr'
import SyntaxPreview from './SyntaxPreview'
import { IconArrowBarBoth, IconArrowBarDown, IconArrowBarLeft, IconArrowBarRight, IconArrowBarUp, IconArrowDownBar, IconArrowDownLeft, IconArrowDownRight, IconArrowLeftBar, IconArrowRightBar, IconArrowUpBar, IconArrowUpLeft, IconArrowUpRight, IconArrowsDiagonal, IconArrowsDiagonal2, IconArrowsHorizontal, IconArrowsMove, IconArrowsVertical, IconArticle, IconCursorText, IconHandFinger, IconHandGrab, IconHandStop, IconLoader, IconPlus, IconPointer, IconPointerCancel, IconPointerPlus, IconPointerQuestion, IconShare3, IconZoomIn, IconZoomOut } from '@tabler/icons-react'

export default () => {
    const previewSyntax = 'cursor:pointer'
    return (
        <>
            <SyntaxTable>
                {syntaxes.map((syntax) =>
                    <SyntaxTr value={syntax} key={syntax} previewSyntax={previewSyntax}>
                        {typeof syntax === 'string' && {
                            'cursor:pointer': <IconHandFinger className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:text': <IconCursorText className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:vertical-text': <IconCursorText className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle rotate(90)', syntax)} />,
                            'cursor:zoom-in': <IconZoomIn className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:zoom-out': <IconZoomOut className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:help': <IconPointerQuestion className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:not-allowed': <IconPointerQuestion className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:no-drop': <IconPointerQuestion className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:cancel': <IconPointerCancel className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:cell': <IconPlus className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:crosshair': <IconPlus className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:copy': <IconPointerPlus className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:context-menu': <IconArticle className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:col-resize': <IconArrowBarBoth className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:row-resize': <IconArrowBarBoth className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle rotate(90)', syntax)} />,
                            'cursor:n-resize': <IconArrowUpBar className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:e-resize': <IconArrowRightBar className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:s-resize': <IconArrowDownBar className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:w-resize': <IconArrowLeftBar className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:ne-resize': <IconArrowUpRight className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:nw-resize': <IconArrowUpLeft className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:se-resize': <IconArrowDownRight className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:sw-resize': <IconArrowDownLeft className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:ew-resize': <IconArrowsHorizontal className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:ns-resize': <IconArrowsVertical className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:nesw-resize': <IconArrowsHorizontal className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle rotate(-45)', syntax)} />,
                            'cursor:nwse-resize': <IconArrowsHorizontal className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle rotate(45)', syntax)} />,
                            'cursor:grab': <IconHandStop className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:grabbing': <IconHandGrab className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:wait': <IconLoader className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:progress': <IconLoader className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:default': <IconPointer className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:auto': <IconPointer className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:alias': <IconShare3 className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:move': <IconArrowsMove className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,
                            'cursor:all-scroll': <IconArrowsMove className={clsx('inline-block mr:2x size:1.25em stroke:1.5 v:middle', syntax)} />,

                        }[syntax]}
                    </SyntaxTr>)
                }
            </SyntaxTable>
            <SyntaxPreview className={previewSyntax} />
        </>
    )
}