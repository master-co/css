import clsx from 'clsx';
import clearCodeTokens from '~/utils/clearCodeTokens';

const Demo = ({ html, className, children }: any) => {
    if (html) {
        html = clearCodeTokens(html)
    }
    return (
        <div className={clsx('demo', className)} dangerouslySetInnerHTML={html ? { __html: html } : undefined}>
            {children}
        </div>
    )
};

export default Demo;