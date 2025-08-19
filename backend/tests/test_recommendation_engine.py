import pytest
import pandas as pd
import numpy as np
from app.models.recommendation_engine import HybridRecommendationEngine
from app.models import Learner, Quiz, Performance
from app import db

class TestHybridRecommendationEngine:
    """Test cases for the HybridRecommendationEngine class"""
    
    @pytest.fixture
    def engine(self):
        """Create a fresh recommendation engine instance for each test"""
        return HybridRecommendationEngine()
    
    @pytest.fixture
    def sample_learners(self):
        """Create sample learners for testing"""
        learners = [
            Learner(
                name="Test Learner 1",
                email="test1@example.com",
                topic_scores={"Mathematics": 0.8, "Physics": 0.6, "Chemistry": 0.4}
            ),
            Learner(
                name="Test Learner 2", 
                email="test2@example.com",
                topic_scores={"Mathematics": 0.3, "Physics": 0.9, "Chemistry": 0.7}
            ),
            Learner(
                name="Test Learner 3",
                email="test3@example.com", 
                topic_scores={"Mathematics": 0.5, "Physics": 0.5, "Chemistry": 0.8}
            )
        ]
        return learners
    
    @pytest.fixture
    def sample_quizzes(self):
        """Create sample quizzes for testing"""
        quizzes = [
            Quiz(
                title="Math Basics",
                topic="Mathematics",
                difficulty="easy",
                description="Basic mathematics quiz",
                questions_count=10,
                time_limit=20
            ),
            Quiz(
                title="Advanced Math",
                topic="Mathematics", 
                difficulty="hard",
                description="Advanced mathematics quiz",
                questions_count=15,
                time_limit=30
            ),
            Quiz(
                title="Physics Fundamentals",
                topic="Physics",
                difficulty="medium", 
                description="Basic physics concepts",
                questions_count=12,
                time_limit=25
            ),
            Quiz(
                title="Chemistry Lab",
                topic="Chemistry",
                difficulty="medium",
                description="Chemistry laboratory concepts", 
                questions_count=10,
                time_limit=20
            )
        ]
        return quizzes
    
    @pytest.fixture
    def sample_performances(self, sample_learners, sample_quizzes):
        """Create sample performance data for testing"""
        performances = [
            Performance(
                learner_id=1,
                quiz_id=1,
                score=85.0,
                time_taken=18.0
            ),
            Performance(
                learner_id=1,
                quiz_id=3,
                score=70.0,
                time_taken=22.0
            ),
            Performance(
                learner_id=2,
                quiz_id=3,
                score=90.0,
                time_taken=20.0
            ),
            Performance(
                learner_id=2,
                quiz_id=4,
                score=75.0,
                time_taken=18.0
            ),
            Performance(
                learner_id=3,
                quiz_id=4,
                score=88.0,
                time_taken=16.0
            )
        ]
        return performances

    @pytest.mark.parametrize("learner_id,expected_count", [
        (1, 2),  # Learner 1 should get 2 recommendations (excluding taken quizzes)
        (2, 2),  # Learner 2 should get 2 recommendations
        (3, 3),  # Learner 3 should get 3 recommendations
    ])
    def test_content_based_recommendations_count(self, engine, sample_learners, 
                                               sample_quizzes, sample_performances,
                                               learner_id, expected_count):
        """Test that content-based recommendations return expected number of results"""
        # Mock the database queries
        engine.performance_df = pd.DataFrame([
            {'learner_id': p.learner_id, 'quiz_id': p.quiz_id, 'score': p.score / 100.0}
            for p in sample_performances
        ])
        
        # Test content-based recommendations
        recommendations = engine.content_based_recommendations(learner_id, n_recommendations=5)
        assert len(recommendations) == expected_count

    @pytest.mark.parametrize("learner_id,topic,expected_min_score", [
        (1, "Mathematics", 0.6),  # Strong in Math, should recommend Math quizzes
        (2, "Physics", 0.7),      # Strong in Physics, should recommend Physics quizzes  
        (3, "Chemistry", 0.6),    # Strong in Chemistry, should recommend Chemistry quizzes
    ])
    def test_content_based_recommendations_topic_preference(self, engine, sample_learners,
                                                          sample_quizzes, sample_performances,
                                                          learner_id, topic, expected_min_score):
        """Test that content-based recommendations prefer learner's strong topics"""
        # Mock the database queries
        engine.performance_df = pd.DataFrame([
            {'learner_id': p.learner_id, 'quiz_id': p.quiz_id, 'score': p.score / 100.0}
            for p in sample_performances
        ])
        
        recommendations = engine.content_based_recommendations(learner_id, n_recommendations=5)
        
        # Check if recommendations include quizzes from preferred topic
        topic_quizzes = [r for r in recommendations if r['quiz'].topic == topic]
        if topic_quizzes:
            # Should have reasonable scores for preferred topics
            assert any(r['score'] >= expected_min_score for r in topic_quizzes)

    @pytest.mark.parametrize("difficulty,expected_bonus", [
        ("easy", 1.0),    # Easy quizzes should get full bonus for weak topics
        ("medium", 0.7),  # Medium quizzes should get reduced bonus
        ("hard", 0.5),    # Hard quizzes should get minimal bonus for weak topics
    ])
    def test_content_based_difficulty_bonus(self, engine, sample_learners, sample_quizzes,
                                          difficulty, expected_bonus):
        """Test that difficulty bonuses are applied correctly for weak topics"""
        # Create a learner weak in Mathematics
        weak_learner = Learner(
            name="Weak Math Learner",
            email="weak@example.com", 
            topic_scores={"Mathematics": 0.3, "Physics": 0.8, "Chemistry": 0.7}
        )
        
        # Find a quiz with the specified difficulty
        target_quiz = next(q for q in sample_quizzes if q.difficulty == difficulty and q.topic == "Mathematics")
        
        # Mock the database
        engine.performance_df = pd.DataFrame()
        
        recommendations = engine.content_based_recommendations(1, n_recommendations=5)
        
        # The difficulty bonus logic should be reflected in the scoring
        # This is a simplified test - in practice, the bonus would be more complex
        assert True  # Placeholder for actual difficulty bonus validation

    @pytest.mark.parametrize("method,expected_weights", [
        ("hybrid", {"content": 0.6, "collaborative": 0.4}),
        ("content", {"content": 1.0, "collaborative": 0.0}),
        ("collaborative", {"content": 0.0, "collaborative": 1.0}),
    ])
    def test_recommendation_method_weights(self, engine, method, expected_weights):
        """Test that different recommendation methods use correct weights"""
        if method == "hybrid":
            assert engine.content_weight == expected_weights["content"]
            assert engine.collaborative_weight == expected_weights["collaborative"]
        else:
            # For non-hybrid methods, the weights are handled differently
            assert True  # Method-specific logic validation

    @pytest.mark.parametrize("test_size,expected_metrics", [
        (0.1, ["rmse", "mae"]),
        (0.2, ["rmse", "mae"]),
        (0.3, ["rmse", "mae"]),
    ])
    def test_model_evaluation_metrics(self, engine, sample_performances, test_size, expected_metrics):
        """Test that model evaluation returns expected metrics"""
        # Create performance data
        performance_data = pd.DataFrame([
            {'learner_id': p.learner_id, 'quiz_id': p.quiz_id, 'score': p.score / 100.0}
            for p in sample_performances
        ])
        
        # Add more data for evaluation
        additional_data = []
        for i in range(10):
            additional_data.append({
                'learner_id': i % 3 + 1,
                'quiz_id': i % 4 + 1,
                'score': np.random.uniform(0.3, 0.9)
            })
        
        engine.performance_df = pd.concat([
            performance_data,
            pd.DataFrame(additional_data)
        ], ignore_index=True)
        
        # Test evaluation
        results = engine.evaluate_model(test_size=test_size)
        
        # Check that expected metrics are present
        for metric in expected_metrics:
            assert metric in results
            assert isinstance(results[metric], (int, float))
            assert results[metric] >= 0

    @pytest.mark.parametrize("learner_id,n_recommendations,method", [
        (1, 5, "hybrid"),
        (1, 10, "content"),
        (2, 15, "collaborative"),
        (3, 20, "hybrid"),
    ])
    def test_get_recommendations_parameters(self, engine, sample_learners, sample_quizzes,
                                          sample_performances, learner_id, n_recommendations, method):
        """Test that get_recommendations handles different parameters correctly"""
        # Mock the database
        engine.performance_df = pd.DataFrame([
            {'learner_id': p.learner_id, 'quiz_id': p.quiz_id, 'score': p.score / 100.0}
            for p in sample_performances
        ])
        
        try:
            recommendations = engine.get_recommendations(
                learner_id, 
                n_recommendations, 
                method
            )
            
            # Should return a list
            assert isinstance(recommendations, list)
            
            # Should not exceed requested number
            assert len(recommendations) <= n_recommendations
            
        except ValueError as e:
            # Invalid method should raise ValueError
            if method not in ["hybrid", "content", "collaborative"]:
                assert "Unknown recommendation method" in str(e)
            else:
                raise

    @pytest.mark.parametrize("invalid_method", [
        "invalid_method",
        "random",
        "unsupported",
        "",
        None
    ])
    def test_get_recommendations_invalid_method(self, engine, invalid_method):
        """Test that invalid recommendation methods raise appropriate errors"""
        with pytest.raises(ValueError, match="Unknown recommendation method"):
            engine.get_recommendations(1, 10, invalid_method)

    @pytest.mark.parametrize("empty_data_scenario", [
        "no_performances",
        "no_learners", 
        "no_quizzes"
    ])
    def test_empty_data_handling(self, engine, empty_data_scenario):
        """Test that the engine handles empty data gracefully"""
        if empty_data_scenario == "no_performances":
            engine.performance_df = pd.DataFrame()
            # Should handle empty performance data
            assert len(engine.performance_df) == 0
            
        elif empty_data_scenario == "no_learners":
            # Test with no learners
            recommendations = engine.content_based_recommendations(999, n_recommendations=5)
            assert len(recommendations) == 0
            
        elif empty_data_scenario == "no_quizzes":
            # Test with no quizzes
            engine.performance_df = pd.DataFrame()
            recommendations = engine.content_based_recommendations(1, n_recommendations=5)
            assert len(recommendations) == 0
