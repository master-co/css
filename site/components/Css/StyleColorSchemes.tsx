import Link from "~/components/Link";
import ALink from '../ALink';
import CodeHTML2CSS from "../Code/CodeHTML2CSS";
import StyleEditor from "./StyleEditor";

const StyleColorSchemes = ({ name }: any) => {
    return (
        <>
            <h3 id="dark-mode-and-color-schemes">Dark mode and color schemes</h3>
            <CodeHTML2CSS>
                {`
                    <div class="${name}">...</div>
                `}
            </CodeHTML2CSS>
            <p>Master uses the selector <code>html.dark</code> to support color schemes. Now, you can easily fine-tune your style for
                the color schemes.</p>
            <p>To learn more, see the <ALink href="/docs/color-schemes">Color Schemes</ALink> documentation.</p>
        </>
    )
};

export default StyleColorSchemes;