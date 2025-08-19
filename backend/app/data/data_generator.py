import random
from datetime import datetime, timedelta
from app.models import Learner, Quiz, Performance, DynamicQuestion, QuizSession, QuizResponse
from app.services.question_generator import QuestionGenerator
from app import db
import logging
import os

logger = logging.getLogger(__name__)

def generate_learners():
    """Generate 50 learners with realistic data"""
    learners = []
    first_names = [
        "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry", "Ivy", "Jack",
        "Kate", "Liam", "Mia", "Noah", "Olivia", "Paul", "Quinn", "Ruby", "Sam", "Tara",
        "Uma", "Victor", "Wendy", "Xander", "Yara", "Zoe", "Alex", "Blake", "Casey", "Drew",
        "Emery", "Finley", "Gray", "Harper", "Indigo", "Jordan", "Kai", "Luna", "Morgan", "Nova",
        "Ocean", "Parker", "Quincy", "River", "Sage", "Taylor", "Unity", "Val", "Winter", "Xen"
    ]
    
    last_names = [
        "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
        "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
        "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
        "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
        "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"
    ]
    
    topics = ["python", "javascript", "machine_learning", "data_science", "web_development", "sql", "react", "nodejs", "docker", "kubernetes"]
    
    used_emails = set()
    
    for i in range(50):
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)
        name = f"{first_name} {last_name}"
        
        # Generate unique email
        base_email = f"{first_name.lower()}.{last_name.lower()}@example.com"
        email = base_email
        counter = 1
        while email in used_emails:
            email = f"{first_name.lower()}.{last_name.lower()}{counter}@example.com"
            counter += 1
        used_emails.add(email)
        
        # Generate topic scores (0.0 to 1.0)
        topic_scores = {}
        for topic in topics:
            # Some learners are better at certain topics
            if random.random() < 0.3:  # 30% chance of being good at a topic
                score = random.uniform(0.7, 1.0)
            elif random.random() < 0.5:  # 50% chance of being average
                score = random.uniform(0.4, 0.7)
            else:  # 20% chance of being weak
                score = random.uniform(0.1, 0.4)
            topic_scores[topic] = round(score, 2)
        
        learner = Learner(
            name=name,
            email=email,
            topic_scores=topic_scores
        )
        learners.append(learner)
    
    return learners

def generate_quizzes():
    """Generate 100 quizzes across different topics and difficulties"""
    quizzes = []
    topics = ["python", "javascript", "machine_learning", "data_science", "web_development", "sql", "react", "nodejs", "docker", "kubernetes"]
    difficulties = ["easy", "medium", "hard"]
    
    quiz_titles = {
        "python": [
            "Python Basics", "Data Types in Python", "Control Structures", "Functions and Methods",
            "Object-Oriented Programming", "File Handling", "Exception Handling", "List Comprehensions",
            "Decorators and Generators", "Python Libraries"
        ],
        "javascript": [
            "JavaScript Fundamentals", "Variables and Data Types", "Functions and Scope", "Objects and Arrays",
            "DOM Manipulation", "Event Handling", "Async Programming", "ES6 Features",
            "Modules and Imports", "Error Handling"
        ],
        "machine_learning": [
            "ML Fundamentals", "Supervised Learning", "Unsupervised Learning", "Model Evaluation",
            "Feature Engineering", "Neural Networks", "Deep Learning", "Natural Language Processing",
            "Computer Vision", "Model Deployment"
        ],
        "data_science": [
            "Data Analysis Basics", "Statistical Concepts", "Data Visualization", "Data Cleaning",
            "Exploratory Data Analysis", "Hypothesis Testing", "Regression Analysis", "Classification",
            "Clustering", "Time Series Analysis"
        ],
        "web_development": [
            "HTML Fundamentals", "CSS Styling", "Responsive Design", "JavaScript Basics",
            "Frontend Frameworks", "Backend Development", "Database Design", "API Development",
            "Authentication", "Deployment"
        ],
        "sql": [
            "SQL Basics", "SELECT Statements", "WHERE Clauses", "JOIN Operations",
            "Aggregate Functions", "Subqueries", "Indexing", "Stored Procedures",
            "Database Design", "Performance Optimization"
        ],
        "react": [
            "React Fundamentals", "Components and Props", "State Management", "Hooks",
            "Event Handling", "Conditional Rendering", "Lists and Keys", "Forms",
            "Routing", "State Management (Redux)"
        ],
        "nodejs": [
            "Node.js Basics", "Express Framework", "Middleware", "Routing",
            "Database Integration", "Authentication", "Error Handling", "Testing",
            "Deployment", "Performance"
        ],
        "docker": [
            "Docker Basics", "Containers", "Images", "Dockerfile",
            "Docker Compose", "Networking", "Volumes", "Multi-stage Builds",
            "Security", "Best Practices"
        ],
        "kubernetes": [
            "K8s Fundamentals", "Pods and Deployments", "Services", "ConfigMaps and Secrets",
            "Persistent Volumes", "Ingress", "Helm Charts", "Monitoring",
            "Scaling", "Security"
        ]
    }
    
    for topic in topics:
        for difficulty in difficulties:
            for i in range(3):  # 3 quizzes per topic-difficulty combination
                title = f"{random.choice(quiz_titles[topic])} - {difficulty.title()}"
                description = f"Test your knowledge of {topic} with {difficulty} level questions."
                questions_count = random.randint(5, 15)
                time_limit = random.randint(10, 30)  # minutes
                
                quiz = Quiz(
                    title=title,
                    topic=topic,
                    difficulty=difficulty,
                    description=description,
                    questions_count=questions_count,
                    time_limit=time_limit
                )
                quizzes.append(quiz)
    
    return quizzes

