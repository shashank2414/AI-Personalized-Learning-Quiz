from flask import Blueprint, request, jsonify
from app.models import Learner, Quiz, Performance, DynamicQuestion, QuizSession, QuizResponse
from app.models.recommendation_engine import recommendation_engine
from app.services.question_generator import QuestionGenerator
from app.services.openai_service import OpenAIService
from app import db
import logging
from datetime import datetime
import os

logger = logging.getLogger(__name__)

api_bp = Blueprint('api', __name__)

@api_bp.route('/learners', methods=['GET'])
def get_learners():
    """Get all learners"""
    try:
        learners = Learner.query.all()
        return jsonify({
            'success': True,
            'data': [learner.to_dict() for learner in learners],
            'count': len(learners)
        }), 200
    except Exception as e:
        logger.error(f"Error fetching learners: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch learners'
        }), 500

@api_bp.route('/learners/<int:learner_id>', methods=['GET'])
def get_learner(learner_id):
    """Get specific learner with performance data"""
    try:
        learner = Learner.query.get_or_404(learner_id)
        
        # Get learner's performance history
        performances = Performance.query.filter_by(learner_id=learner_id).all()
        performance_data = []
        
        for perf in performances:
            quiz = Quiz.query.get(perf.quiz_id)
            performance_data.append({
                'quiz': quiz.to_dict() if quiz else None,
                'performance': perf.to_dict()
            })
        
        learner_data = learner.to_dict()
        learner_data['performances'] = performance_data
        
        return jsonify({
            'success': True,
            'data': learner_data
        }), 200
    except Exception as e:
        logger.error(f"Error fetching learner {learner_id}: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch learner'
        }), 500

@api_bp.route('/quizzes', methods=['GET'])
def get_quizzes():
    """Get all quizzes with optional filtering"""
    try:
        # Get query parameters
        topic = request.args.get('topic')
        difficulty = request.args.get('difficulty')
        
        # Build query
        query = Quiz.query
        
        if topic:
            query = query.filter(Quiz.topic == topic)
        if difficulty:
            query = query.filter(Quiz.difficulty == difficulty)
        
        quizzes = query.all()
        
        return jsonify({
            'success': True,
            'data': [quiz.to_dict() for quiz in quizzes],
            'count': len(quizzes)
        }), 200
    except Exception as e:
        logger.error(f"Error fetching quizzes: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch quizzes'
        }), 500

@api_bp.route('/quizzes/<int:quiz_id>', methods=['GET'])
def get_quiz(quiz_id):
    """Get specific quiz"""
    try:
        quiz = Quiz.query.get_or_404(quiz_id)
        return jsonify({
            'success': True,
            'data': quiz.to_dict()
        }), 200
    except Exception as e:
        logger.error(f"Error fetching quiz {quiz_id}: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch quiz'
        }), 500

@api_bp.route('/recommendations', methods=['POST'])
def get_recommendations():
    """Get personalized quiz recommendations"""
    try:
        data = request.get_json()
        learner_id = data.get('learner_id', 1)  # Default to learner ID 1 for single-user system
        method = data.get('method', 'hybrid')
        n_recommendations = data.get('n_recommendations', 10)
        
        # Validate learner exists or create default learner
        learner = Learner.query.get(learner_id)
        if not learner:
            # Create a default learner for single-user system
            learner = Learner(
                name="Default User",
                email="user@example.com",
                topic_scores="{}"
            )
            db.session.add(learner)
            db.session.commit()
            learner_id = learner.id
        
        # Get recommendations
        recommendations = recommendation_engine.get_recommendations(
            learner_id, 
            n_recommendations, 
            method
        )
        
        # Format recommendations
        formatted_recs = []
        for rec in recommendations:
            if method == 'hybrid':
                formatted_recs.append({
                    'quiz': rec['quiz'].to_dict(),
                    'hybrid_score': round(rec['hybrid_score'], 4),
                    'content_score': round(rec['content_score'], 4),
                    'collaborative_score': round(rec['collaborative_score'], 4)
                })
            elif method == 'content':
                formatted_recs.append({
                    'quiz': rec['quiz'].to_dict(),
                    'content_score': round(rec['score'], 4),
                    'topic_score': round(rec['topic_score'], 4),
                    'difficulty_score': rec['difficulty_score']
                })
            elif method == 'collaborative':
                formatted_recs.append({
                    'quiz': rec['quiz'].to_dict(),
                    'collaborative_score': round(rec['score'], 4)
                })
        
        return jsonify({
            'success': True,
            'data': {
                'learner': learner.to_dict(),
                'recommendations': formatted_recs,
                'method': method,
                'count': len(formatted_recs)
            }
        }), 200
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to generate recommendations'
        }), 500

