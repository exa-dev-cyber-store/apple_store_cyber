FROM node:20-slim AS base

# 1. Install dependencies only when needed
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js build-time arguments & env vars
ARG NEXT_PUBLIC_API_URL=https://be-apple-store.eka-dev.cloud
ARG NEXT_PUBLIC_SITE_URL=https://apple-store.eka-dev.cloud
ARG NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-btSBJ7SfqmjcmlrvJYeOOQlT
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=897905079551-0bm5skv53tbcpqobtlkaatmfheftthc4.apps.googleusercontent.com
ARG NEXT_PUBLIC_IMAGE_URL=https://storage.eka-dev.cloud/images
ARG API_ENDPOINT_DATA=https://be-apple-store.eka-dev.cloud/api
ARG API_ENDPOINT_USER=https://be-apple-store.eka-dev.cloud/auth
ARG NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBKDSH1WeCu3M2y134Z9mAtkqA8YKPqxXA
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=testflutterfirebase-26e7c.firebaseapp.com
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID=testflutterfirebase-26e7c
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=testflutterfirebase-26e7c.firebasestorage.app
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1043117609248
ARG NEXT_PUBLIC_FIREBASE_APP_ID=1:1043117609248:web:78aa5b0f4905b4fcfb8745
ARG NEXT_PUBLIC_FIREBASE_VAPID_KEY=BBWGVz5Jy9GUzjB2mBRCeh7KEfENduyBag0ToMHcAakFTfXTTlZlDQ_xxtrtK_8aK1y3LRBYVncxq-lPUlV3DWc

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=$NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_IMAGE_URL=$NEXT_PUBLIC_IMAGE_URL
ENV API_ENDPOINT_DATA=$API_ENDPOINT_DATA
ENV API_ENDPOINT_USER=$API_ENDPOINT_USER
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_PUBLIC_FIREBASE_VAPID_KEY=$NEXT_PUBLIC_FIREBASE_VAPID_KEY
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# 3. Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV API_ENDPOINT_DATA=https://be-apple-store.eka-dev.cloud/api
ENV API_ENDPOINT_USER=https://be-apple-store.eka-dev.cloud/auth
ENV NEXT_PUBLIC_API_URL=https://be-apple-store.eka-dev.cloud
ENV NEXT_PUBLIC_IMAGE_URL=https://storage.eka-dev.cloud/images
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=80
ENV HOSTNAME="0.0.0.0"

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 80

CMD ["node", "server.js"]
