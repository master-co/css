export const agentStyleExample = {
  title: 'Reuse a project button',
  source: `@theme {
  --color-brand: var(--color-blue-60);
}

@components {
  btn {
    @compose inline-flex items-center justify-center;
    @compose h:10x px:md r:sm font:sm font:medium;
    @compose fg:white bg:brand cursor:pointer;
    @compose bg:blue-70:hover;
    @compose outline:2px|solid|blue-60:focus-visible;
    @compose outline-offset:3px:focus-visible;
    @compose opacity:.5:disabled cursor:not-allowed:disabled;
  }
}`,
  html: `<div class="flex flex-wrap gap:md">
  <button type="button" class="btn">Save changes</button>
  <button type="button" class="btn" disabled>Saving…</button>
</div>`,
  caption: 'The same btn class provides hover, keyboard focus, and native disabled states. These buttons demonstrate styling; they do not save data.'
}
