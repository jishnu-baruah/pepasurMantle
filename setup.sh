#!/bin/bash
# Pepasur Quick Setup Script
# Run this to set up the entire project quickly

set -e

echo "🐸 Pepasur Quick Setup"
echo "======================"
echo ""

# Check prerequisites
echo "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js v18+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm"
    exit 1
fi

echo "✅ Prerequisites OK"
echo ""

# Setup contract
echo "📜 Setting up contracts..."
cd contract
npm install
echo "✅ Contract dependencies installed"
cd ..

# Setup backend
echo "🔧 Setting up backend..."
cd backend
npm install
echo "✅ Backend dependencies installed"
cd ..

# Setup frontend
echo "🎨 Setting up frontend..."
cd frontend
npm install
echo "✅ Frontend dependencies installed"
cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Deploy contracts: cd contract && npm run deploy"
echo "2. Configure .env files with contract addresses"
echo "3. Start backend: cd backend && npm run dev"
echo "4. Start frontend: cd frontend && npm run dev"
echo ""
echo "See QUICK_DEPLOYMENT_GUIDE.md for detailed instructions"