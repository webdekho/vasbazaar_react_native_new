#!/bin/bash

# Fix Expo permissions script
echo "Fixing Expo directory permissions..."

# Get current user
CURRENT_USER=$(whoami)
echo "Current user: $CURRENT_USER"

# Fix permissions for .expo directory
echo "Fixing permissions for ~/.expo directory..."
sudo chown -R $CURRENT_USER:staff ~/.expo

# Create necessary directories if they don't exist
echo "Creating necessary directories..."
mkdir -p ~/.expo/cache
mkdir -p ~/.expo/schema-cache
mkdir -p ~/.expo/codesigning

# Set proper permissions
echo "Setting proper permissions..."
chmod -R 755 ~/.expo

echo "Done! Expo permissions have been fixed."
echo ""
echo "You can now run 'npx expo start' without permission errors."