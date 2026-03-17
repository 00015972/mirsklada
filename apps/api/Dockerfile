FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ---- Build stage ----
FROM base AS build
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm db:generate
RUN pnpm --filter @mirsklada/shared build
RUN pnpm --filter @mirsklada/database build
RUN pnpm --filter @mirsklada/api build

# install ONLY production deps for API
RUN pnpm install --prod --filter @mirsklada/api...

# prepare clean runtime folder
RUN mkdir -p /prod/api

# copy compiled app
RUN cp -r apps/api/dist /prod/api/dist

# copy package.json
RUN cp apps/api/package.json /prod/api/package.json

# copy ONLY api node_modules (cleaner)
RUN cp -r node_modules /prod/api/node_modules

# ---- Runner stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /prod/api .

EXPOSE 3000
CMD ["node", "dist/index.js"]
