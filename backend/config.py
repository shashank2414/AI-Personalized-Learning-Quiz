import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Application configuration"""
    
    # Flask Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    FLASK_ENV = os.environ.get('FLASK_ENV', 'development')
    
    # Database Configuration
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///quiz_system.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # OpenAI Configuration
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    
    @staticmethod
    def validate_config():
        """Validate that required configuration is present"""
        if not Config.OPENAI_API_KEY:
            print("⚠️  WARNING: OPENAI_API_KEY not set!")
            print("   Please set your OpenAI API key to use the AI-powered question generation.")
            print("   You can set it as an environment variable: export OPENAI_API_KEY='your-key-here'")
            print("   Or create a .env file in the backend directory with: OPENAI_API_KEY=your-key-here")
            return False
        return True
