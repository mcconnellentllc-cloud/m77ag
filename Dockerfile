FROM node:18

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Debug - list files to verify structure
RUN ls -la
RUN ls -la server/

# Start the application
CMD ["node", "server/app.js"]