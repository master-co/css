import Resizer from './Resizer';
import BrowserHeader from './BrowserHeader';
import { useRef } from 'react';

export default function IFrame(props: any) {
    let { resize, onResize, onResizeStart, onResizeEnd, className, src, showHeight } = props;

    if (resize === undefined) {
        resize = true;
    }

    const iframeRef = useRef<HTMLIFrameElement>(null)
    const Container = resize ? Resizer : () => <div />;

    let newSrc: string = src

    return (
        <Container className="mt:1.125em mt:10+.code" onResize={onResize} onResizeStart={onResizeStart} onResizeEnd={onResizeEnd} showHeight={showHeight}>
            <div className="demo p:0! m:0">
                <BrowserHeader url={newSrc} />
                <iframe className={className} src={newSrc} ref={iframeRef} loading="lazy" width="100%"></iframe>
            </div>
        </Container>
    )
}