from app import db
from datetime import datetime

class Performance(db.Model):
    __tablename__ = 'performances'
    
    id = db.Column(db.Integer, primary_key=True)
    learner_id = db.Column(db.Integer, db.ForeignKey('learners.id'), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    score = db.Column(db.Float, nullable=False)  # Score as percentage (0-100)
    time_taken = db.Column(db.Integer)  # Time taken in minutes
    completed_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    def __init__(self, learner_id, quiz_id, score, time_taken=None):
        self.learner_id = learner_id
        self.quiz_id = quiz_id
        self.score = score
        self.time_taken = time_taken
    
    def get_performance_level(self):
        """Get performance level based on score"""
        if self.score >= 90:
            return 'excellent'
        elif self.score >= 80:
            return 'good'
        elif self.score >= 70:
            return 'average'
        elif self.score >= 60:
            return 'below_average'
        else:
            return 'poor'
    
    def to_dict(self):
        """Convert to dictionary for API response"""
        return {
            'id': self.id,
            'learner_id': self.learner_id,
            'quiz_id': self.quiz_id,
            'score': self.score,
            'time_taken': self.time_taken,
            'performance_level': self.get_performance_level(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
