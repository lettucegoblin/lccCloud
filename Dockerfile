# Use Ubuntu 22.04 as the base image
FROM node:slim

# Install Node.js and other necessary system dependencies
# RUN apt-get update && apt-get install -y \
#     nodejs \
#     npm \
#     curl

# Set the working directory in the container
WORKDIR /app

# Copy your Node.js application files into the Docker image
COPY . /app

# Set NODE_ENV environment variable to production
ENV NODE_ENV render

# Install Node.js dependencies
RUN npm install
RUN npm run client_install

# Build the Node.js application
RUN npm run build_client

# Set permissions for the lcc binary
RUN chmod 755 ./server/lcc

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app
CMD ["npm", "run", "server"]
