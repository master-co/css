<!-- Behavior fixtures for native CSS pruning tests. The public contract lives in content/guide/directives/contract.mdx (Native CSS preservation). -->

## Root scope
Pruning activation belongs to each source file. Once enabled, filtering uses the importing root’s usage scope. The same opted-in shared source can therefore retain different classes under different roots.

<DeliveryFlow name="pruning-scope" />

```css name=app/a/a.css
@prune native;
@import "@master/css";
@source "./page.html";
@import "../shared.css";

.a-page {
  color: red;
}
```

```css name=app/b/b.css
@prune native;
@import "@master/css";
@source "./page.html";
@import "../shared.css";

.b-page {
  color: blue;
}
```

```css name=app/shared.css
@prune native;
.shared-card {
  border: 1px solid rgb(0 0 0 / 12%);
}

.only-used-in-b {
  color: blue;
}
```

Each root above selects its adjacent `page.html`:

```html name=app/a/page.html
<article class="a-page shared-card">A</article>
```

```html name=app/b/page.html
<article class="b-page shared-card only-used-in-b">B</article>
```

The `a.css` output keeps `.a-page` and `.shared-card`, but removes `.only-used-in-b` from the shared source. The `.b-page` rule belongs to the other root and is not imported here.

The `b.css` output keeps `.b-page`, `.shared-card`, and `.only-used-in-b`.

The same imported file can therefore be pruned differently under different roots. If `shared.css` is also imported directly by JavaScript or by a framework route, then `shared.css` becomes its own root only when that direct import enters the Master CSS pipeline.

---

## Scoped scanning
By default, a pruned stylesheet uses the global scanner scope. Add `@source`, `@source not`, `@safelist`, and `@blocklist` inside the stylesheet graph when that root needs a narrower or wider usage graph.

```txt
app/a/a.css
  -> scans app/a/page.html
  -> imports ../shared.css

app/b/b.css
  -> scans app/b/page.html
  -> imports ../shared.css
```

```css name=app/a/a.css
@prune native;
@import "@master/css";
@source "./page.html";
@import "../shared.css";

.a-card {
  color: red;
}

.b-card {
  color: blue;
}
```

```css name=app/b/b.css
@prune native;
@import "@master/css";
@source "./page.html";
@import "../shared.css";

.a-card {
  color: red;
}

.b-card {
  color: blue;
}
```

```css name=app/shared.css
@prune native;
@safelist "shared-card";
@blocklist "debug-*";

.shared-card {
  border: 1px solid rgb(0 0 0 / 12%);
}

.debug-outline {
  outline: 1px solid red;
}
```

`./page.html` is resolved relative to the CSS file that declared it. The directives in `shared.css` are merged into whichever root imports it, so `shared-card` is included for both roots and `debug-*` is blocked for both roots.

```html name=app/a/page.html
<article class="a-card shared-card">A</article>
```

```html name=app/b/page.html
<article class="b-card shared-card">B</article>
```

The `a.css` output keeps `.a-card` and `.shared-card`. The `b.css` output keeps `.b-card` and `.shared-card`. Both roots remove `.debug-outline` because the imported `@blocklist "debug-*";` directive belongs to each root scope.

If a root must scan a file, make sure no `@source not` pattern removes it.

```css name=app/a/a.css
@import "@master/css";
@source "./pages/*.html";
@source not "./pages/preview.html";
```

---

## Rule filtering
Native CSS pruning filters class selector rules by detected usage. A class rule is kept when its selector branch references a class that is used.

```css name=src/style.css
@prune native;
@import "@master/css";

body {
  margin: 0;
}

.card,
.unused:hover {
  border: 1px solid rgb(0 0 0 / 12%);
}

@media (width >= 48rem) {
  .card .title {
    font-weight: 700;
  }

  .debug-card {
    outline: 1px solid red;
  }
}
```

```html name=src/index.html
<!-- @MARK card title -->
<article class="card">
  <h2 class="title">Card</h2>
</article>
```

The output keeps `body`, `.card`, and `.card .title`. It removes `.unused:hover` and `.debug-card`.

```css name=output.css
body {
  margin: 0;
}

.card {
  border: 1px solid rgb(0 0 0 / 12%);
}

@media (width >= 48rem) {
  .card .title {
    font-weight: 700;
  }
}
```

This is a conservative class-name check. For `.card .title`, finding either `card` or `title` is enough to retain the selector branch; the compiler does not prove that the two elements form that descendant relationship in the live DOM. A retained rule can therefore still match no element.

Rules without class selectors, such as `body`, `html`, and `:root`, are not class-usage rules and are preserved. Keyframes follow their declaring file's preserve/prune policy; under pruning, animation usage determines which remain. Empty at-rule blocks are removed after their unused class rules are pruned.

---
