# arjensmit-api

Proof-of-concept Node.js API that runs next to the static site on the mijn.host shared
hosting package. The host runs CloudLinux; its **Node.js Selector** starts the app under
**Passenger** and mounts it on a URL prefix of the domain, here `https://arjensmit.nl/api`.

## Endpoints

| Method | Path                       | Purpose                                                  |
| ------ | -------------------------- | -------------------------------------------------------- |
| GET    | `/api/health`              | Liveness check                                           |
| GET    | `/api/v1/info`             | Node version, mode, base path (proves what is running)   |
| GET    | `/api/v1/projects`         | Reads `data/projects.json` from disk                     |
| GET    | `/api/v1/projects/:slug`   | One project, `404` when unknown                          |
| GET    | `/api/v1/greetings/:name`  | Input validation example, `400` on an invalid name       |

Locally the same routes are reachable with and without the `/api` prefix. Passenger forwards
the full path including the prefix; `src/middleware/base-path.ts` strips it so routes are
defined once. Set `BASE_PATH` if the app is ever mounted somewhere else (empty for the root).

## Layout

```
api/
  app.js            Passenger startup file: imports dist/server.js
  src/              TypeScript sources (tests live next to the code as *.test.ts)
  dist/             Build output (gitignored, produced by `npm run build`)
  data/             Runtime data read by the API
  scripts/deploy.sh Build + rsync + install + restart on the server
```

Node 24 runs the TypeScript sources directly (type stripping), so `npm run dev` and
`npm test` need no build step. `tsc` compiles to plain ESM JavaScript in `dist/` for the server.

## Commands

```bash
npm install
npm run dev        # http://localhost:3000/health, restarts on file changes
npm run validate   # lint + typecheck + tests (also runs before every deploy)
npm run build
npm run deploy     # see "Deploying"
```

## Server setup (one-off)

The app has been created with the CloudLinux selector CLI over SSH (the same thing DirectAdmin's
"Setup Node.js App" does through a form):

```bash
ssh arjensmit-deploy
/usr/sbin/cloudlinux-selector create --json --interpreter nodejs \
  --domain arjensmit.nl --app-root domains/arjensmit.nl/api --app-uri api \
  --version 24 --app-mode development --startup-file app.js
```

Resulting layout on the server (relative to the home directory):

- `domains/arjensmit.nl/api/` application root, outside the web root. `node_modules` here is a
  symlink into the virtualenv below.
- `nodevenv/domains/arjensmit.nl/api/24/` the Node virtualenv. Activate it with
  `source ~/nodevenv/domains/arjensmit.nl/api/24/bin/activate` to get `node`/`npm` on the PATH.
- `public_html/api/.htaccess` tells Passenger to route `/api` to the app. The static-site deploy
  must exclude `/api` so it does not delete this file (see `../AGENTS.md`).

Useful selector commands (all take `--interpreter nodejs --app-root domains/arjensmit.nl/api`):
`restart`, `stop`, `start`, `destroy`, `set --app-mode production`, and
`set --env-vars '{"KEY":"value"}'` for environment variables.

## Deploying

```bash
npm run deploy
```

`scripts/deploy.sh` validates and builds, rsyncs only `app.js`, `package*.json`, `dist/` and
`data/` to the application root, runs `cloudlinux-selector install-modules` (npm install inside
the virtualenv) and `restart`, then probes `https://arjensmit.nl/api/health`.

The first deploy took over five minutes because `npm install` is slow on the server; later runs
only install what changed.

## Adding an endpoint

1. Create a router in `src/routes/<name>.ts` (copy `src/routes/greetings.ts` for the shape).
   Define paths **without** the `/api` prefix; the base-path middleware handles that.
2. Register it in `src/app.ts`, under `/v1` unless it is infrastructure like `/health`.
3. Validate every input and throw `HttpError` from `src/http-errors.ts` for client errors; the
   error handler turns it into a JSON response. Unknown errors become a generic `500` and are
   logged, never echoed to the client.
4. Add tests next to the code as `src/**/*.test.ts`. `src/test-helpers.ts` starts the real HTTP
   server on a random port; `data/` is the test fixture too.
5. `npm run validate`, then `npm run deploy`.

Data that must survive deploys but is not code (uploads, a SQLite file, secrets) does **not**
belong in `data/`: `rsync --delete` mirrors that folder from the repo. Put such files elsewhere in
the application root and pass the location through an environment variable.

## Operations

All commands run on the server over `ssh arjensmit-deploy`. Every `cloudlinux-selector` call
takes `--interpreter nodejs --app-root domains/arjensmit.nl/api`; add `--json` for machine output.

| Task | Command |
| --- | --- |
| Status, mode, env vars, Node version | `/usr/sbin/cloudlinux-selector get --json --interpreter nodejs --domain arjensmit.nl` |
| Restart after a manual change | `... restart` (or `touch ~/domains/arjensmit.nl/api/tmp/restart.txt`) |
| Switch to production mode | `... set --app-mode production` |
| Set environment variables | `... set --env-vars '{"KEY":"value"}'` (stored by the selector, not in the repo) |
| Install dependencies by hand | `... install-modules` (runs `npm install` in the virtualenv) |
| Remove the app entirely | `... destroy` |
| Run `node`/`npm` interactively | `source ~/nodevenv/domains/arjensmit.nl/api/24/bin/activate && cd ~/domains/arjensmit.nl/api` |

### Logs and troubleshooting

- **Startup errors** (module not found, syntax error, crash before `listen()`) are written to
  `~/domains/arjensmit.nl/api/stderr.log`. Check this first when `/api/health` returns a 503.
- `~/domains/arjensmit.nl/logs/` holds the web server's access/error logs, rotated monthly.
- A `503 Service Unavailable` page styled by LiteSpeed right after a deploy or restart is
  Passenger spawning the app. It clears within a second or two. In `development` mode the app is
  respawned for (nearly) every request, so this can also show up under load; switch to
  `production` mode once the code is stable.
- `app_status: started` in the selector output means the app is *configured* to run, not that
  it is currently healthy. Use `/api/health` for that.
- Never edit or delete `~/public_html/api/.htaccess`: the selector generates it and it is the
  only thing that connects the `/api` URL to the app. The static-site deploy must exclude `/api`.
