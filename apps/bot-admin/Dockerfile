FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ---- Build stage ----
FROM base AS build
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @mirsklada/shared build
RUN pnpm --filter @mirsklada/bot-admin build

# Extract self-contained production bundle
RUN pnpm deploy --filter @mirsklada/bot-admin --prod /prod/bot-admin

# ---- Runner stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /prod/bot-admin .

CMD ["node", "dist/index.js"]
