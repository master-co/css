import project from '~/project';
import Footer from 'shared/components/Footer'

export default async function DocFooter(props: any) {
    {/* @ts-expect-error server component */ }
    return <Footer {...props} projectId={project.id} />
}