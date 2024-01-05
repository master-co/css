import clsx from 'clsx'
import Demo from 'websites/components/Demo'
import Code from 'websites/components/Code'

export default ({ className, ...props }: any) =>
    <>
        <Demo>
            <p {...props} className={clsx('font:20 font:medium m:0', className)}>
                Heavy boxes perform quick waltzes and jigs.
            </p>
        </Demo>
        <Code lang="html">{`<p class="**${className}**">Heavy boxes perform quick waltzes and jigs.</p>`}</Code>
    </>