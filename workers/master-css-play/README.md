# Master CSS Play Worker

Cloudflare Worker API for Master CSS Play share links.

## Endpoints

- `POST /api/play/shares` stores Play files in KV and returns `{ "id": "..." }`.
- `GET /api/play/shares/:id` returns the stored share payload.
- `GET /api/play/health` returns `{ "ok": true }`.

## Deploy

Authenticate with Cloudflare first:

```sh
pnpm dlx wrangler login
```

Then deploy:

```sh
pnpm dlx wrangler deploy --config workers/master-css-play/wrangler.toml
```

The Worker route is configured for `https://css.master.co/api/play/*`, and `https://rc.css.master.co` is allowed to call it. The KV binding uses the existing `master` namespace.
