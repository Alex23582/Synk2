FROM node:18.15
# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy all app files to the container
COPY . .

# Expose the port your app will run on
EXPOSE 4008

# Define the command to run your app
CMD [ "node", "main" ]