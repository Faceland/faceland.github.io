# Faceland DJ room server. Built from dj-server/ (the build context):
#   docker build -f deploy/Dockerfile -t faceland-dj .
#
# In production the process listens on a Unix socket (SOCKET_PATH) that nginx
# on the host proxies to; see deploy/docker-compose.yml. Over a Unix socket the
# server sees no remote address and therefore trusts nginx's X-Real-IP, exactly
# as it does on the Faceland box.
FROM node:22-alpine

ENV NODE_ENV=production

# Fixed UID so the socket directory on the host can be owned by it.
RUN addgroup -S -g 10001 djroom \
 && adduser -S -u 10001 -G djroom -h /app -s /sbin/nologin djroom

WORKDIR /app

# Dependencies first, so a code-only change reuses this layer. --ignore-scripts
# matches how the Faceland box installs it: nothing in the lockfile runs code.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts \
 && npm cache clean --force

# Every module at the top level of dj-server/ (server, room, youtube, config,
# util, chatRules, avatarParts). Tests and deploy files are directories and
# excluded by .dockerignore.
COPY *.js ./

USER djroom

# Where the socket goes inside the container; compose bind-mounts the host
# directory over it.
ENV SOCKET_PATH=/run/faceland-dj/dj.sock

# The HTTP root answers "Faceland DJ server: N in the room" when the room is up.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get({ socketPath: process.env.SOCKET_PATH, path: '/' }, (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
