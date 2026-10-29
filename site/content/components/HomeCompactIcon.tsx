import HomeIllustration, { type HomeIllustrationId } from './HomeIllustration'

export type HomeCompactIconId = Extract<HomeIllustrationId, `lint-${string}` | `mcp-${string}`>

/** The same themed glass artwork in list-sized slots; rendered on the server. */
export default function HomeCompactIcon({ icon }: { icon: HomeCompactIconId }) {
  return <HomeIllustration className="home-compact-icon" icon={icon} size={48} />
}
