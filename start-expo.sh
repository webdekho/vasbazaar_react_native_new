#!/bin/bash

# Start Expo with custom cache directory to avoid permission issues
echo "Starting Expo with custom cache directory..."

# Create local cache directories
mkdir -p ./.expo-local-cache
mkdir -p ./.expo-local-cache/codesigning
mkdir -p ./.expo-local-cache/schema-cache

# Set environment variables to use local cache
export EXPO_CACHE_DIR="./.expo-local-cache"
export EXPO_NO_CACHE="1"

# Start Expo
echo "Starting Expo development server..."
npx expo start --clear