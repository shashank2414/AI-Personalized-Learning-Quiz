import os
import json
import logging
from openai import OpenAI
from typing import List, Dict, Any
from app.models import DynamicQuestion

logger = logging.getLogger(__name__)

class OpenAIService:
    """Service for generating questions using OpenAI API"""
    
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.model = "gpt-3.5-turbo"  # Can be upgraded to gpt-4 for better quality
    
    def generate_questions_for_topic(self, topic: str, difficulty: str, num_questions: int = 3) -> List[Dict[str, Any]]:
        """Generate questions for a specific topic and difficulty level"""
        
        difficulty_prompts = {
            "easy": "Create basic, fundamental questions that test basic understanding and recall.",
            "medium": "Create intermediate questions that test application and comprehension.",
            "hard": "Create advanced questions that test analysis, synthesis, and evaluation."
        }
        
        prompt = f"""
        Generate {num_questions} quiz questions about "{topic}" at {difficulty} difficulty level.
        
        Requirements:
        - {difficulty_prompts[difficulty]}
        - Include a mix of question types: multiple choice, true/false, fill-in-the-blank, and short answer
        - Each question should have clear, unambiguous answers
        - Provide detailed explanations for correct answers
        - Make questions relevant and practical
        
        For each question, provide:
        1. question_type: "multiple_choice", "true_false", "fill_blank", or "short_answer"
        2. question_text: The actual question
        3. options: Array of options (only for multiple choice)
        4. correct_answer: The correct answer
        5. explanation: Detailed explanation of why this is correct
        
        Return the response as a JSON array of question objects.
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert educator creating high-quality quiz questions. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            # Parse the response
            content = response.choices[0].message.content.strip()
            
            # Try to extract JSON from the response
            try:
                # Remove any markdown formatting if present
                if content.startswith("```json"):
                    content = content[7:]
                if content.endswith("```"):
                    content = content[:-3]
                
                questions_data = json.loads(content)
                
                # Validate and format the questions
                formatted_questions = []
                for q_data in questions_data:
                    formatted_question = self._format_question(q_data, topic, difficulty)
                    if formatted_question:
                        formatted_questions.append(formatted_question)
                
                logger.info(f"Generated {len(formatted_questions)} questions for topic '{topic}' at {difficulty} level")
                return formatted_questions
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse OpenAI response as JSON: {e}")
                logger.error(f"Response content: {content}")
                return self._generate_fallback_questions(topic, difficulty, num_questions)
                
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return self._generate_fallback_questions(topic, difficulty, num_questions)
    
    def _format_question(self, q_data: Dict[str, Any], topic: str, difficulty: str) -> Dict[str, Any]:
        """Format and validate a question from OpenAI response"""
        try:
            question_type = q_data.get('question_type', '').lower()
            question_text = q_data.get('question_text', '').strip()
            correct_answer = q_data.get('correct_answer', '').strip()
            explanation = q_data.get('explanation', '').strip()
            
            # Validate required fields
            if not question_text or not correct_answer:
                return None
            
            # Format based on question type
            if question_type == 'multiple_choice':
                options = q_data.get('options', [])
                if not options or len(options) < 2:
                    return None
                return {
                    'type': 'multiple_choice',
                    'question': question_text,
                    'options': options,
                    'correct': correct_answer,
                    'explanation': explanation
                }
            elif question_type == 'true_false':
                if correct_answer.lower() not in ['true', 'false']:
                    return None
                return {
                    'type': 'true_false',
                    'question': question_text,
                    'correct': correct_answer,
                    'explanation': explanation
                }
            elif question_type in ['fill_blank', 'short_answer']:
                return {
                    'type': question_type,
                    'question': question_text,
                    'correct': correct_answer,
                    'explanation': explanation
                }
            else:
                return None
                
        except Exception as e:
            logger.error(f"Error formatting question: {e}")
            return None
    
    def _generate_fallback_questions(self, topic: str, difficulty: str, num_questions: int) -> List[Dict[str, Any]]:
        """Generate fallback questions when OpenAI fails"""
        logger.warning(f"Using fallback questions for topic '{topic}' at {difficulty} level")
        
        fallback_questions = [
            {
                'type': 'multiple_choice',
                'question': f'What is the primary purpose of {topic}?',
                'options': [
                    f'To solve problems in {topic}',
                    f'To avoid {topic}',
                    f'To ignore {topic}',
                    f'To complicate {topic}'
                ],
                'correct': f'To solve problems in {topic}',
                'explanation': f'This is the fundamental purpose of {topic}.'
            },
            {
                'type': 'true_false',
                'question': f'{topic} is an important concept in its field.',
                'correct': 'True',
                'explanation': f'{topic} is indeed an important concept that is widely used.'
            },
            {
                'type': 'fill_blank',
                'question': f'The main goal of {topic} is to _____ effectively.',
                'correct': 'work',
                'explanation': f'{topic} is designed to work effectively in its intended context.'
            }
        ]
        
        return fallback_questions[:num_questions]
    
    def generate_questions(self, topics: List[str], difficulty_levels: List[str], num_questions_per_topic: int = 3) -> List[DynamicQuestion]:
        """Generate questions for multiple topics and difficulty levels"""
        all_questions = []
        
        for topic in topics:
            for difficulty in difficulty_levels:
                try:
                    # Generate questions for this topic-difficulty combination
                    questions_data = self.generate_questions_for_topic(topic, difficulty, num_questions_per_topic)
                    
                    # Convert to DynamicQuestion objects
                    for q_data in questions_data:
                        question = DynamicQuestion(
                            topic=topic,
                            difficulty=difficulty,
                            question_type=q_data['type'],
                            question_text=q_data['question'],
                            options=q_data.get('options'),
                            correct_answer=q_data['correct'],
                            explanation=q_data.get('explanation', '')
                        )
                        all_questions.append(question)
                        
                except Exception as e:
                    logger.error(f"Error generating questions for topic '{topic}' at {difficulty} level: {e}")
                    continue
        
        logger.info(f"Generated {len(all_questions)} total questions")
        return all_questions
