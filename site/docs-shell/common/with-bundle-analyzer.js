import BundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = BundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })

export default withBundleAnalyzer