export const agentStyleExample = {
  title: 'Reuse a project button',
  source: `@theme {
  --color-brand: var(--color-blue-60);
}

@layer components {
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 2.5rem;
    padding-inline: var(--spacing-md);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: white;
    background: var(--color-brand);
    cursor: pointer;
    &:hover { background: var(--color-blue-70); }
    &:focus-visible { outline: 2px solid var(--color-blue-60); outline-offset: 3px; }
    &:disabled { opacity: .5; cursor: not-allowed; }
  }
}`,
  html: `<div class="flex flex-wrap gap-md">
  <button type="button" class="btn">Save changes</button>
  <button type="button" class="btn" disabled>Saving…</button>
</div>`,
  caption: 'The same btn class provides hover, keyboard focus, and native disabled states. These buttons demonstrate styling; they do not save data.'
}
