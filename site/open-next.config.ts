import { defineCloudflareConfig } from '@opennextjs/cloudflare'

export default {
    ...defineCloudflareConfig(),
    buildCommand: 'pnpm build:cloudflare-next'
}
