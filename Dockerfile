FROM node:20 AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build -- --configuration production --output-path=../dist/public

FROM node:20 AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
COPY --from=client-build /app/dist/public ./dist/public
RUN npm run build

FROM node:20
WORKDIR /app
COPY --from=server-build /app/server/dist ./dist
COPY --from=server-build /app/server/node_modules ./node_modules
COPY --from=server-build /app/server/package*.json ./
EXPOSE 8080
CMD ["node", "dist/server.js"]
