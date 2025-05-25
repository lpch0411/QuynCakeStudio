# Use official Node.js LTS image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install
COPY package*.json ./
RUN npm install

# Copy entire project
COPY . .

# Expose the port your app listens on
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
