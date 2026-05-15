# Multi-stage build: workspace install + UI build → slim runtime that runs
# the Fastify server. The server also serves the built UI from STATIC_ROOT.
#
# Build args:
#   VITE_BASE_PATH  Vite `base` for the UI build. Defaults to "/" (bare-domain
#                   deploy). Override to "/twistedFate-belote/" if hosting
#                   under a subpath.

# ── Stage 1: build everything ────────────────────────────────────────────────
FROM node:24-bookworm-slim AS build
WORKDIR /app

# Enable corepack so the matching pnpm version (per package.json engines) is
# always used regardless of host pnpm version.
RUN corepack enable

# Copy lockfile + manifests first for better layer caching.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY tsconfig.base.json tsconfig.json ./
COPY packages/animation/package.json ./packages/animation/
COPY packages/tunisian/app/package.json ./packages/tunisian/app/
COPY packages/tunisian/core/package.json ./packages/tunisian/core/
COPY packages/tunisian/ui/package.json ./packages/tunisian/ui/
COPY packages/coinche/app/package.json ./packages/coinche/app/
COPY packages/coinche/core/package.json ./packages/coinche/core/
COPY packages/coinche/ui/package.json ./packages/coinche/ui/
COPY packages/db/package.json ./packages/db/
COPY packages/protocol/package.json ./packages/protocol/
COPY packages/server/package.json ./packages/server/
COPY packages/ui/package.json ./packages/ui/

RUN pnpm install --frozen-lockfile

# Now bring in the rest of the source tree and build.
COPY . .

ARG VITE_BASE_PATH="/"
ENV VITE_BASE_PATH=${VITE_BASE_PATH}

# Build only the UI — the server runs via tsx at runtime, no build step
# needed for it. Invoke vite directly instead of `pnpm --filter ui build`
# because the local script also runs `tsc -b`, which surfaces pre-existing
# type errors in test/fixture files unrelated to the production bundle.
# Type safety is enforced by `pnpm typecheck` in the CI checks job; this
# step is bundling-only.
RUN pnpm --filter ui exec vite build

# ── Stage 2: slim runtime ────────────────────────────────────────────────────
FROM node:24-bookworm-slim AS runtime
WORKDIR /app

# Install pnpm globally via npm — *not* via corepack. corepack downloads
# the pnpm binary lazily at first invocation into $HOME/.cache, which
# fails crash-loop style for the unprivileged `belote` system user that
# CMD eventually runs as (its $HOME has no write access path inside this
# image). A globally npm-installed pnpm avoids the runtime download.
# Pin to the exact version listed in package.json's `packageManager` field.
# A loose `pnpm@10` triggers pnpm's self-management (it tries to download the
# pinned version into $HOME/.local/share/pnpm), which fails EACCES for the
# unprivileged `belote` user that CMD runs as.
RUN npm install -g pnpm@10.18.0 && pnpm --version

ENV NODE_ENV=production
ENV PORT=4100
ENV HOST=0.0.0.0
ENV STATIC_ROOT=/app/packages/ui/dist
ENV DB_PATH=/data/belote.db

# Bring in the workspace skeleton + production deps. We ship sources for the
# server (since it's tsx-run) and the built UI dist. Other workspace packages
# the server imports from need their `src/` (no build step) too.
COPY --from=build /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=build /app/tsconfig.base.json /app/tsconfig.json ./
COPY --from=build /app/packages/server ./packages/server
COPY --from=build /app/packages/tunisian/core ./packages/tunisian/core
COPY --from=build /app/packages/tunisian/app ./packages/tunisian/app
COPY --from=build /app/packages/db ./packages/db
COPY --from=build /app/packages/protocol ./packages/protocol
COPY --from=build /app/packages/animation ./packages/animation
COPY --from=build /app/packages/ui/package.json ./packages/ui/
COPY --from=build /app/packages/ui/dist ./packages/ui/dist

# Production install — skips dev deps everywhere except where needed (tsx is
# in the server's devDependencies, so we install all and rely on the slim
# bookworm base for size).
RUN pnpm install --frozen-lockfile

EXPOSE 4100

# Use a non-root user for the runtime. /data is the SQLite mount point.
RUN useradd --system --uid 1001 belote \
  && mkdir -p /data \
  && chown -R belote:belote /app /data
VOLUME ["/data"]
USER belote

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["pnpm", "--filter", "@belote/server", "start"]
