#!/bin/bash

# Monograuvi Backend Setup Script
# This script handles the Python 3.12+ distutils compatibility issue

echo "🎵 Setting up Monograuvi Backend..."

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1,2)
echo "Python version detected: $python_version"

# Install system dependencies first
echo "📦 Installing system dependencies..."

# Detect OS and install dependencies
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Installing Linux dependencies..."
    sudo apt-get update
    sudo apt-get install -y python3-dev python3-venv libportaudio2 libportaudio-dev ffmpeg build-essential
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Installing macOS dependencies..."
    if command -v brew &> /dev/null; then
        brew install portaudio ffmpeg
    else
        echo "Homebrew not found. Please install portaudio and ffmpeg manually."
    fi
else
    echo "⚠️  Please install portaudio and ffmpeg manually for your system"
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "🐍 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip, setuptools, and wheel first (critical for Python 3.12+)
echo "⬆️ Upgrading pip and build tools..."
pip install --upgrade pip setuptools wheel

# Install distutils compatibility for Python 3.12+
if [[ $(python -c "import sys; print(sys.version_info >= (3, 12))") == "True" ]]; then
    echo "🔧 Installing Python 3.12+ compatibility packages..."
    pip install setuptools-scm
fi

# Install all dependencies from requirements.txt
echo "📦 Installing all Python dependencies from requirements.txt..."
pip install -r requirements.txt

echo "✅ Installation complete!"
echo ""
echo "To start the server:"
echo "1. Activate the environment: source venv/bin/activate"
echo "2. Run the server: uvicorn main:app --reload"
echo "3. Visit: http://localhost:8000/docs"
