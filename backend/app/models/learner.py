from app import db
from sqlalchemy.dialects.postgresql import JSON
import json

class Learner(db.Model):
    __tablename__ = 'learners'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    topic_scores = db.Column(db.Text, default='{}')  # JSON string for topic scores
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    # Relationships
    performances = db.relationship('Performance', backref='learner', lazy=True)
    
    def __init__(self, name, email, topic_scores=None):
        self.name = name
        self.email = email
        self.topic_scores = json.dumps(topic_scores or {})
    
    @property
    def topic_scores_dict(self):
        """Get topic scores as dictionary"""
        return json.loads(self.topic_scores)
    
    @topic_scores_dict.setter
    def topic_scores_dict(self, scores):
        """Set topic scores from dictionary"""
        self.topic_scores = json.dumps(scores)
    
    def get_topic_score(self, topic):
        """Get score for a specific topic"""
        scores = self.topic_scores_dict
        return scores.get(topic, 0.0)
    
    def update_topic_score(self, topic, score):
        """Update score for a specific topic"""
        scores = self.topic_scores_dict
        scores[topic] = score
        self.topic_scores_dict = scores
    
    def get_weak_topics(self, threshold=0.6):
        """Get topics where learner performs below threshold"""
        scores = self.topic_scores_dict
        return [topic for topic, score in scores.items() if score < threshold]
    
    def to_dict(self):
        """Convert to dictionary for API response"""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'topic_scores': self.topic_scores_dict,
            'weak_topics': self.get_weak_topics(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
