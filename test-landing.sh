#!/bin/bash

echo "🧪 Testing Landing Page Setup..."
echo ""

# Check if Landing component exists
if [ -f "src/components/Landing/landing.jsx" ]; then
    echo "✅ Landing component exists"
else
    echo "❌ Landing component NOT found"
fi

# Check if Landing CSS exists
if [ -f "src/components/Landing/landing.css" ]; then
    echo "✅ Landing CSS exists"
else
    echo "❌ Landing CSS NOT found"
fi

# Check if App.jsx imports Landing
if grep -q "LandingPage" src/App.jsx; then
    echo "✅ LandingPage imported in App.jsx"
else
    echo "❌ LandingPage NOT imported in App.jsx"
fi

# Check routing
if grep -q 'path="/"' src/App.jsx && grep -q '<LandingPage' src/App.jsx; then
    echo "✅ Root route configured for LandingPage"
else
    echo "❌ Root route NOT properly configured"
fi

echo ""
echo "📋 Next steps:"
echo "1. Clear browser cache and localStorage"
echo "2. Run: docker-compose down"
echo "3. Run: docker-compose up --build"
echo "4. Open: http://localhost"
echo "5. Check browser console (F12) for logs"
