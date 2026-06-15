import i18n from '~/internal/common/i18n.config.mjs';
import DocHeader from '~/internal/components/DocHeader';
import Body from '~/internal/layouts/body';

export const dynamic = 'force-static';
export const revalidate = false;

export async function generateStaticParams() {
    return i18n.locales.map((locale: any) => ({ locale }));
}

export default function Page() {
    return (
        <Body className="bg:cover bg:linear-gradient(ground,base|100vh,base) bg:no-repeat">
            <DocHeader stickable />
        </Body>
    );
}

export const metadata = {
    title: 'Master CSS - The CSS language and framework',
    description: 'The CSS language and framework for rapidly building modern and high-performance websites.'
}
