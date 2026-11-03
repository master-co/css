import { runStyleAudit } from '@master/internal-site/build/style-delivery.mjs'
await runStyleAudit(process.argv.slice(2))
