FROM node:22-alpine

WORKDIR /app

# Install dependencies first for better layer caching
COPY frontend-admin/package*.json ./
RUN npm install

# Copy source and build
COPY frontend-admin/ .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