@api_bp.route('/performance', methods=['POST'])
def submit_performance():
    """Submit quiz performance"""
    try:
        data = request.get_json()
        learner_id = data.get('learner_id')
        quiz_id = data.get('quiz_id')
        score = data.get('score')
        time_taken = data.get('time_taken')
        
        if not all([learner_id, quiz_id, score]):
            return jsonify({
                'success': False,
                'error': 'learner_id, quiz_id, and score are required'
            }), 400
        
        # Validate learner and quiz exist
        learner = Learner.query.get(learner_id)
        quiz = Quiz.query.get(quiz_id)
        
        if not learner or not quiz:
            return jsonify({
                'success': False,
                'error': 'Learner or quiz not found'
            }), 404
        
        # Check if performance already exists
        existing_performance = Performance.query.filter_by(
            learner_id=learner_id,
            quiz_id=quiz_id
        ).first()
        
        if existing_performance:
            return jsonify({
                'success': False,
                'error': 'Performance already exists for this learner and quiz'
            }), 400
        
        # Create new performance record
        performance = Performance(
            learner_id=learner_id,
            quiz_id=quiz_id,
            score=score,
            time_taken=time_taken
        )
        
        db.session.add(performance)
        db.session.commit()
        
        # Update learner's topic score based on this performance
        # Simple moving average update
        current_score = learner.get_topic_score(quiz.topic)
        new_score = (current_score + (score / 100.0)) / 2
        learner.update_topic_score(quiz.topic, new_score)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': performance.to_dict()
        }), 201
    except Exception as e:
        logger.error(f"Error submitting performance: {e}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Failed to submit performance'
        }), 500

@api_bp.route('/analytics/performance', methods=['GET'])
def get_performance_analytics():
    """Get performance analytics"""
    try:
        # Get all performances
        performances = Performance.query.all()
        
        # Calculate basic statistics
        total_performances = len(performances)
        if total_performances == 0:
            return jsonify({
                'success': True,
                'data': {
                    'total_performances': 0,
                    'average_score': 0,
                    'topic_analytics': [],
                    'difficulty_analytics': []
                }
            }), 200
        
        scores = [p.score for p in performances]
        average_score = sum(scores) / len(scores)
        
        # Topic analytics
        topic_stats = {}
        for perf in performances:
            quiz = Quiz.query.get(perf.quiz_id)
            if quiz:
                topic = quiz.topic
                if topic not in topic_stats:
                    topic_stats[topic] = {'count': 0, 'total_score': 0}
                topic_stats[topic]['count'] += 1
                topic_stats[topic]['total_score'] += perf.score
        
        topic_analytics = []
        for topic, stats in topic_stats.items():
            topic_analytics.append({
                'topic': topic,
                'count': stats['count'],
                'average_score': round(stats['total_score'] / stats['count'], 2)
            })
        
        # Difficulty analytics
        difficulty_stats = {}
        for perf in performances:
            quiz = Quiz.query.get(perf.quiz_id)
            if quiz:
                difficulty = quiz.difficulty
                if difficulty not in difficulty_stats:
                    difficulty_stats[difficulty] = {'count': 0, 'total_score': 0}
                difficulty_stats[difficulty]['count'] += 1
                difficulty_stats[difficulty]['total_score'] += perf.score
        
        difficulty_analytics = []
        for difficulty, stats in difficulty_stats.items():
            difficulty_analytics.append({
                'difficulty': difficulty,
                'count': stats['count'],
                'average_score': round(stats['total_score'] / stats['count'], 2)
            })
        
        return jsonify({
            'success': True,
            'data': {
                'total_performances': total_performances,
                'average_score': round(average_score, 2),
                'topic_analytics': topic_analytics,
                'difficulty_analytics': difficulty_analytics
            }
        }), 200
    except Exception as e:
        logger.error(f"Error fetching analytics: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch analytics'
        }), 500

