import clearCodeTokens from '~/utils/clearCodeTokens';

const DroppedCode = ({ p1, p2, target, t }: any) => {
    if (!p1 || !p2) {
        return (<></>)
    }
    p1 = clearCodeTokens(p1.trim())
    p2 = clearCodeTokens(p2.trim())
    if (target === 'class') {
        p1 = p1.replace(/.*class="(.*)".*/gm, '$1')
        p2 = p2.replace(/.*class="(.*)".*/gm, '$1')
    }
    return (
        <small className="f:green f:green-70@dark">↓ {
            Math.round(Math.abs((p1.length - p2.length) / p1.length) * 100)
        }% {t('code')}</small>
    )
}

export default DroppedCode;