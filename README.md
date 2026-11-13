# Parts Relay UI

The web app of Parts Relay. It talks to [PartsRelay/core](https://github.com/PartsRelay/core) and reads every text from [PartsRelay/locales](https://github.com/PartsRelay/locales), mounted as a git submodule at `locales`.

## Run it

```sh
git clone --recurse-submodules https://github.com/PartsRelay/ui.git
cd ui
bun install
cp .env.example .env
bun run dev
```

A clone made without `--recurse-submodules` needs `git submodule update --init`.

With `MOCKS=true`, the default of `.env.example`, the MSW mocks of `src/mocks` answer every request, signed in as Mark Reed, the owner of Redwood Parts Ltd.

To use a core running on your machine, start it with `UI_URL=http://localhost:5173`, then run the UI without the mocks:

```sh
MOCKS=false CORE_URL=http://localhost:3333 bun run dev
```

The core and the site use the same names: `SITE_URL`, `UI_URL` and `CORE_URL` always name the site, the app and the core. Here `UI_URL` is the public address of the app, for `og:image`, and `CORE_URL` the address of the core. The config reads the `.env` files of `NODE_ENV`, which `.env.example` sets to `development`: with that `.env`, `bun run build` makes a development build, so build for production without it or with `NODE_ENV=production`.

The dev container of `.devcontainer` checks out the submodule, copies `.env` and installs, then runs `bun run dev` in the terminal of the editor that attaches, where Ctrl+C stops it and frees the port. `docker-compose.yml` publishes port 5173 on `127.0.0.1`. To share the UI, run `cloudflared tunnel --url http://localhost:5173`, which the dev container has installed.

## Checks

- `bun run check`: format, lint and types.
- `bun run build`: the production bundle in `dist`.
- `bun run test:unit` and `bun run test:e2e`: Vitest and Playwright, as described in `CLAUDE.md`.
- `bun run test:coverage`: the unit tests with their coverage, as a table in the terminal and a report in `coverage/index.html`.
- `CORE_URL=http://localhost:3333 bun run generate`: regenerates the Orval client in `src/core/api` from a running core.
