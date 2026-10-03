FROM node:20-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY web/package.json web/package-lock.json web/
RUN npm ci --prefix web

COPY web/index.html web/tsconfig.json web/vite.config.ts web/
COPY web/src web/src
RUN npm run build --prefix web

COPY server server
COPY labs labs
COPY checker checker
COPY runner runner
COPY shared shared
COPY package.json package.json

ENV NODE_ENV=production
EXPOSE 8787
CMD ["node", "server/index.js"]
