import type { ComponentProps } from 'react'
import Layout from '~/site/layouts/doc'
import dictionaries from '~/site/dictionaries'
import { createTranslation } from '~/site/docs-shell/utils/i18n'
import Tabs, { Tab } from '~/site/docs-shell/components/Tabs'
import metadata from '../metadata'

/** Keep the installation header and tabs shared while each article supplies its own contents rail. */
export default async function InstallationLayout(props: ComponentProps<typeof Layout>) {
  const $ = await createTranslation(props.params.locale, dictionaries)
  return <Layout {...props} metadata={metadata} subtitle={props.subtitle ?? 'Start with static CSS; choose runtime or progressive rendering when your application needs it.'}>
    <Tabs className="mb-xs">
      <Tab href="/guide/installation">{$('Quick Start')}</Tab>
      <Tab href="/guide/installation/integrations">{$('Integrations')}</Tab>
      <Tab href="/guide/installation/cdn">{$('CDN')}</Tab>
      <Tab href="/guide/installation/cli">{$('CLI')}</Tab>
    </Tabs>
    {props.children}
  </Layout>
}
