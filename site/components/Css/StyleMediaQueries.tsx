import StyleEditor from './StyleEditor';
import Link from '~/components/Link';
import ALink from '../ALink';
import CodeHTML2CSS from '../Code/CodeHTML2CSS';

const StyleMediaQueries = ({ name }: any) => {
    return (
        <>
            <h3 id="print-format-and-media-queries">Print format and media queries</h3>
            <CodeHTML2CSS>
                {`
                    <div class="${name}">...</div>
                `}
            </CodeHTML2CSS>
            <p>Master supports media types like <code>print</code>, <code>screen</code>, <code>speech</code>, <code>all</code>, and
                other media queries.
            </p>
            <p>To learn more, see the <ALink href="/docs/media-queries">Media Queries</ALink> documentation.</p>
        </>
    )
};

export default StyleMediaQueries;