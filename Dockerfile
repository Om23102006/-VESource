# Frontend Dockerfile — multi-stage build (Exp 7 & 9)

# Stage 1: Build React/Vite app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files first (layer cache optimisation)
COPY package.json package-lock.json* ./

# Install with legacy peer deps to handle any socket.io-client peer conflicts
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve built assets with Nginx
FROM nginx:alpine

# Copy Vite build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config — SPA routing + API/WebSocket proxy to backend container
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
