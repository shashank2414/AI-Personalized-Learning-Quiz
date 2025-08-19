from app import db
from datetime import datetime

class QuizSession(db.Model):
    __tablename__ = 'quiz_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    learner_id = db.Column(db.Integer, db.ForeignKey('learners.id'), nullable=False)
    topics = db.Column(db.JSON, nullable=False)  # List of selected topics
    difficulty_levels = db.Column(db.JSON, nullable=False)  # List of difficulty levels
    total_questions = db.Column(db.Integer, nullable=False)
    questions_answered = db.Column(db.Integer, default=0)
    correct_answers = db.Column(db.Integer, default=0)
    total_score = db.Column(db.Float, default=0.0)
    time_taken = db.Column(db.Integer, default=0)  # in seconds
    status = db.Column(db.String(20), default='in_progress')  # in_progress, completed, abandoned
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    # Relationship
    learner = db.relationship('Learner', backref='quiz_sessions')
    responses = db.relationship('QuizResponse', backref='session', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'learner_id': self.learner_id,
            'topics': self.topics,
            'difficulty_levels': self.difficulty_levels,
            'total_questions': self.total_questions,
            'questions_answered': self.questions_answered,
            'correct_answers': self.correct_answers,
            'total_score': self.total_score,
            'time_taken': self.time_taken,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'accuracy': (self.correct_answers / self.questions_answered * 100) if self.questions_answered > 0 else 0
        }
    
    def complete_session(self):
        """Mark session as completed"""
        self.status = 'completed'
        self.completed_at = datetime.utcnow()
        self.total_score = (self.correct_answers / self.total_questions) * 100 if self.total_questions > 0 else 0

class QuizResponse(db.Model):
    __tablename__ = 'quiz_responses'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('quiz_sessions.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('dynamic_questions.id'), nullable=False)
    learner_answer = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False)
    time_taken = db.Column(db.Integer, default=0)  # in seconds
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    question = db.relationship('DynamicQuestion')
    
    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'question_id': self.question_id,
            'learner_answer': self.learner_answer,
            'is_correct': self.is_correct,
            'time_taken': self.time_taken,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'question': self.question.to_dict() if self.question else None
        }
