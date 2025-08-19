from app import db
from enum import Enum

class DifficultyLevel(Enum):
    EASY = 'easy'
    MEDIUM = 'medium'
    HARD = 'hard'

class Quiz(db.Model):
    __tablename__ = 'quizzes'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    topic = db.Column(db.String(100), nullable=False)
    difficulty = db.Column(db.String(20), nullable=False)
    description = db.Column(db.Text)
    questions_count = db.Column(db.Integer, default=10)
    time_limit = db.Column(db.Integer, default=30)  # minutes
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    # Relationships
    performances = db.relationship('Performance', backref='quiz', lazy=True)
    
    def __init__(self, title, topic, difficulty, description=None, questions_count=10, time_limit=30):
        self.title = title
        self.topic = topic
        self.difficulty = difficulty
        self.description = description
        self.questions_count = questions_count
        self.time_limit = time_limit
    
    @property
    def difficulty_level(self):
        """Get difficulty as enum"""
        return DifficultyLevel(self.difficulty)
    
    def get_difficulty_score(self):
        """Get numerical difficulty score"""
        difficulty_scores = {
            'easy': 1,
            'medium': 2,
            'hard': 3
        }
        return difficulty_scores.get(self.difficulty, 2)
    
    def to_dict(self):
        """Convert to dictionary for API response"""
        return {
            'id': self.id,
            'title': self.title,
            'topic': self.topic,
            'difficulty': self.difficulty,
            'description': self.description,
            'questions_count': self.questions_count,
            'time_limit': self.time_limit,
            'difficulty_score': self.get_difficulty_score(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
