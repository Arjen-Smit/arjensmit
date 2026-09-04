# arjensmit.nl

Static site for arjensmit.nl, hosted on mijn.host shared hosting (DirectAdmin).

## Server access

All server access for this project runs over SSH:

```bash
ssh arjensmit-deploy
```

`arjensmit-deploy` is a host alias defined in `~/.ssh/config` on the developer's
machine. It carries the hostname, the user, port 26 and the key to use. Nothing
about it lives in this repository, and this repository holds no credentials.

- SSH runs on port **26**, not 22. Port 22 is closed on this host.
- Web root: `~/public_html`, a symlink to `~/domains/arjensmit.nl/public_html`.
- `rsync` 3.4.4 is available on the server.

## Deploying

`dist/` is what goes on the server. Always dry-run first — `--delete` makes the
server an exact copy of `dist/`, so an empty or wrong source directory wipes the
live site.

```bash
rsync -avzn --delete dist/ arjensmit-deploy:public_html/   # -n previews, changes nothing
rsync -avz  --delete dist/ arjensmit-deploy:public_html/   # the real run
```

## Layout

`dist/` currently holds a snapshot of the live site. Once real site sources exist
they go in `src/` and a build step writes its output into `dist/`; at that point
`dist/` should probably be gitignored.

## Known constraints

- FTP and FTPS are unusable from the developer's home network. The KPN Experia Box
  firewall defaults to blocking outbound ports 20-21. SSH on port 26 is unaffected,
  which is why deployment runs over SSH rather than FTPS.
