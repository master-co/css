import type { NextPage } from 'next'
import Doc, { DocProps } from './Doc';
import uiContents from '~/contents/uiContents';
import formsContents from '~/contents/formsContents';

const FormsDoc: NextPage<DocProps> = (props) => {
    return (
        <Doc {...props}
            version="1.0"
            contents={formsContents}
            seriesContents={uiContents}
            suffix={props.suffix === false ? '' : (props.suffix || 'Master Forms')}
            series="UI"
            name="forms"
            showThemeToggle={true}>
            {props.children}
        </Doc>
    )
}

export default FormsDoc
