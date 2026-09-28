FROM node:22-alpine
ARG BUILD_COMMIT=local
ARG APP_VERSION=dev
ENV NODE_ENV=production PORT=3000 BUILD_COMMIT=$BUILD_COMMIT APP_VERSION=$APP_VERSION
LABEL org.opencontainers.image.revision=$BUILD_COMMIT
WORKDIR /app
COPY --chown=node:node package.json server.js ./
USER node
EXPOSE 3000
CMD ["node", "server.js"]
