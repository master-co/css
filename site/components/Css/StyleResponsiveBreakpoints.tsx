import Link from "~/components/Link";
import ALink from '../ALink';
import CodeHTML2CSS from "../Code/CodeHTML2CSS";
import StyleEditor from "./StyleEditor";

const StyleResponsiveBreakpoints = ({ name }: any) => {
    return (
        <>
            <h3 id="responsive-breakpoints">Responsive breakpoints</h3>
            <CodeHTML2CSS>
                {`
                    <div class="${name}">...</div>
                `}
            </CodeHTML2CSS>
            <p>Responsive breakpoints can be applied to all styles. Some available breakpoints are <code>3xs</code>, <code>2xs</code>, <code>xs</code>, <code>sm</code>,
                <code>md</code>, <code>lg</code>, <code>xl</code>, <code>2xl</code>, <code>3xl</code>, <code>4xl</code>. Arbitrary breakpoints can be specified through comparison
                operators <code>&gt;</code>, <code>&gt;=</code>, <code>&lt;</code>, <code>&lt;=</code>.
            </p>
            <p>To learn more, see the <ALink href="/docs/breakpoints">Breakpoints</ALink> documentation.</p>
        </>
    )
};

export default StyleResponsiveBreakpoints;