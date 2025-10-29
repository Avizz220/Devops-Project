#!/bin/bash

echo "🎨 Setting up local background images for Docker compatibility..."

# Create images directory if it doesn't exist
mkdir -p public/images/backgrounds

# Download beautiful background images for login/signup
echo "📥 Downloading background images..."

# Background 1 - Mountain landscape
curl -s -o public/images/backgrounds/bg1.jpg "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80"

# Background 2 - Forest scene
curl -s -o public/images/backgrounds/bg2.jpg "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80"

# Background 3 - Ocean waves
curl -s -o public/images/backgrounds/bg3.jpg "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1920&q=80"

# Background 4 - City lights
curl -s -o public/images/backgrounds/bg4.jpg "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1920&q=80"

echo "✅ Background images downloaded successfully!"
echo "📁 Images saved to: public/images/backgrounds/"

# List downloaded files
ls -la public/images/backgrounds/