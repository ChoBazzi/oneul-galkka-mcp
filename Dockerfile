FROM node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ARG SEOUL_OPEN_DATA_API_KEY=""
ARG SEOUL_OPEN_DATA_BASE_URL="http://openapi.seoul.go.kr:8088"
ARG SEOUL_OPEN_DATA_TIMEOUT_MS="3000"
ENV NODE_ENV=production
ENV PORT=8080
ENV SEOUL_OPEN_DATA_API_KEY=$SEOUL_OPEN_DATA_API_KEY
ENV SEOUL_OPEN_DATA_BASE_URL=$SEOUL_OPEN_DATA_BASE_URL
ENV SEOUL_OPEN_DATA_TIMEOUT_MS=$SEOUL_OPEN_DATA_TIMEOUT_MS
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/build ./build
EXPOSE 8080
USER node
CMD ["npm", "run", "start:http"]
