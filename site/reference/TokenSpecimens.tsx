import FoundationTokens from '../components/demo/foundations/FoundationTokens'

/** Each subject uses the same specimens as Guide, with the complete preset selection. */
export default function TokenSpecimens({ namespace }: { namespace: string }) {
  return <section aria-labelledby="specimens"><FoundationTokens namespace={namespace} /></section>
}
