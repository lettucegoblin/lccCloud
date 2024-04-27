# Use Ubuntu 22.04 as the base image
FROM ubuntu:22.04

# Install Node.js and other necessary system dependencies
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    curl

# Set the working directory in the container
WORKDIR /app

# Copy your Node.js application files into the Docker image
COPY . /app

# Install Node.js dependencies
RUN npm install

# Set permissions for the lcc binary
RUN chmod 755 ./lcc

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app
CMD ["node", "index.js"]
