#!/bin/bash
set -e  # Exit on error

echo "🚀 Starting Monograuvi setup..."

# Check if Python 3.8+ is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed. Please install Python 3.8 or higher and try again."
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
if [[ "$(printf '%s\n' "3.8" "$PYTHON_VERSION" | sort -V | head -n1)" != "3.8" ]]; then
    echo "❌ Python 3.8 or higher is required. Found Python $PYTHON_VERSION"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js 16+ and try again."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
if [ "$NODE_MAJOR" -lt 16 ]; then
    echo "❌ Node.js 16 or higher is required. Found Node.js $NODE_VERSION"
    exit 1
fi

echo "✅ Found Python $PYTHON_VERSION and Node.js $NODE_VERSION"

# Set up Python virtual environment
echo "🐍 Setting up Python virtual environment..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Created Python virtual environment"
else
    echo "✅ Using existing Python virtual environment"
fi

# Activate virtual environment and install Python dependencies
echo "📦 Installing Python dependencies..."
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

echo "✅ Python dependencies installed successfully"

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
cd ..
npm install

echo "✅ Node.js dependencies installed successfully"

echo "✨ Setup complete! You can now start the development server with 'npm run dev'"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000"

exit 0
