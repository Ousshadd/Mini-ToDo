# Stage 1: Build the Angular application
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Build the Angular application
RUN npm run build

# Stage 2: Serve the application using Node.js
FROM node:22-alpine

WORKDIR /app

# Copy the build output from the build stage
# The path dist/to-do or dist/toDo depends on angular.json. Based on package.json, it's dist/toDo
COPY --from=build /app/dist/toDo ./dist/toDo
COPY --from=build /app/package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Expose the port the app runs on (Angular SSR usually runs on 4000)
EXPOSE 4000

# Start the SSR server
CMD ["npm", "run", "serve:ssr:toDo"]
