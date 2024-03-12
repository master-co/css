import Features, { Feature } from 'websites/components/Features'
import { IconStatusChange, IconSettingsExclamation, IconArrowMerge, IconShieldCheck, IconPencilExclamation, IconFunction } from '@tabler/icons-react'
import Link from 'websites/components/Link'

export default () => (
    <Features className="grid-cols:3@sm my:14x">
        <Feature>
            <IconStatusChange className="app-icon-primary" />
            <div>
                <p><Link href="#consistent-class-order">Consistent class order</Link></p>
                <p className="text:16!">Enforce a consistent and logical order of classes</p>
            </div>
        </Feature>
        <Feature>
            <IconShieldCheck className="app-icon-primary" />
            <div>
                <p><Link href="#syntax-error-checks">Syntax error checks</Link></p>
                <p className="text:16!">Detect syntax errors early when writing classes</p>
            </div>
        </Feature>
        <Feature>
            <IconSettingsExclamation className="app-icon-primary" />
            <div>
                <p><Link href="#disallow-unknown-classes">Disallow unknown classes</Link></p>
                <p className="text:16!">Enforce the use of Master CSS syntax to apply styles</p>
            </div>
        </Feature>
        <Feature>
            <IconPencilExclamation className="app-icon-primary" />
            <div>
                <p><Link href="#class-collision-detection">Class collision detection</Link></p>
                <p className="text:16!">Avoid applying classes with the same CSS declaration</p>
            </div>
        </Feature>
        <Feature>
            <IconFunction className="app-icon-primary" />
            <div>
                <p><Link href="#supports-js-utilities">Supports JS utilities</Link></p>
                <p className="text:16!">Check the classes in popular utility arguments</p>
            </div>
        </Feature>
    </Features>
)