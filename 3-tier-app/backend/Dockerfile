# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy app source
COPY . .

# Expose port (Express default)
EXPOSE 3000

ENV PORT=3000
# Start the app
CMD ["npm", "start"]