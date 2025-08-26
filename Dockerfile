FROM node:18

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Debug - list directory contents before copying
RUN echo "Before copying files:"
RUN ls -la

# Explicitly copy the server directory and its contents
COPY server ./server/

# Debug - verify server directory contents
RUN echo "Server directory contents:"
RUN ls -la server/

# Copy remaining files
COPY . .

# Start the application
CMD ["node", "server/app.js"]