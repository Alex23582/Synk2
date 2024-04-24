FROM node:18.15
# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy all app files to the container
COPY . .

RUN npm run build

# Expose the port your app will run on
EXPOSE 3000

# Define the command to run your app
CMD [ "npm", "run", "start" ]