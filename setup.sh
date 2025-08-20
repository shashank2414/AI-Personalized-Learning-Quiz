#!/bin/bash

echo "🚀 Setting up AI-Powered Quiz Recommendation System"
echo "=================================================="

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi
echo "✅ Python 3 found: $(python3 --version)"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14 or higher."
    exit 1
fi
echo "✅ Node.js found: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi
echo "✅ npm found: $(npm --version)"

echo ""
echo "🔧 Setting up backend..."

# Create virtual environment
if [ ! -d "backend/venv" ]; then
    echo "Creating Python virtual environment..."
    cd backend
    python3 -m venv venv
    cd ..
else
    echo "Virtual environment already exists."
fi

# Activate virtual environment and install dependencies
echo "Installing Python dependencies..."
cd backend
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Check if OpenAI API key is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo ""
    echo "⚠️  OPENAI API KEY NOT SET!"
    echo "=================================================="
    echo "To use the AI-powered question generation feature, you need to set your OpenAI API key."
    echo ""
    echo "You can set it in several ways:"
    echo ""
    echo "1. Set as environment variable:"
    echo "   export OPENAI_API_KEY='your-openai-api-key-here'"
    echo ""
    echo "2. Create a .env file in the backend directory:"
    echo "   echo 'OPENAI_API_KEY=your-openai-api-key-here' > backend/.env"
    echo ""
    echo "3. Set it temporarily for this session:"
    echo "   OPENAI_API_KEY='your-key' ./setup.sh"
    echo ""
    echo "Get your API key from: https://platform.openai.com/api-keys"
    echo ""
    echo "The system will still work without the API key, but question generation will use fallback questions."
    echo ""
    read -p "Press Enter to continue without setting the API key now..."
else
    echo "✅ OpenAI API key is set."
fi

# Initialize database
echo "Initializing database..."
python3 -c "from app import create_app; app = create_app(); print('Database initialized successfully!')"

cd ..

echo ""
echo "🔧 Setting up frontend..."

# Install frontend dependencies
cd frontend
npm install
cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo "=================================================="
echo ""
echo "To start the system:"
echo ""
echo "1. Start the backend server:"
echo "   cd backend && source venv/bin/activate && python3 run.py"
echo ""
echo "2. Start the frontend server (in a new terminal):"
echo "   cd frontend && npm start"
echo ""
echo "3. Open your browser and go to: http://localhost:3000"
echo ""
echo "🌟 NEW FEATURES:"
echo "   • AI-Powered Question Generation using OpenAI"
echo "   • Custom Topic Input (no predefined topics)"
echo "   • Dynamic Question Creation for any subject"
echo "   • Multiple Difficulty Levels (Easy, Medium, Hard)"
echo "   • Real-time Performance Analytics"
echo ""
echo "📝 IMPORTANT:"
echo "   • Set your OpenAI API key to enable AI question generation"
echo "   • Without the API key, the system will use fallback questions"
echo "   • You can set the API key anytime by creating a .env file in the backend directory"
echo ""
echo "Happy learning! 🚀"
