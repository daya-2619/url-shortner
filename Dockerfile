FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

ARG BACKEND_URL
ENV BACKEND_URL=$BACKEND_URL

ARG NEXT_PUBLIC_SHORT_URL_BASE
ENV NEXT_PUBLIC_SHORT_URL_BASE=$NEXT_PUBLIC_SHORT_URL_BASE

# Since the Next.js app needs to build, we just let it build the static pieces.
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
