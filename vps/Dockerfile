FROM node:22-alpine
WORKDIR /app
COPY server.mjs package.json ./
COPY hooks ./hooks
ENV NODE_ENV=production
EXPOSE 8787
USER node
CMD ["node", "server.mjs"]
