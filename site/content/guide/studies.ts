/** Shared lessons for the authored Guide figures; light and dark are one figure. */
export const guideStudies = {
  "pipes-and-quotes": {
    "title": "A pipe changes meaning inside quotes",
    "alt": "Two literal inputs map to outputs. rgb(30|60|90) becomes rgb(30 60 90); the quoted string New|collection retains its pipe.",
    "caption": "Whitespace decoding applies outside quoted strings. The output string is still one literal value.",
    "labels": [
      "Outside quotes",
      "rgb(30|60|90)",
      "rgb(30 60 90)",
      "Inside quotes",
      "'New|collection'",
      "'New|collection'"
    ],
    "kind": "pairs"
  },
  "conditions-intersection": {
    "title": "Both conditions must match",
    "alt": "A two-by-two matrix highlights only the intersection where the viewport matches sm and display:grid is supported.",
    "caption": "For grid@sm@supports(display:grid), neither condition alone enables the declaration.",
    "labels": [
      "Viewport",
      "Below sm",
      "At sm or wider",
      "Grid supported",
      "No",
      "Yes",
      "grid@sm@supports(display:grid)"
    ],
    "kind": "matrix"
  },
  "inherited-alias": {
    "title": "An inherited alias keeps its computed value",
    "alt": "The root resolves an action alias to blue. A child changes brand to plum: the inherited alias remains blue until it is redeclared in that child.",
    "caption": "The blue and violet marks identify the two value paths. This is a scope diagram, not an extra theme switch.",
    "labels": [
      "Root",
      "brand \u2192 blue",
      "action \u2192 brand \u2192 blue",
      "Child",
      "brand \u2192 plum",
      "Inherited action \u2192 blue",
      "Rebound action \u2192 plum"
    ],
    "kind": "scope"
  },
  "delivery-substitution": {
    "title": "Choose retention and substitution independently",
    "alt": "Two perpendicular axes separate keeping a token without a consumer from substituting its value into generated declarations.",
    "caption": "static controls retention; inline controls substitution. Using one does not imply the other.",
    "labels": [
      "Keep unused token",
      "Ordinary",
      "static",
      "Substitute value",
      "No",
      "inline",
      "@theme modifiers"
    ],
    "kind": "matrix"
  },
  "reuse-ownership": {
    "title": "A utility owns a class; a mixin fills a selector",
    "alt": "A requested stack utility emits .stack with display:grid. Applying the --stack mixin inside .card emits the same declaration under .card; the caller owns that selector.",
    "caption": "The boxes are CSS artifacts. An @apply expansion does not register another markup class.",
    "labels": [
      "@utility stack",
      "class=\"stack\"",
      ".stack { display: grid; }",
      "@mixin --stack",
      ".card { @apply --stack; }",
      ".card { display: grid; }"
    ],
    "kind": "pairs"
  },
  "independent-parameters": {
    "title": "One definition, separate call values",
    "alt": "The same action-size utility is called with its 2.5rem default and with 3rem. The second control has more minimum height and horizontal padding, while both keep their own argument.",
    "caption": "At a 16px root size, the minimum heights are 40px and 48px; padding-inline is half the selected height. The highlighted insets are measurement guides.",
    "labels": [
      "action-size()",
      "action-size(3rem)",
      "--height: 2.5rem",
      "--height: 3rem",
      "One utility \u00b7 independent arguments",
      "Action"
    ],
    "kind": "parameters"
  },
  "local-color-scheme": {
    "title": "The nearest color scheme selects the paint",
    "alt": "A light document encloses a dark region. The same semantic token paints a light surface outside and a dark surface inside the region.",
    "caption": "The nested boundary represents color-scheme. Token names and markup stay unchanged.",
    "labels": [
      "Document \u00b7 light",
      "bg-surface-base",
      "Region \u00b7 dark",
      "bg-surface-base",
      "One token \u00b7 two local schemes"
    ],
    "kind": "scheme"
  },
  "palette-or-role": {
    "title": "Separate a fixed hue step from a semantic role",
    "alt": "Two paths separate a fixed palette step from a role that chooses light or dark values.",
    "caption": "Choose a palette step for a specific paint and a role for a decision that follows its context.",
    "labels": [
      "Specific paint",
      "bg-blue-60",
      "One palette step",
      "Semantic decision",
      "bg-surface-base",
      "Scheme-selected surface"
    ],
    "kind": "pairs"
  },
  "width-cap-growth": {
    "title": "A width cap leaves room for smaller parents",
    "alt": "Two parents contain the same capped content box. The smaller parent constrains it; the larger parent leaves free space around a box at its maximum width.",
    "caption": "The cap is a maximum, not a fixed width. Drawn widths share one scale; the labels describe the constraint rather than viewport pixels.",
    "labels": [
      "Smaller parent",
      "Larger parent",
      "w-full max-w-sm",
      "Parent limits width",
      "Cap limits width"
    ],
    "kind": "width"
  },
  "grid-long-content": {
    "title": "A shrinking track still needs wrapping text",
    "alt": "Two equal grid tracks compare a short label with a long wrapping label. The second row grows while track boundaries stay aligned.",
    "caption": "minmax(0,1fr) lets the track shrink; text still needs an appropriate wrapping policy. Heights follow the content.",
    "labels": [
      "Same track widths",
      "Short label",
      "Release notes",
      "Longer content",
      "A longer release note that wraps inside the same column",
      "minmax(0, 1fr) \u00b7 wrap-anywhere"
    ],
    "kind": "content"
  },
  "type-content-height": {
    "title": "Keep the text measure, let the height grow",
    "alt": "Two equal-width text specimens contain short and long text. The longer heading takes more lines and pushes the following content down.",
    "caption": "The width is controlled for comparison. Neither text box has a fixed height; the content establishes the vertical extent.",
    "labels": [
      "Same available width",
      "Field notes",
      "Field notes for a longer release announcement",
      "Next paragraph",
      "Height follows the lines"
    ],
    "kind": "content"
  },
  "named-container-target": {
    "title": "A named query can reach past a nearer container",
    "alt": "Nested article and card container boundaries enclose one child. Matching blue marks pair the child\u2019s article query with the outer named article boundary; the nearer card boundary remains violet.",
    "caption": "The name selects the eligible ancestor. Keep the queried element inside that ancestor; a container does not query itself.",
    "labels": [
      "article \u00b7 named container",
      "card \u00b7 nearer container",
      "Child",
      "@container(article|width>=48rem)",
      "Query the named ancestor"
    ],
    "kind": "nested"
  },
  "responsive-local-change": {
    "title": "Change the layout without restating the surface",
    "alt": "Two cards share surface, radius and text. Only their layout changes from stacked to a row when the parent crosses the threshold.",
    "caption": "A conditional layout class leaves unrelated declarations in place. This schematic omits nonessential card content.",
    "labels": [
      "Below threshold",
      "At threshold",
      "Title",
      "Open",
      "Same surface \u00b7 same content",
      "Only layout changes"
    ],
    "kind": "layout"
  },
  "unlayered-obstacle": {
    "title": "An unlayered rule sits above normal layered rules",
    "alt": "An ordered stack puts components before utilities, then separates an unlayered rule above both. The winning padding belongs to that unlayered rule.",
    "caption": "This compares normal author declarations. Important declarations have different layer precedence.",
    "labels": [
      "components \u00b7 padding: 24px",
      "utilities \u00b7 padding: 12px",
      "unlayered \u00b7 padding: 24px",
      "Normal declaration priority",
      "Winning padding"
    ],
    "kind": "stack"
  },
  "defaults-inheritance": {
    "title": "Document defaults flow down the DOM",
    "alt": "A body default supplies text to two descendants; a local code font overrides the family only inside the code element.",
    "caption": "Inheritance follows the document tree. Local declarations replace only the properties they set.",
    "labels": [
      "body",
      "Shared text defaults",
      "Paragraph",
      "Inherited family",
      "code",
      "Local monospace family"
    ],
    "kind": "tree"
  },
  "delivery-not-scope": {
    "title": "Loading a route stylesheet does not scope its selector",
    "alt": "A route file loads a .note rule. The document contains matching .note elements in two regions, both highlighted.",
    "caption": "The import controls when CSS is delivered. Native class selectors can match throughout the document after loading.",
    "labels": [
      "home.css",
      ".note { \u2026 }",
      "Document",
      "Home .note",
      "Other .note",
      "Both match the loaded selector"
    ],
    "kind": "tree"
  },
  "stable-dynamic-value": {
    "title": "Change a variable while keeping the rule stable",
    "alt": "The same font-size class appears above two headings. Changing --headline-size from 2rem to 3rem enlarges the second heading without introducing another class.",
    "caption": "The browser resolves the updated custom property. A static stylesheet already contains the complete rule.",
    "labels": [
      "(font-size:var(--headline-size))",
      "--headline-size: 2rem",
      "--headline-size: 3rem",
      "Launch notes",
      "One class \u00b7 one generated rule"
    ],
    "kind": "font"
  },
  "source-and-policy": {
    "title": "Discovery and retention answer different questions",
    "alt": "A source file first supplies a complete class candidate. A separate policy gate determines whether that candidate remains; a missing source cannot supply its class.",
    "caption": "Inspect source inclusion before class policy. The diagram does not imply that class strings are evaluated as JavaScript.",
    "labels": [
      "Source file",
      "Complete class",
      "Candidate policy",
      "Allowed candidate",
      "Generated rule",
      "Selected source"
    ],
    "kind": "flow"
  },
  "static-late-class": {
    "title": "A late class cannot extend a static stylesheet",
    "alt": "A static build sees p-md and emits its rule. A later browser change introduces p-lg, which has no rule in that output.",
    "caption": "This example assumes p-lg was absent from all build inputs and safelists. Dynamic values can use custom properties without changing classes.",
    "labels": [
      "Build",
      "p-md",
      "CSS for p-md",
      "Browser later",
      "p-lg",
      "No new rule in static CSS"
    ],
    "kind": "pairs"
  },
  "progressive-known-class": {
    "title": "A known class reuses delivered CSS",
    "alt": "A browser has CSS and a valid page manifest. A known connected class follows the existing CSS path; a class outside the manifest branches to deferred engine loading.",
    "caption": "This is the default progressive handoff with valid pre-rendered artifacts. It is not a performance timeline.",
    "labels": [
      "Connected class",
      "In page manifest",
      "Use delivered CSS",
      "Outside manifest",
      "Load engine/program",
      "Default progressive startup"
    ],
    "kind": "branch"
  },
  "installation-observation": {
    "title": "Verify the whole path with one small edit",
    "alt": "A source edit changes p-md to p-lg, the compiled padding changes, and the browser box visibly grows.",
    "caption": "A successful install is only the first step. Changing the class checks discovery, generation and stylesheet delivery together.",
    "labels": [
      "Edit source",
      "p-md \u2192 p-lg",
      "Build or dev integration",
      "Changed CSS",
      "Browser padding grows",
      "Observe the result"
    ],
    "kind": "flow"
  },
  "fallback-addition": {
    "title": "An enhancement starts from a working fallback",
    "alt": "Both branches start from one baseline. Unsupported browsers keep it; supporting browsers add the conditional enhancement.",
    "caption": "@supports controls the enhancement. The fallback remains a normal declaration outside that condition.",
    "labels": [
      "Working fallback",
      "Feature unsupported",
      "Keep baseline",
      "Feature supported",
      "Add enhancement",
      "One usable starting point"
    ],
    "kind": "branch"
  },
  "migration-local-scope": {
    "title": "Move one component boundary at a time",
    "alt": "Three neighboring components remain visible while only the middle component changes styling ownership.",
    "caption": "Keep the same user-facing behavior while migrating one bounded component. Verify shared resets and tokens separately.",
    "labels": [
      "Before",
      "After",
      "Header",
      "Card",
      "Footer",
      "Migrate this component"
    ],
    "kind": "migration"
  },
  "shared-source-inputs": {
    "title": "Shared CSS and shared markup are separate inputs",
    "alt": "A CSS definition file and a component source file enter the consuming app through separate import and source-selection paths.",
    "caption": "A shared CSS import does not automatically select every sibling component file for scanning.",
    "labels": [
      "shared.css",
      "Definitions",
      "packages/ui/Button.tsx",
      "Class strings",
      "Consuming app",
      "Import graph + source selection"
    ],
    "kind": "fork"
  },
  "consumer-override": {
    "title": "Override the value, keep the component",
    "alt": "The package and application share one .btn definition. The application changes --spacing-action-x, increasing horizontal padding while keeping the button identity.",
    "caption": "The consumer override follows the package import. The inset guides compare 1rem and 1.5rem at a 16px root; the .btn rule stays shared.",
    "labels": [
      "Package default",
      "Consumer override",
      ".btn",
      "Action",
      "Shared component \u00b7 changed public token"
    ],
    "kind": "padding"
  },
  "editor-build-boundary": {
    "title": "An editor preview does not deliver a stylesheet",
    "alt": "One source class has two branches: the language service shows generated CSS to the author, while the integration delivers CSS to the browser.",
    "caption": "Completion and hover verify authoring context. Verify the actual page through its build and browser as well.",
    "labels": [
      "Source class",
      "Language service",
      "Hover preview",
      "Build integration",
      "Browser stylesheet",
      "Different outputs from the same source"
    ],
    "kind": "branch"
  },
  "lint-ownership": {
    "title": "A conflict needs a design choice",
    "alt": "A sortable class list has a reversible reordered output. Two conflicting padding classes instead branch to the two possible intended values.",
    "caption": "Sorting cannot decide which spacing the design needs. Resolve the competing declaration deliberately.",
    "labels": [
      "p-md p-lg",
      "Keep p-md",
      "1rem padding",
      "Keep p-lg",
      "1.5rem padding",
      "Choose one intended base padding"
    ],
    "kind": "branch"
  },
  "inspection-coverage": {
    "title": "A checked set is smaller than the whole project",
    "alt": "A project boundary contains three sources; a bracket encloses only the two inspected sources and leaves the third outside.",
    "caption": "Report checked files and context explicitly. A clean result for a subset is not evidence about every source.",
    "labels": [
      "Project",
      "Checked files",
      "Card.tsx",
      "Button.tsx",
      "Other.tsx",
      "Unchecked source"
    ],
    "kind": "coverage"
  },
  "language-and-delivery": {
    "title": "The class vocabulary survives a delivery choice",
    "alt": "One class and its declaration sit above two delivery paths: build-generated stylesheet and browser-generated stylesheet.",
    "caption": "The syntax answers what style is requested. Rendering mode answers when and where its CSS is generated.",
    "labels": [
      "p-md",
      "padding: var(--spacing-md)",
      "Build",
      "Stylesheet",
      "Browser runtime",
      "Stylesheet"
    ],
    "kind": "fork"
  }
} as const
export type GuideStudyId = keyof typeof guideStudies
export function guideStudyMarkdown(id: string) {
  const study = guideStudies[id as GuideStudyId]
  if (!study) throw new Error(`Unknown Guide study: ${id}`)
  return `**${study.title}**\n\n${study.alt}\n\n${study.caption}`
}
