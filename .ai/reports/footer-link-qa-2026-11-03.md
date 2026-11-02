# Footer external-link QA — 2026-11-03

The user requested raised arrow indicators on footer links that open a new tab.
Shared FooterLink renders the same 10px Tabler arrow in both homepage and document
footers, inside the label so inline and flex links use the same raised alignment.
Internal links and disabled buttons have no indicator; existing targets and
accessible names are preserved. Both product sites consume the shared component.

Released: @master/internal-site@0.1.2 and @master/internal-skills@0.1.1, via
Master GitHub OIDC run 41546824445 from source 7092431. CSS now pins registry
versions, with no temporary archive dependency; skills were explicitly synchronized.

Validation: Svelte MCP autofixer returns no issues/suggestions for all three
changed/new components. Shared Astro/Svelte checks pass. Master builds 50 pages
and passes the 50-page/158-stylesheet/2567-URL static audit. CSS packed consumer
builds 153 pages; site lint, Astro/Svelte/TypeScript and 85 public-asset checks pass.
The 40-case browser suite passes across both sites, homepage/document templates,
four widths and light/dark themes. Every new-tab footer link has one raised,
aria-hidden marker; internal links have none. Header and TOC assertions still pass.
The light footer screenshot was visually inspected at native size.

CSS contract comparison: project manifest and 153 route keys are unchanged;
standalone examples are byte-identical. Only two new .ui-footer-link-mark rules
are added; no existing segments are removed.

Packed archive integrity: sha512-7sT9Lr/GsU2TZx1wAb/zgBCeAaRYJOayWy/9lQM1UM0/cXFSAoXeR+ea7lXEU0/dlF9uF3sGb5Tis64vC12aZg==

Hosted preview verification repeats all 40 cases successfully at
https://0cebf583.master-co.pages.dev and
https://28273b78.master-css-e8w.pages.dev . The narrow dark homepage footer
was also visually inspected. Source is committed in Master as e3f4546;
the preview checkpoint preceded the completed OIDC release recorded above.

Final registry consumer verification: 153 pages, 85 assets, Astro/Svelte/TypeScript,
site lint, skills check and AI-context budget all pass. CSS contract verification
covers 78 deduplicated contracts / 2,214 exact segments. A route-by-route diff
confirms 148 shell routes add only the marker class, two CSS rules and their layer
wrapper (+218 CSS bytes / +22 hydration bytes). Existing segments retain their
order; resource ordering and the five standalone routes are unchanged. The large
JSON diff comes from changed content-addressed contract keys and sorted entries.

The public Master deployment is b6591bba (source 7092431), verified through
master.co with 113 hosted checks and 40 browser cases. CSS production remains
0c6f695e; this consumer update is local-only under the user's deployment hold.
