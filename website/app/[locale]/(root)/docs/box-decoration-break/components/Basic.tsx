import Demo from 'websites/components/Demo'
import DemoPanel from 'websites/components/DemoPanel'
import Image from 'next/image'
import clsx from 'clsx'
import Code from 'websites/components/Code'

export default ({ className }: any) => {
    if (className === 'box-decoration:slice') {
        className += ' rbr:2x rtl:2x'
    }
    return (
        <>
            <Demo>
                <div className='flex:0'>
                    <span className={clsx(
                        className,
                        'fg:white font:32 font:extrabold gradient(90deg,#FAD961|0%,#F76B1C|100%) ls:-.25 px:3x'
                    )}>
                        Box Decoration Break
                    </span>
                </div>
            </Demo>
            <Code lang="html">{`<span class="**${className}**">Box Decoration Break</span>`}</Code>
        </>
    )
}