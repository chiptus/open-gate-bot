FROM oven/bun:1.3-alpine AS deps
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile 2>/dev/null || bun install

# Bakes the deployed commit/branch into plain files, since the runtime image
# below never gets a .git of its own. Not fatal if .git is missing from the
# build context (e.g. some CI checkouts) — falls back to "unknown".
FROM alpine AS gitinfo
WORKDIR /app
RUN apk add --no-cache git
COPY .git ./.git
RUN git rev-parse --short HEAD > GIT_COMMIT 2>/dev/null || echo unknown > GIT_COMMIT
RUN git rev-parse --abbrev-ref HEAD > GIT_BRANCH 2>/dev/null || echo unknown > GIT_BRANCH

FROM oven/bun:1.3-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production DB_PATH=/data/bot.db
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src
COPY locales ./locales
COPY --from=gitinfo /app/GIT_COMMIT /app/GIT_BRANCH ./
RUN mkdir -p /data
VOLUME ["/data"]
CMD ["bun", "run", "src/bot.ts"]
