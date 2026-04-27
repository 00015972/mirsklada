FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ---- Build stage ----
FROM base AS build
WORKDIR /app

# Declare VITE_ vars as build args so Railway injects them at build time
ARG VITE_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_REVENUECAT_API_KEY

# Expose them as env vars so Vite picks them up during build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_REVENUECAT_API_KEY=$VITE_REVENUECAT_API_KEY

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm db:generate
RUN pnpm --filter @mirsklada/shared build
RUN pnpm --filter @mirsklada/database build
RUN pnpm --filter @mirsklada/web build

# ---- Runner stage ----
FROM nginx:alpine AS runner

# Copy built static files
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

# Copy nginx config directly (not as template to avoid entrypoint corruption)
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# At runtime: wire listen port and API upstream endpoint, then start nginx
CMD ["/bin/sh", "-c", "API_UPSTREAM=${API_UPSTREAM:-mirskladaapi.railway.internal:${API_PORT:-8080}}; sed -i \"s/listen 80/listen ${PORT:-80}/\" /etc/nginx/conf.d/default.conf; sed -i \"s|__API_UPSTREAM__|${API_UPSTREAM}|\" /etc/nginx/conf.d/default.conf; exec nginx -g 'daemon off;'" ]
