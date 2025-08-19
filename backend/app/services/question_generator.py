import random
from app.models import DynamicQuestion
from app import db
import logging

logger = logging.getLogger(__name__)

class QuestionGenerator:
    """Service for generating dynamic questions based on topics and difficulty levels"""
    
    # Question templates for different topics and difficulty levels
    QUESTION_TEMPLATES = {
        'python': {
            'easy': [
                {
                    'type': 'multiple_choice',
                    'question': 'What is the correct way to create a variable in Python?',
                    'options': ['var x = 5', 'x = 5', 'let x = 5', 'const x = 5'],
                    'correct': 'x = 5',
                    'explanation': 'In Python, variables are created by simply assigning a value using the = operator.'
                },
                {
                    'type': 'true_false',
                    'question': 'Python is a compiled language.',
                    'correct': 'False',
                    'explanation': 'Python is an interpreted language, not compiled.'
                },
                {
                    'type': 'fill_blank',
                    'question': 'To print text in Python, use the _____ function.',
                    'correct': 'print',
                    'explanation': 'The print() function is used to output text to the console.'
                }
            ],
            'medium': [
                {
                    'type': 'multiple_choice',
                    'question': 'What is the output of: print(type([]))?',
                    'options': ['<class \'list\'>', '<class \'array\'>', '<class \'tuple\'>', '<class \'set\'>'],
                    'correct': '<class \'list\'>',
                    'explanation': 'The type() function returns the class of an object. [] creates a list.'
                },
                {
                    'type': 'multiple_choice',
                    'question': 'Which method is used to add an element to a list?',
                    'options': ['add()', 'append()', 'insert()', 'push()'],
                    'correct': 'append()',
                    'explanation': 'The append() method adds an element to the end of a list.'
                }
            ],
            'hard': [
                {
                    'type': 'multiple_choice',
                    'question': 'What is a decorator in Python?',
                    'options': ['A function that modifies another function', 'A type of variable', 'A loop construct', 'A data structure'],
                    'correct': 'A function that modifies another function',
                    'explanation': 'Decorators are functions that modify the behavior of other functions.'
                },
                {
                    'type': 'short_answer',
                    'question': 'Explain the difference between __init__ and __new__ methods in Python.',
                    'correct': '__new__ creates the instance, __init__ initializes it',
                    'explanation': '__new__ is called first to create the instance, then __init__ is called to initialize it.'
                }
            ]
        },
        'javascript': {
            'easy': [
                {
                    'type': 'multiple_choice',
                    'question': 'How do you declare a variable in JavaScript?',
                    'options': ['var x = 5', 'let x = 5', 'const x = 5', 'All of the above'],
                    'correct': 'All of the above',
                    'explanation': 'JavaScript supports var, let, and const for variable declaration.'
                },
                {
                    'type': 'true_false',
                    'question': 'JavaScript is a statically typed language.',
                    'correct': 'False',
                    'explanation': 'JavaScript is dynamically typed, not statically typed.'
                }
            ],
            'medium': [
                {
                    'type': 'multiple_choice',
                    'question': 'What is the difference between == and === in JavaScript?',
                    'options': ['No difference', '== checks value, === checks value and type', '=== is faster', '== is deprecated'],
                    'correct': '== checks value, === checks value and type',
                    'explanation': '== performs type coercion, === checks both value and type.'
                }
            ],
            'hard': [
                {
                    'type': 'multiple_choice',
                    'question': 'What is closure in JavaScript?',
                    'options': ['A function that has access to variables in its outer scope', 'A way to close browser tabs', 'A method to end loops', 'A type of variable'],
                    'correct': 'A function that has access to variables in its outer scope',
                    'explanation': 'Closures allow functions to access variables from their outer scope even after the outer function has returned.'
                }
            ]
        },
        'machine_learning': {
            'easy': [
                {
                    'type': 'multiple_choice',
                    'question': 'What is supervised learning?',
                    'options': ['Learning without labels', 'Learning with labeled data', 'Learning from rewards', 'Learning from environment'],
                    'correct': 'Learning with labeled data',
                    'explanation': 'Supervised learning uses labeled training data to learn patterns.'
                }
            ],
            'medium': [
                {
                    'type': 'multiple_choice',
                    'question': 'What is overfitting in machine learning?',
                    'options': ['Model performs well on training data but poorly on new data', 'Model is too simple', 'Model has too few parameters', 'Model is too fast'],
                    'correct': 'Model performs well on training data but poorly on new data',
                    'explanation': 'Overfitting occurs when a model learns the training data too well and fails to generalize.'
                }
            ],
            'hard': [
                {
                    'type': 'multiple_choice',
                    'question': 'What is the difference between bagging and boosting?',
                    'options': ['Bagging reduces variance, boosting reduces bias', 'They are the same thing', 'Bagging is faster', 'Boosting is simpler'],
                    'correct': 'Bagging reduces variance, boosting reduces bias',
                    'explanation': 'Bagging (Bootstrap Aggregating) reduces variance, while boosting reduces bias.'
                }
            ]
        },
        'data_science': {
            'easy': [
                {
                    'type': 'multiple_choice',
                    'question': 'What is a DataFrame?',
                    'options': ['A 2D labeled data structure', 'A type of graph', 'A database table', 'A programming language'],
                    'correct': 'A 2D labeled data structure',
                    'explanation': 'A DataFrame is a 2D labeled data structure with columns that can be of different types.'
                }
            ],
            'medium': [
                {
                    'type': 'multiple_choice',
                    'question': 'What is the purpose of data normalization?',
                    'options': ['To make data fit in memory', 'To scale features to similar ranges', 'To remove outliers', 'To sort data'],
                    'correct': 'To scale features to similar ranges',
                    'explanation': 'Normalization scales features to a similar range, often between 0 and 1.'
                }
            ],
            'hard': [
                {
                    'type': 'multiple_choice',
                    'question': 'What is the curse of dimensionality?',
                    'options': ['Data becomes sparse in high dimensions', 'Computers get slower', 'Memory usage increases', 'Algorithms become simpler'],
                    'correct': 'Data becomes sparse in high dimensions',
                    'explanation': 'As dimensions increase, data becomes increasingly sparse, making it harder to find patterns.'
                }
            ]
        },
        'web_development': {
            'easy': [
                {
                    'type': 'multiple_choice',
                    'question': 'What does HTML stand for?',
                    'options': ['HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlink and Text Markup Language'],
                    'correct': 'HyperText Markup Language',
                    'explanation': 'HTML stands for HyperText Markup Language.'
                }
            ],
            'medium': [
                {
                    'type': 'multiple_choice',
                    'question': 'What is the purpose of CSS?',
                    'options': ['To style web pages', 'To create databases', 'To write server code', 'To handle user input'],
                    'correct': 'To style web pages',
                    'explanation': 'CSS (Cascading Style Sheets) is used to style and layout web pages.'
                }
            ],
            'hard': [
                {
                    'type': 'multiple_choice',
                    'question': 'What is the difference between GET and POST requests?',
                    'options': ['GET is for reading, POST is for creating/updating', 'GET is faster', 'POST is more secure', 'All of the above'],
                    'correct': 'All of the above',
                    'explanation': 'GET is typically for reading data, POST for creating/updating, and POST is more secure as data is not in URL.'
                }
            ]
        }
    }
    
    @classmethod
    def generate_questions(cls, topics, difficulty_levels, num_questions_per_topic=3):
        """Generate questions for given topics and difficulty levels"""
        questions = []
        
        for topic in topics:
            if topic not in cls.QUESTION_TEMPLATES:
                logger.warning(f"No questions available for topic: {topic}")
                continue
                
            for difficulty in difficulty_levels:
                if difficulty not in cls.QUESTION_TEMPLATES[topic]:
                    logger.warning(f"No {difficulty} questions available for topic: {topic}")
                    continue
                
                # Get available questions for this topic and difficulty
                available_questions = cls.QUESTION_TEMPLATES[topic][difficulty]
                
                # Select random questions (up to num_questions_per_topic)
                selected_questions = random.sample(
                    available_questions, 
                    min(num_questions_per_topic, len(available_questions))
                )
                
                # Create DynamicQuestion objects
                for q_data in selected_questions:
                    question = DynamicQuestion(
                        topic=topic,
                        difficulty=difficulty,
                        question_type=q_data['type'],
                        question_text=q_data['question'],
                        options=q_data.get('options'),
                        correct_answer=q_data['correct'],
                        explanation=q_data.get('explanation', '')
                    )
                    questions.append(question)
        
        return questions
    
    @classmethod
    def save_questions_to_db(cls, questions):
        """Save generated questions to database"""
        try:
            for question in questions:
                db.session.add(question)
            db.session.commit()
            logger.info(f"Saved {len(questions)} questions to database")
            return True
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error saving questions to database: {e}")
            return False
    
    @classmethod
    def get_questions_from_db(cls, topics=None, difficulties=None, limit=None):
        """Get questions from database with optional filtering"""
        query = DynamicQuestion.query
        
        if topics:
            query = query.filter(DynamicQuestion.topic.in_(topics))
        if difficulties:
            query = query.filter(DynamicQuestion.difficulty.in_(difficulties))
        
        if limit:
            query = query.limit(limit)
        
        return query.all()