@api_bp.route('/analytics/learner/<int:learner_id>', methods=['GET'])
def get_learner_analytics(learner_id):
    """Get analytics for a specific learner"""
    try:
        learner = Learner.query.get_or_404(learner_id)
        
        # Get learner's performances
        performances = Performance.query.filter_by(learner_id=learner_id).all()
        
        if not performances:
            return jsonify({
                'success': True,
                'data': {
                    'learner': learner.to_dict(),
                    'total_quizzes': 0,
                    'average_score': 0,
                    'topic_performance': [],
                    'recent_performances': []
                }
            }), 200
        
        # Calculate statistics
        scores = [p.score for p in performances]
        average_score = sum(scores) / len(scores)
        
        # Topic performance
        topic_performance = {}
        for perf in performances:
            quiz = Quiz.query.get(perf.quiz_id)
            if quiz:
                topic = quiz.topic
                if topic not in topic_performance:
                    topic_performance[topic] = {'count': 0, 'total_score': 0}
                topic_performance[topic]['count'] += 1
                topic_performance[topic]['total_score'] += perf.score
        
        topic_analytics = []
        for topic, stats in topic_performance.items():
            topic_analytics.append({
                'topic': topic,
                'count': stats['count'],
                'average_score': round(stats['total_score'] / stats['count'], 2),
                'learner_score': learner.get_topic_score(topic)
            })
        
        # Recent performances (last 10)
        recent_performances = []
        sorted_performances = sorted(performances, key=lambda x: x.completed_at, reverse=True)
        for perf in sorted_performances[:10]:
            quiz = Quiz.query.get(perf.quiz_id)
            recent_performances.append({
                'quiz': quiz.to_dict() if quiz else None,
                'performance': perf.to_dict()
            })
        
        return jsonify({
            'success': True,
            'data': {
                'learner': learner.to_dict(),
                'total_quizzes': len(performances),
                'average_score': round(average_score, 2),
                'topic_performance': topic_analytics,
                'recent_performances': recent_performances
            }
        }), 200
    except Exception as e:
        logger.error(f"Error fetching learner analytics: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch learner analytics'
        }), 500

@api_bp.route('/topics', methods=['GET'])
def get_topics():
    """Get all available topics"""
    try:
        topics = Quiz.query.with_entities(Quiz.topic).distinct().all()
        topic_list = [topic[0] for topic in topics]
        
        return jsonify({
            'success': True,
            'data': topic_list,
            'count': len(topic_list)
        }), 200
    except Exception as e:
        logger.error(f"Error fetching topics: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch topics'
        }), 500

@api_bp.route('/dynamic-quiz/create-session', methods=['POST'])
def create_quiz_session():
    """Create a new quiz session with dynamic questions using OpenAI"""
    try:
        data = request.get_json()
        learner_id = data.get('learner_id', 1)  # Default to learner ID 1 for single-user system
        topics = data.get('topics', [])
        difficulty_levels = data.get('difficulty_levels', ['easy', 'medium', 'hard'])
        questions_per_topic = data.get('questions_per_topic', 3)
        
        if not topics:
            return jsonify({
                'success': False,
                'error': 'topics are required'
            }), 400
        
        # Validate learner exists or create default learner
        learner = Learner.query.get(learner_id)
        if not learner:
            # Create a default learner for single-user system
            learner = Learner(
                name="Default User",
                email="user@example.com",
                topic_scores="{}"
            )
            db.session.add(learner)
            db.session.commit()
            learner_id = learner.id
        
        # Check if OpenAI API key is configured
        openai_api_key = os.getenv('OPENAI_API_KEY')
        if not openai_api_key:
            return jsonify({
                'success': False,
                'error': 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.'
            }), 500
        
        # Generate questions using OpenAI
        openai_service = OpenAIService()
        questions = openai_service.generate_questions(
            topics=topics,
            difficulty_levels=difficulty_levels,
            num_questions_per_topic=questions_per_topic
        )
        
        if not questions:
            return jsonify({
                'success': False,
                'error': 'Failed to generate questions. Please try again.'
            }), 500
        
        # Save questions to database
        for question in questions:
            db.session.add(question)
        db.session.commit()
        
        # Create quiz session
        session = QuizSession(
            learner_id=learner_id,
            topics=topics,
            difficulty_levels=difficulty_levels,
            total_questions=len(questions)
        )
        
        db.session.add(session)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'session_id': session.id,
                'total_questions': session.total_questions,
                'topics': topics,
                'difficulty_levels': difficulty_levels,
                'questions': [q.to_dict() for q in questions]
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error creating quiz session: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to create quiz session'
        }), 500

