FROM node:18-alpine

WORKDIR /app

# Copy package files and install
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code
COPY . .

EXPOSE 5173

# Run Vite dev server exposing host
CMD ["npm", "run", "dev", "--", "--host"]
