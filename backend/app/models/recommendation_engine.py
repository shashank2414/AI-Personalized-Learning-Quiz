import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics import mean_squared_error, mean_absolute_error
from app.models import Learner, Quiz, Performance
from app import db
import logging

logger = logging.getLogger(__name__)

class HybridRecommendationEngine:
    def __init__(self):
        self.content_weight = 0.6
        self.collaborative_weight = 0.4
        self.svd_model = None
        self.scaler = StandardScaler()
        
    def prepare_data(self):
        """Prepare data for recommendation models"""
        # Get all performances
        performances = Performance.query.all()
        
        # Create performance matrix
        data = []
        for perf in performances:
            data.append({
                'learner_id': perf.learner_id,
                'quiz_id': perf.quiz_id,
                'score': perf.score / 100.0  # Normalize to 0-1
            })
        
        self.performance_df = pd.DataFrame(data)
        
        # Get all learners and quizzes
        learners = Learner.query.all()
        quizzes = Quiz.query.all()
        
        # Create learner features
        learner_features = []
        for learner in learners:
            features = {
                'learner_id': learner.id,
                **learner.topic_scores_dict
            }
            learner_features.append(features)
        
        self.learner_df = pd.DataFrame(learner_features)
        
        # Create quiz features
        quiz_features = []
        for quiz in quizzes:
            features = {
                'quiz_id': quiz.id,
                'topic': quiz.topic,
                'difficulty_score': quiz.get_difficulty_score(),
                'questions_count': quiz.questions_count,
                'time_limit': quiz.time_limit
            }
            quiz_features.append(features)
        
        self.quiz_df = pd.DataFrame(quiz_features)
        
        return self.performance_df, self.learner_df, self.quiz_df
    
    def train_collaborative_model(self):
        """Train collaborative filtering model using SVD"""
        if self.performance_df.empty:
            logger.warning("No performance data available for collaborative filtering")
            return
        
        # Create user-item matrix
        user_item_matrix = self.performance_df.pivot(
            index='learner_id', 
            columns='quiz_id', 
            values='score'
        ).fillna(0)
        
        # Apply SVD
        self.svd_model = TruncatedSVD(n_components=min(50, min(user_item_matrix.shape) - 1), random_state=42)
        self.user_factors = self.svd_model.fit_transform(user_item_matrix)
        self.item_factors = self.svd_model.components_
        
        # Store the matrix for predictions
        self.user_item_matrix = user_item_matrix
        
        logger.info(f"Collaborative filtering model trained with {self.svd_model.n_components} components")
    
    def predict_collaborative_score(self, learner_id, quiz_id):
        """Predict collaborative filtering score for a learner-quiz pair"""
        if self.svd_model is None or learner_id not in self.user_item_matrix.index or quiz_id not in self.user_item_matrix.columns:
            return 0.5  # Default score
        
        learner_idx = self.user_item_matrix.index.get_loc(learner_id)
        quiz_idx = self.user_item_matrix.columns.get_loc(quiz_id)
        
        # Predict using SVD factors
        prediction = np.dot(self.user_factors[learner_idx], self.item_factors[:, quiz_idx])
        return max(0.0, min(1.0, prediction))  # Clamp between 0 and 1
    
    def content_based_recommendations(self, learner_id, n_recommendations=10):
        """Generate content-based recommendations"""
        learner = Learner.query.get(learner_id)
        if not learner:
            return []
        
        # Get learner's topic scores
        learner_scores = learner.topic_scores_dict
        
        # Get all quizzes
        quizzes = Quiz.query.all()
        
        # Calculate content-based scores
        quiz_scores = []
        for quiz in quizzes:
            # Check if learner has already taken this quiz
            existing_performance = Performance.query.filter_by(
                learner_id=learner_id, 
                quiz_id=quiz.id
            ).first()
            
            if existing_performance:
                continue
            
            # Calculate content score based on topic match and difficulty
            topic_score = learner_scores.get(quiz.topic, 0.5)
            difficulty_score = quiz.get_difficulty_score()
            
            # Prefer quizzes in weak topics with appropriate difficulty
            if topic_score < 0.6:  # Weak topic
                # Recommend easier quizzes for weak topics
                difficulty_bonus = 1.0 if difficulty_score <= 2 else 0.5
            else:
                # Recommend harder quizzes for strong topics
                difficulty_bonus = 1.0 if difficulty_score >= 2 else 0.7
            
            # Calculate final score
            content_score = topic_score * difficulty_bonus
            
            quiz_scores.append({
                'quiz': quiz,
                'score': content_score,
                'topic_score': topic_score,
                'difficulty_score': difficulty_score
            })
        
        # Sort by score and return top recommendations
        quiz_scores.sort(key=lambda x: x['score'], reverse=True)
        return quiz_scores[:n_recommendations]
    
    def collaborative_recommendations(self, learner_id, n_recommendations=10):
        """Generate collaborative filtering recommendations"""
        if not self.svd_model:
            logger.warning("Collaborative model not trained")
            return []
        
        # Get all quizzes
        quizzes = Quiz.query.all()
        
        # Get learner's existing performances
        existing_quizzes = set()
        performances = Performance.query.filter_by(learner_id=learner_id).all()
        for perf in performances:
            existing_quizzes.add(perf.quiz_id)
        
        # Calculate predictions for all quizzes
        quiz_scores = []
        for quiz in quizzes:
            if quiz.id in existing_quizzes:
                continue
            
            try:
                collaborative_score = self.predict_collaborative_score(learner_id, quiz.id)
                quiz_scores.append({
                    'quiz': quiz,
                    'score': collaborative_score
                })
            except Exception as e:
                logger.warning(f"Error predicting for learner {learner_id}, quiz {quiz.id}: {e}")
                continue
        
        # Sort by score and return top recommendations
        quiz_scores.sort(key=lambda x: x['score'], reverse=True)
        return quiz_scores[:n_recommendations]
    
    def hybrid_recommendations(self, learner_id, n_recommendations=10):
        """Generate hybrid recommendations combining content-based and collaborative filtering"""
        # Get content-based recommendations
        content_recs = self.content_based_recommendations(learner_id, n_recommendations * 2)
        
        # Get collaborative recommendations
        collaborative_recs = self.collaborative_recommendations(learner_id, n_recommendations * 2)
        
        # Create quiz score mapping
        quiz_scores = {}
        
        # Add content-based scores
        for rec in content_recs:
            quiz_id = rec['quiz'].id
            if quiz_id not in quiz_scores:
                quiz_scores[quiz_id] = {'quiz': rec['quiz'], 'content_score': rec['score'], 'collaborative_score': 0}
            else:
                quiz_scores[quiz_id]['content_score'] = rec['score']
        
        # Add collaborative scores
        for rec in collaborative_recs:
            quiz_id = rec['quiz'].id
            if quiz_id not in quiz_scores:
                quiz_scores[quiz_id] = {'quiz': rec['quiz'], 'content_score': 0, 'collaborative_score': rec['score']}
            else:
                quiz_scores[quiz_id]['collaborative_score'] = rec['score']
        
        # Calculate hybrid scores
        hybrid_recs = []
        for quiz_id, scores in quiz_scores.items():
            hybrid_score = (
                self.content_weight * scores['content_score'] +
                self.collaborative_weight * scores['collaborative_score']
            )
            
            hybrid_recs.append({
                'quiz': scores['quiz'],
                'hybrid_score': hybrid_score,
                'content_score': scores['content_score'],
                'collaborative_score': scores['collaborative_score']
            })
        
        # Sort by hybrid score and return top recommendations
        hybrid_recs.sort(key=lambda x: x['hybrid_score'], reverse=True)
        return hybrid_recs[:n_recommendations]
    
    def get_recommendations(self, learner_id, n_recommendations=10, method='hybrid'):
        """Get recommendations using specified method"""
        # Prepare data if not already done
        if not hasattr(self, 'performance_df'):
            self.prepare_data()
        
        # Train collaborative model if needed
        if method in ['collaborative', 'hybrid'] and not self.svd_model:
            self.train_collaborative_model()
        
        if method == 'content':
            return self.content_based_recommendations(learner_id, n_recommendations)
        elif method == 'collaborative':
            return self.collaborative_recommendations(learner_id, n_recommendations)
        elif method == 'hybrid':
            return self.hybrid_recommendations(learner_id, n_recommendations)
        else:
            raise ValueError(f"Unknown recommendation method: {method}")
    
    def evaluate_model(self, test_size=0.2):
        """Evaluate the recommendation model"""
        if self.performance_df.empty:
            return {}
        
        # Split data into train and test
        from sklearn.model_selection import train_test_split
        
        train_data, test_data = train_test_split(
            self.performance_df, 
            test_size=test_size, 
            random_state=42
        )
        
        # Create train matrix
        train_matrix = train_data.pivot(
            index='learner_id', 
            columns='quiz_id', 
            values='score'
        ).fillna(0)
        
        # Train model on training data
        svd_model = TruncatedSVD(n_components=min(50, min(train_matrix.shape) - 1), random_state=42)
        user_factors = svd_model.fit_transform(train_matrix)
        item_factors = svd_model.components_
        
        # Evaluate on test data
        predictions = []
        actuals = []
        
        for _, row in test_data.iterrows():
            try:
                if row['learner_id'] in train_matrix.index and row['quiz_id'] in train_matrix.columns:
                    learner_idx = train_matrix.index.get_loc(row['learner_id'])
                    quiz_idx = train_matrix.columns.get_loc(row['quiz_id'])
                    pred = np.dot(user_factors[learner_idx], item_factors[:, quiz_idx])
                    pred = max(0.0, min(1.0, pred))
                    predictions.append(pred)
                    actuals.append(row['score'])
            except:
                continue
        
        if len(predictions) == 0:
            return {'rmse': 0, 'mae': 0, 'test_size': 0, 'train_size': len(train_data)}
        
        # Calculate metrics
        rmse = np.sqrt(mean_squared_error(actuals, predictions))
        mae = mean_absolute_error(actuals, predictions)
        
        return {
            'rmse': rmse,
            'mae': mae,
            'test_size': len(test_data),
            'train_size': len(train_data)
        }

# Global recommendation engine instance
recommendation_engine = HybridRecommendationEngine()
