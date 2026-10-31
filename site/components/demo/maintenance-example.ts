/** One authored panel shared by the Guide preview, portable source and verification. */
const maintenanceExample = {
  title: 'Independent roles in one panel',
  source: `@theme {
  --color-brand: light-dark(#4f46e5, #818cf8);
  --color-text-on-brand: light-dark(#ffffff, #18181b);
  --color-information: light-dark(#4f46e5, #c7d2fe);
}

@utility panel-stack(--gap <number>: 1) {
  display: flex;
  flex-direction: column;
  gap: calc(var(--gap) * 1rem);
}

@layer components {
  .card-region { container-type: inline-size; }
  .card { display: grid; gap: 1rem; }
  @container (width >= 30rem) {
    .card { grid-template-columns: 1fr 1fr; }
  }
  .button {
    padding: .625rem 1rem;
    background-color: var(--color-brand);
    color: var(--color-text-on-brand);
  }
  .button:focus-visible { outline: 2px solid var(--color-text-strong); outline-offset: 2px; }
  .button:disabled { opacity: .5; cursor: not-allowed; }
  .progress-fill {
    transform-origin: left;
    transform: scaleX(var(--progress, 0));
    transition: transform 150ms;
  }
  @media (prefers-reduced-motion: reduce) {
    .progress-fill { transition: none; }
  }
}

[data-theme='dark'] { --color-brand: #c4b5fd; color-scheme: dark; }`,
  html: `<section class="card-region p-lg r-lg bg-surface-raised">
  <article class="card">
    <div class="panel-stack(1.5)">
      <h2 class="m(0) fg-brand">Workspace</h2>
      <p class="fg-information">Your files stay available during updates.</p>
      <div class="flex flex-wrap gap-sm">
        <button class="button" type="button">Save</button>
        <button class="button" type="button" disabled>Saving</button>
      </div>
    </div>
    <div aria-hidden="true" class="grid items-center">
      <div class="(height:.5rem) bg-surface-inset">
        <div class="progress-fill (height:.5rem) bg-brand" style="--progress:.4"></div>
      </div>
    </div>
  </article>
</section>`,
  caption: 'Switch Theme to compare the color roles. The heading, action and progress fill share the brand color; information and action text have their own roles. The buttons demonstrate enabled and disabled states without saving data.',
  guide: '/guide/global-styles',
  theme: true,
}

export default maintenanceExample
