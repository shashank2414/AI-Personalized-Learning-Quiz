# System Architecture

## Overview

The AI-Powered Quiz Recommendation System is a full-stack web application that provides personalized quiz recommendations using hybrid machine learning algorithms. The system consists of a Flask-based backend API and a React-based frontend with interactive analytics.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │◄──►│   (Flask)       │◄──►│   (SQLite)      │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • API Routes    │    │ • Learners      │
│ • Analytics     │    │ • ML Models     │    │ • Quizzes       │
│ • Recommendations│   │ • Data Processing│   │ • Performance   │
│ • User Interface│    │ • Auth/Validation│   │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Backend Architecture

### Technology Stack

- **Framework**: Flask 2.3.3
- **Database**: SQLite with SQLAlchemy ORM
- **Machine Learning**: Scikit-learn, Surprise library
- **Data Processing**: Pandas, NumPy
- **API**: RESTful API with JSON responses
- **CORS**: Flask-CORS for cross-origin requests

### Core Components

#### 1. Models (`app/models/`)

- **Learner**: Stores learner information and topic-wise performance scores
- **Quiz**: Contains quiz metadata (title, topic, difficulty, etc.)
- **Performance**: Tracks quiz performance for each learner

#### 2. Recommendation Engine (`app/models/recommendation_engine.py`)

- **HybridRecommendationEngine**: Main recommendation system
- **Content-based Filtering**: Based on topic preferences and difficulty levels
- **Collaborative Filtering**: Using SVD algorithm from Surprise library
- **Hybrid Approach**: Combines both methods with configurable weights

#### 3. API Routes (`app/api/routes.py`)

- **Learners**: CRUD operations for learner data
- **Quizzes**: Quiz management and filtering
- **Recommendations**: Personalized quiz recommendations
- **Analytics**: Performance analytics and insights
- **Performance**: Quiz performance submission

#### 4. Data Generation (`app/data/data_generator.py`)

- **Synthetic Data**: Generates 50 learners and 100 quizzes
- **Performance Simulation**: Creates realistic performance data
- **Topic Distribution**: Covers 10 different academic topics

### Machine Learning Pipeline

```
Raw Data → Preprocessing → Feature Engineering → Model Training → Recommendations
    ↓           ↓              ↓                ↓              ↓
Learners    Normalize     Topic Scores    SVD Model     Hybrid Scores
Quizzes     Clean Data    Difficulty     Content       Final Ranking
Performance Missing Values Learner Profiles Filtering   Top-N Results
```

#### Recommendation Algorithms

1. **Content-based Filtering**

   - Analyzes learner's topic preferences
   - Considers difficulty levels
   - Recommends quizzes in weak areas with appropriate difficulty

2. **Collaborative Filtering**

   - Uses SVD (Singular Value Decomposition)
   - Finds similar learners based on performance patterns
   - Recommends quizzes that similar learners performed well on

3. **Hybrid Approach**
   - Combines content-based (60%) and collaborative (40%) scores
   - Provides more accurate and diverse recommendations
   - Balances personalization with discovery

## Frontend Architecture

### Technology Stack

- **Framework**: React 18 with TypeScript
- **Routing**: React Router DOM
- **Charts**: Chart.js with react-chartjs-2
- **HTTP Client**: Axios
- **Styling**: Custom CSS with modern design principles

### Core Components

#### 1. Pages (`src/pages/`)

- **Dashboard**: Overview with statistics and quick actions
- **Analytics**: Interactive charts and performance insights
- **Recommendations**: Personalized quiz recommendations
- **Learners**: Learner management and profiles
- **Quizzes**: Quiz browsing and filtering

#### 2. Components (`src/components/`)

- **Navigation**: Main navigation with active state management
- **Charts**: Reusable chart components
- **Cards**: UI components for data display

#### 3. Services (`src/services/`)

- **API Service**: Centralized API communication
- **Type Definitions**: TypeScript interfaces for data models

### Data Flow

```
User Action → Component → API Service → Backend API → Database → Response → UI Update
    ↓           ↓           ↓           ↓           ↓         ↓         ↓
Select Learner → State → HTTP Request → Route → Query → JSON → Re-render
```

## Database Schema

### Learners Table

```sql
CREATE TABLE learners (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    topic_scores TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Quizzes Table

```sql
CREATE TABLE quizzes (
    id INTEGER PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    topic VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    description TEXT,
    questions_count INTEGER DEFAULT 10,
    time_limit INTEGER DEFAULT 30,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Performance Table

```sql
CREATE TABLE performances (
    id INTEGER PRIMARY KEY,
    learner_id INTEGER NOT NULL,
    quiz_id INTEGER NOT NULL,
    score FLOAT NOT NULL,
    time_taken INTEGER,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (learner_id) REFERENCES learners(id),
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
);
```

## API Endpoints

### Learners

- `GET /api/learners` - Get all learners
- `GET /api/learners/{id}` - Get specific learner with performance
- `GET /api/analytics/learner/{id}` - Get learner analytics

### Quizzes

- `GET /api/quizzes` - Get all quizzes (with optional filtering)
- `GET /api/quizzes/{id}` - Get specific quiz
- `GET /api/topics` - Get all available topics

### Recommendations

- `POST /api/recommendations` - Get personalized recommendations
  - Parameters: `learner_id`, `method`, `n_recommendations`

### Analytics

- `GET /api/analytics/performance` - Get overall performance analytics

### Performance

- `POST /api/performance` - Submit quiz performance
  - Parameters: `learner_id`, `quiz_id`, `score`, `time_taken`

## Security Considerations

1. **Input Validation**: All API inputs are validated
2. **SQL Injection Prevention**: Using SQLAlchemy ORM
3. **CORS Configuration**: Properly configured for development
4. **Error Handling**: Comprehensive error handling and logging

## Performance Optimization

1. **Database Indexing**: Primary keys and foreign keys are indexed
2. **Caching**: Recommendation results could be cached
3. **Pagination**: API supports pagination for large datasets
4. **Lazy Loading**: Frontend components load data on demand

## Scalability Considerations

1. **Database**: Can be migrated to PostgreSQL/MySQL for production
2. **Caching**: Redis integration for recommendation caching
3. **Load Balancing**: Multiple backend instances
4. **CDN**: Static assets served via CDN
5. **Microservices**: Recommendation engine can be separated

## Deployment Architecture

### Development

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │
│   localhost:3000│◄──►│   localhost:5000│
└─────────────────┘    └─────────────────┘
```

### Production

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Load Balancer │    │   Backend       │
│   (CDN)         │◄──►│   (Nginx)       │◄──►│   (Multiple)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                              ┌─────────────────┐
                                              │   Database      │
                                              │   (PostgreSQL)  │
                                              └─────────────────┘
```

## Monitoring and Logging

1. **Application Logs**: Structured logging for debugging
2. **Performance Metrics**: API response times and throughput
3. **Error Tracking**: Comprehensive error handling and reporting
4. **User Analytics**: Track recommendation effectiveness

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live updates
2. **Advanced ML**: Deep learning models for better recommendations
3. **A/B Testing**: Framework for testing different algorithms
4. **Mobile App**: React Native mobile application
5. **Multi-tenancy**: Support for multiple organizations