@api_bp.route('/dynamic-quiz/submit-response', methods=['POST'])
def submit_quiz_response():
    """Submit a response to a quiz question"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        question_id = data.get('question_id')
        learner_answer = data.get('learner_answer')
        time_taken = data.get('time_taken', 0)
        
        if not all([session_id, question_id, learner_answer]):
            return jsonify({
                'success': False,
                'error': 'session_id, question_id, and learner_answer are required'
            }), 400
        
        # Get session and question
        session = QuizSession.query.get(session_id)
        question = DynamicQuestion.query.get(question_id)
        
        if not session or not question:
            return jsonify({
                'success': False,
                'error': 'Session or question not found'
            }), 404
        
        # Check if response already exists
        existing_response = QuizResponse.query.filter_by(
            session_id=session_id,
            question_id=question_id
        ).first()
        
        if existing_response:
            return jsonify({
                'success': False,
                'error': 'Response already submitted for this question'
            }), 400
        
        # Check if answer is correct
        is_correct = learner_answer.strip().lower() == question.correct_answer.strip().lower()
        
        # Create response
        response = QuizResponse(
            session_id=session_id,
            question_id=question_id,
            learner_answer=learner_answer,
            is_correct=is_correct,
            time_taken=time_taken
        )
        
        db.session.add(response)
        
        # Update session statistics
        session.questions_answered += 1
        if is_correct:
            session.correct_answers += 1
        session.time_taken += time_taken
        
        # Check if session is complete
        if session.questions_answered >= session.total_questions:
            session.complete_session()
            
            # Update learner's topic scores based on performance
            update_learner_topic_scores(session)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'is_correct': is_correct,
                'correct_answer': question.correct_answer,
                'explanation': question.explanation,
                'session_complete': session.status == 'completed',
                'session_score': session.total_score if session.status == 'completed' else None
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error submitting quiz response: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to submit response'
        }), 500

@api_bp.route('/dynamic-quiz/session/<int:session_id>', methods=['GET'])
def get_quiz_session(session_id):
    """Get quiz session details and analytics"""
    try:
        session = QuizSession.query.get_or_404(session_id)
        
        # Get all responses for this session
        responses = QuizResponse.query.filter_by(session_id=session_id).all()
        
        # Calculate topic-wise performance
        topic_performance = {}
        for response in responses:
            topic = response.question.topic
            if topic not in topic_performance:
                topic_performance[topic] = {'correct': 0, 'total': 0}
            topic_performance[topic]['total'] += 1
            if response.is_correct:
                topic_performance[topic]['correct'] += 1
        
        # Calculate difficulty-wise performance
        difficulty_performance = {}
        for response in responses:
            difficulty = response.question.difficulty
            if difficulty not in difficulty_performance:
                difficulty_performance[difficulty] = {'correct': 0, 'total': 0}
            difficulty_performance[difficulty]['total'] += 1
            if response.is_correct:
                difficulty_performance[difficulty]['correct'] += 1
        
        # Generate recommendations for improvement
        weak_topics = []
        for topic, stats in topic_performance.items():
            accuracy = (stats['correct'] / stats['total']) * 100
            if accuracy < 70:  # Consider topics with <70% accuracy as weak
                weak_topics.append({
                    'topic': topic,
                    'accuracy': accuracy,
                    'correct': stats['correct'],
                    'total': stats['total']
                })
        
        # Sort weak topics by accuracy (lowest first)
        weak_topics.sort(key=lambda x: x['accuracy'])
        
        return jsonify({
            'success': True,
            'data': {
                'session': session.to_dict(),
                'responses': [r.to_dict() for r in responses],
                'topic_performance': topic_performance,
                'difficulty_performance': difficulty_performance,
                'weak_topics': weak_topics,
                'overall_accuracy': (session.correct_answers / session.questions_answered * 100) if session.questions_answered > 0 else 0
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching quiz session {session_id}: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch quiz session'
        }), 500

@api_bp.route('/dynamic-quiz/learner-sessions/<int:learner_id>', methods=['GET'])
def get_learner_quiz_sessions(learner_id):
    """Get all quiz sessions for a learner"""
    try:
        sessions = QuizSession.query.filter_by(learner_id=learner_id).order_by(QuizSession.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [session.to_dict() for session in sessions],
            'count': len(sessions)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching learner sessions {learner_id}: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch learner sessions'
        }), 500

def update_learner_topic_scores(session):
    """Update learner's topic scores based on quiz session performance"""
    try:
        learner = session.learner
        responses = session.responses
        
        # Group responses by topic
        topic_responses = {}
        for response in responses:
            topic = response.question.topic
            if topic not in topic_responses:
                topic_responses[topic] = []
            topic_responses[topic].append(response)
        
        # Update topic scores
        topic_scores = learner.topic_scores_dict()
        for topic, responses_list in topic_responses.items():
            correct_count = sum(1 for r in responses_list if r.is_correct)
            total_count = len(responses_list)
            new_score = correct_count / total_count if total_count > 0 else 0
            
            # Update score (average with existing score if it exists)
            current_score = topic_scores.get(topic, 0)
            if current_score > 0:
                # Weighted average: 70% new score, 30% existing score
                final_score = (0.7 * new_score) + (0.3 * current_score)
            else:
                final_score = new_score
            
            topic_scores[topic] = final_score
        
        # Update learner's topic scores
        learner.topic_scores = topic_scores
        db.session.commit()
        
        logger.info(f"Updated topic scores for learner {learner.id}")
        
    except Exception as e:
        logger.error(f"Error updating learner topic scores: {e}")
        db.session.rollback()
