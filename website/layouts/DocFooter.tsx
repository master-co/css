import project from '~/project';
import Footer from 'websites-shared/components/Footer'

export default async function DocFooter(props: any) {
    {/* @ts-expect-error server component */ }
    return <Footer {...props} projectId="css" />
}