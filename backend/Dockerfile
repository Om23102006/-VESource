# Backend Dockerfile (Exp 7 & 9)
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy source files
COPY . .

# Ensure secure upload directory exists
RUN mkdir -p uploads/documents

EXPOSE 5000

CMD ["node", "server.js"]
