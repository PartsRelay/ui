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
MOCKS=false API_URL=http://localhost:3333 bun run dev
```

The dev container of `.devcontainer` checks out the submodule, copies `.env` and installs, then runs `bun run dev` in the terminal of the editor that attaches, where Ctrl+C stops it and frees the port. `docker-compose.yml` publishes port 5173 on `127.0.0.1`. To share the UI, run `cloudflared tunnel --url http://localhost:5173`, which the dev container has installed.

## Cookies

Set `COOKIEBOT_ID` to the ID of a [Cookiebot](https://www.cookiebot.com) domain group to ask for the cookie consent. Cookiebot stores and logs the answer; the UI shows its own banner in place of the Cookiebot dialog, and a Cookies link in the footer opens it again. Without the ID nothing loads.

In the Cookiebot admin:

- Add every host that shows a page to the domain group: the app and the showcase site. Leave the API host out, it serves no page and receives no cookie from the UI.
- Cookiebot keeps the consent of each host apart, so a visitor answers once on the showcase site and once in the app. Its Cross-domain Consent Sharing can join them, but it is a paid option, it needs third-party cookies, and browsers no longer pass a consent from a domain to its subdomains.
- On every page Cookiebot removes the cookies and the local storage entries that its scan lists as unclassified or under a refused category. Classify the two the app writes: `auth.token`, the session, as necessary, and `i18nextLng`, the chosen language.

## Checks

- `bun run check`: format, lint and types.
- `bun run build`: the production bundle in `dist`.
- `bun run test:unit` and `bun run test:e2e`: Vitest and Playwright, as described in `CLAUDE.md`.
- `bun run test:coverage`: the unit tests with their coverage, as a table in the terminal and a report in `coverage/index.html`.
- `API_URL=http://localhost:3333 bun run generate`: regenerates the Orval client in `src/core/api` from a running core.
