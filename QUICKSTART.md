# Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will help you set up and run the AI-Powered Quiz Recommendation System quickly.

## Prerequisites

- **Python 3.8+**
- **Node.js 14+**
- **npm** (comes with Node.js)

## Quick Setup

### Option 1: Automated Setup (Recommended)

Run the setup script:

```bash
./setup.sh
```

This script will:

- Check your system requirements
- Set up the Python virtual environment
- Install all dependencies
- Initialize the database with sample data
- Set up the React frontend

### Option 2: Manual Setup

#### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the application
python run.py
```

The backend will start on `http://localhost:5000`

#### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will start on `http://localhost:3000`

## 🎯 First Steps

1. **Open your browser** and go to `http://localhost:3000`

2. **Explore the Dashboard** - You'll see:

   - Overview statistics
   - Quick action buttons
   - Recent learners
   - System features

3. **Try Recommendations**:

   - Go to the "Recommendations" page
   - Select a learner from the dropdown
   - Choose a recommendation method (Hybrid, Content-based, or Collaborative)
   - Click "Get Recommendations"

4. **View Analytics**:

   - Navigate to the "Analytics" page
   - Explore interactive charts
   - View performance insights

5. **Browse Learners and Quizzes**:
   - Check out the "Learners" page to see all learner profiles
   - Visit the "Quizzes" page to browse available quizzes

## 📊 Sample Data

The system comes with pre-generated sample data:

- **50 Learners** with realistic names and topic scores
- **100 Quizzes** across 10 different topics
- **Performance Data** showing quiz attempts and scores

## 🔧 Configuration

### Backend Configuration

Edit `backend/app/__init__.py` to modify:

- Database connection
- CORS settings
- Secret key

### Frontend Configuration

Edit `frontend/src/services/api.ts` to change:

- API base URL
- Request/response interceptors

## 🧪 Testing

Run the tests to verify everything is working:

```bash
# Backend tests
cd backend
source venv/bin/activate
pytest tests/ -v

# Frontend tests
cd frontend
npm test
```

## 📈 Understanding the System

### Recommendation Methods

1. **Hybrid (Default)**: Combines content-based and collaborative filtering
2. **Content-based**: Based on learner's topic preferences and difficulty levels
3. **Collaborative**: Based on similar learners' performance patterns

### Key Features

- **Personalized Recommendations**: Each learner gets tailored quiz suggestions
- **Interactive Analytics**: Real-time charts and performance insights
- **Topic-based Learning**: 10 different academic topics covered
- **Difficulty Adaptation**: Quizzes categorized by difficulty levels
- **Performance Tracking**: Monitor learner progress over time

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**

```bash
# Check if port 5000 is in use
lsof -i :5000
# Kill the process if needed
kill -9 <PID>
```

**Frontend won't start:**

```bash
# Clear npm cache
npm cache clean --force
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Database issues:**

```bash
# Remove existing database
rm backend/quiz_recommendation.db
# Restart backend to recreate database
python run.py
```

### Logs

- **Backend logs**: Check the terminal where you ran `python run.py`
- **Frontend logs**: Check browser developer console (F12)

## 📚 Next Steps

1. **Explore the Code**: Check out the source code to understand the implementation
2. **Modify Data**: Update the data generator to add your own learners/quizzes
3. **Customize UI**: Modify the frontend components to match your needs
4. **Add Features**: Extend the system with new functionality
5. **Deploy**: Follow the deployment guide for production setup

## 🆘 Need Help?

- Check the [README.md](README.md) for detailed documentation
- Review the [Architecture Guide](docs/architecture.md) for system design
- Look at the test files for usage examples
- Open an issue if you encounter problems

## Folder Structure

-quiz-recommendation-system/
├── backend/ # Flask API server
│ ├── app/
│ │ ├── models/ # ML models and data processing
│ │ ├── api/ # REST API endpoints
│ │ ├── utils/ # Utility functions
│ │ └── data/ # Dataset and data generation
│ ├── tests/ # Parametrized test suite
│ ├── requirements.txt
│ └── run.py
├── frontend/ # React-based client
│ ├── src/
│ │ ├── components/ # React components
│ │ ├── pages/ # Page components
│ │ ├── services/ # API services
│ │ └── utils/ # Utility functions
│ ├── package.json
│ └── public/
├── docs/ # Documentation
├── setup.sh # Automated setup script
└── README.md # Comprehensive documentation

## 🎉 You're Ready!

Your AI-Powered Quiz Recommendation System is now running! Start exploring the features and customizing it for your needs.
