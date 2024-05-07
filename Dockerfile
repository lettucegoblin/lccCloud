# Use node:slim as the base image
FROM node:slim

# Install git, Node.js, and other necessary system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \ 
    python3 \
    make \
    build-essential && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Clone the repository
RUN git clone https://github.com/lettucegoblin/lccCloud /app

# Set NODE_ENV environment variable to production
ENV NODE_ENV render

# Install Node.js dependencies
RUN npm install && \
    npm run client_install && \
    npm run build_client

# Set permissions for the lcc binary
RUN chmod 755 ./server/lcc

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app
CMD ["npm", "run", "server"]
