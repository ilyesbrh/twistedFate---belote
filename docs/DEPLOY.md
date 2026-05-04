# Deploy

Production target: `belote.3btechsolutions.com`. The app runs as a single
docker container on the host; nginx is the public ingress.

## Architecture

```
                             Internet
                                │
                                ▼
                          ┌──────────┐
                          │  nginx   │  TLS, gzip, static caching, ws upgrade
                          │  :443    │
                          └────┬─────┘
                               │  proxy_pass
                               ▼
                  ┌──────────────────────────┐
                  │  docker container         │
                  │  fastify :4100            │
                  │   • /        → static UI  │
                  │   • /assets/ → static UI  │
                  │   • /ws      → WebSocket  │
                  │   • /health  → JSON probe │
                  └──────────────────────────┘
```

The Fastify server (`packages/server`) serves the built UI from
`STATIC_ROOT` (Vite output) and the WebSocket gateway on the same port.

## One-time server setup

> Run as root on a fresh box. `deploy/bootstrap-server.sh` is idempotent.

```bash
scp deploy/bootstrap-server.sh deploy/nginx.belote.conf root@<host>:/tmp/
ssh root@<host> 'cd /tmp && bash bootstrap-server.sh'
```

This installs Docker, nginx, certbot; creates a non-root `deploy` user
in the `docker` group; provisions `/opt/belote`; and drops the nginx
site config in.

After that:

1. **Add the CI deploy public key** to
   `/home/deploy/.ssh/authorized_keys`. Generate the key pair locally:

   ```bash
   ssh-keygen -t ed25519 -C 'belote-ci' -f ~/.ssh/belote_deploy -N ''
   ```

   The **public** half (`.pub`) goes on the server. The **private** half
   becomes the `DEPLOY_SSH_KEY` GitHub secret.

2. **Disable password auth** for SSH:

   ```bash
   sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
   sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/'                /etc/ssh/sshd_config
   systemctl restart sshd
   ```

3. **Add HTTPS** once DNS resolves to the box:

   ```bash
   certbot --nginx -d belote.3btechsolutions.com
   ```

4. **Capture the host's SSH key** for the workflow:
   ```bash
   ssh-keyscan -t ed25519,rsa,ecdsa belote.3btechsolutions.com
   ```

## GitHub repository configuration

Settings → Secrets and variables → Actions → New repository secret:

| Secret               | Value                                                 |
| -------------------- | ----------------------------------------------------- |
| `DEPLOY_HOST`        | `belote.3btechsolutions.com` (or raw IP)              |
| `DEPLOY_USER`        | `deploy`                                              |
| `DEPLOY_SSH_KEY`     | full contents of `~/.ssh/belote_deploy` (private key) |
| `DEPLOY_KNOWN_HOSTS` | output of `ssh-keyscan` from the step above           |

GHCR auth uses the workflow's built-in `GITHUB_TOKEN`. No separate
registry credential needed.

Settings → Environments → New environment named `production`. Optionally
require a manual approval before the deploy job runs.

## Deploying

- Push to `main` → CI runs (`pnpm typecheck`, `pnpm test`,
  `pnpm format:check`), the docker image is built and pushed to GHCR,
  and the workflow SSHes to the host to `docker compose pull && up -d`.
- Manual run: GitHub UI → Actions → "Deploy to server" → Run workflow.

## Local docker-build smoke

Before pushing, you can verify the image builds end-to-end:

```bash
docker build --build-arg VITE_BASE_PATH=/ -t belote:local .
docker run --rm -p 4100:4100 belote:local
# in another shell:
curl http://127.0.0.1:4100/health
open http://127.0.0.1:4100/
```

## Rollback

```bash
ssh deploy@<host>
cd /opt/belote
# pick a known-good sha tag from GHCR
sed -i 's|^IMAGE_REF=.*|IMAGE_REF=ghcr.io/<owner>/<repo>:sha-<short-sha>|' .env
docker compose pull && docker compose up -d
```

The previous image stays on disk for one `docker image prune -f` cycle
(roughly the next deploy), so rollback is fast.
