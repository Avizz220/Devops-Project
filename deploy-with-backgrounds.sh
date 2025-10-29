#!/bin/bash

echo "🎨 Setting up Beautiful Background Images for Docker App"
echo "=================================================="

# Step 1: Create directories
echo "📁 Creating image directories..."
mkdir -p public/images/backgrounds

# Step 2: Download background images (only if curl is available)
if command -v curl &> /dev/null; then
    echo "📥 Downloading beautiful background images..."
    
    # Download high-quality background images
    curl -s -L -o public/images/backgrounds/bg1.jpg "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80" || echo "⚠️  Download failed for bg1"
    curl -s -L -o public/images/backgrounds/bg2.jpg "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80" || echo "⚠️  Download failed for bg2"
    curl -s -L -o public/images/backgrounds/bg3.jpg "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1920&q=80" || echo "⚠️  Download failed for bg3"
    curl -s -L -o public/images/backgrounds/bg4.jpg "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1920&q=80" || echo "⚠️  Download failed for bg4"
    
    echo "✅ Background images downloaded"
else
    echo "⚠️  curl not available, will use online fallbacks and gradients"
fi

# Step 3: Stop existing containers
echo "⏹️  Stopping existing containers..."
docker compose down

# Step 4: Build frontend with new background system
echo "🔨 Building frontend with enhanced background system..."
docker compose build frontend --no-cache

# Step 5: Start all containers
echo "▶️  Starting all containers..."
docker compose up -d

# Step 6: Wait for containers
echo "⏳ Waiting for containers to start..."
sleep 15

# Step 7: Check status
echo "📊 Container Status:"
docker compose ps

echo ""
echo "🎉 Deployment Complete!"
echo "================================"
echo ""
echo "🌐 Access your application:"
echo "   🔗 Frontend:    http://localhost"
echo "   🔗 Backend:     http://localhost:4000" 
echo "   🔗 phpMyAdmin:  http://localhost:8080"
echo ""
echo "🎨 Background Images Features:"
echo "   ✨ Beautiful sliding background animations"
echo "   🏔️  Multiple high-quality landscape images"
echo "   🎭 Gradient fallbacks if images don't load"
echo "   🔄 Auto-switching between backgrounds every 5 seconds"
echo "   📱 Responsive design for all screen sizes"
echo ""
echo "🔍 Troubleshooting:"
echo "   • Press F12 in browser to see console logs"
echo "   • Look for '✅ Image loaded' messages"
echo "   • Images will fallback to beautiful gradients if needed"
echo ""
echo "🚀 Your app now has stunning animated backgrounds!"