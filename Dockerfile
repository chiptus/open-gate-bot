FROM oven/bun:1.3-alpine AS deps
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile 2>/dev/null || bun install

FROM oven/bun:1.3-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production DB_PATH=/data/bot.db
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src
COPY locales ./locales
RUN mkdir -p /data
VOLUME ["/data"]
CMD ["bun", "run", "src/bot.ts"]
