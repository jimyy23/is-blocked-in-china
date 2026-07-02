FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8787

COPY package.json ./
COPY src ./src

EXPOSE 8787
CMD ["node", "src/server.js"]