def generate_performance_data(learners, quizzes):
    """Generate performance data for learners taking quizzes"""
    performances = []
    
    for learner in learners:
        # Each learner takes 5-15 quizzes
        num_quizzes = random.randint(5, 15)
        selected_quizzes = random.sample(quizzes, min(num_quizzes, len(quizzes)))
        
        for quiz in selected_quizzes:
            # Get learner's topic score for this quiz's topic
            topic_score = learner.get_topic_score(quiz.topic)
            
            # Base score on topic proficiency and difficulty
            difficulty_factor = {"easy": 1.0, "medium": 0.8, "hard": 0.6}[quiz.difficulty]
            base_score = topic_score * difficulty_factor
            
            # Add some randomness (±20%)
            score_variation = random.uniform(-0.2, 0.2)
            final_score = max(0.0, min(1.0, base_score + score_variation))
            
            # Generate time taken (based on difficulty and score)
            base_time = {"easy": 5, "medium": 8, "hard": 12}[quiz.difficulty]
            time_variation = random.uniform(0.7, 1.3)
            time_taken = int(base_time * time_variation * 60)  # Convert to seconds
            
            # Generate completion date (within last 30 days)
            days_ago = random.randint(0, 30)
            completed_at = datetime.utcnow() - timedelta(days=days_ago)
            
            performance = Performance(
                learner_id=learner.id,
                quiz_id=quiz.id,
                score=round(final_score * 100, 1),  # Convert to percentage
                time_taken=time_taken
            )
            performances.append(performance)
    
    return performances

def generate_dynamic_questions():
    """Generate initial dynamic questions for all topics and difficulties"""
    topics = ["python", "javascript", "machine_learning", "data_science", "web_development"]
    difficulties = ["easy", "medium", "hard"]
    
    questions = QuestionGenerator.generate_questions(
        topics=topics,
        difficulty_levels=difficulties,
        num_questions_per_topic=5  # Generate 5 questions per topic-difficulty combination
    )
    
    return questions

def initialize_data():
    """Initialize the database with sample data"""
    try:
        # Check if data already exists
        existing_learners = Learner.query.count()
        if existing_learners > 0:
            logger.info("Data already exists in database. Skipping initialization.")
            return
        
        logger.info("Generating synthetic data...")
        
        # Generate and save learners
        learners = generate_learners()
        for learner in learners:
            db.session.add(learner)
        db.session.commit()
        logger.info(f"Generated {len(learners)} learners")
        
        # Generate and save quizzes
        quizzes = generate_quizzes()
        for quiz in quizzes:
            db.session.add(quiz)
        db.session.commit()
        logger.info(f"Generated {len(quizzes)} quizzes")
        
        # Generate and save performance data
        performances = generate_performance_data(learners, quizzes)
        for performance in performances:
            db.session.add(performance)
        db.session.commit()
        logger.info(f"Generated {len(performances)} performance records")
        
        # Generate and save dynamic questions (only if OpenAI is available)
        try:
            openai_api_key = os.getenv('OPENAI_API_KEY')
            if openai_api_key:
                logger.info("OpenAI API key found. Generating dynamic questions...")
                dynamic_questions = generate_dynamic_questions()
                for question in dynamic_questions:
                    db.session.add(question)
                db.session.commit()
                logger.info(f"Generated {len(dynamic_questions)} dynamic questions")
            else:
                logger.info("OpenAI API key not found. Skipping dynamic question generation.")
        except Exception as e:
            logger.warning(f"Could not generate dynamic questions: {e}")
        
        logger.info("Data initialization completed!")
        
    except Exception as e:
        logger.error(f"Error initializing data: {e}")
        db.session.rollback()
        raise
