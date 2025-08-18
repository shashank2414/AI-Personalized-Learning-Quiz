import axios from "axios";

// API base URL
const API_BASE_URL = "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Data interfaces
export interface Learner {
  id: number;
  name: string;
  email: string;
  topic_scores: { [key: string]: number };
  weak_topics: string[];
  created_at: string;
}

export interface Quiz {
  id: number;
  title: string;
  topic: string;
  difficulty: string;
  description: string;
  questions_count: number;
  time_limit: number;
  created_at: string;
}

export interface Performance {
  id: number;
  learner_id: number;
  quiz_id: number;
  score: number;
  time_taken: number;
  completed_at: string;
}

export interface AnalyticsData {
  total_learners: number;
  total_quizzes: number;
  total_performances: number;
  average_score: number;
  topic_analytics: Array<{
    topic: string;
    average_score: number;
    total_attempts: number;
  }>;
  difficulty_analytics: Array<{
    difficulty: string;
    average_score: number;
    total_attempts: number;
  }>;
}

export interface Recommendation {
  quiz: Quiz;
  hybrid_score?: number;
  content_score?: number;
  collaborative_score?: number;
  topic_score?: number;
  difficulty_score?: number;
}

export interface RecommendationResponse {
  learner: Learner;
  recommendations: Recommendation[];
  method: string;
  count: number;
}

// Dynamic Quiz Interfaces
export interface DynamicQuestion {
  id: number;
  topic: string;
  difficulty: string;
  question_type: string;
  question_text: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  created_at: string;
}

export interface QuizSession {
  id: number;
  learner_id: number;
  topics: string[];
  difficulty_levels: string[];
  total_questions: number;
  questions_answered: number;
  correct_answers: number;
  total_score: number;
  time_taken: number;
  status: string;
  created_at: string;
  completed_at?: string;
  accuracy: number;
}

export interface QuizResponse {
  id: number;
  session_id: number;
  question_id: number;
  learner_answer: string;
  is_correct: boolean;
  time_taken: number;
  created_at: string;
  question?: DynamicQuestion;
}

export interface TopicPerformance {
  correct: number;
  total: number;
}

export interface WeakTopic {
  topic: string;
  accuracy: number;
  correct: number;
  total: number;
}

export interface QuizSessionAnalytics {
  session: QuizSession;
  responses: QuizResponse[];
  topic_performance: { [key: string]: TopicPerformance };
  difficulty_performance: { [key: string]: TopicPerformance };
  weak_topics: WeakTopic[];
  overall_accuracy: number;
}

// API functions
export const learnersApi = {
  getAll: async (): Promise<Learner[]> => {
    const response = await api.get("/learners");
    return response.data.data;
  },

  getById: async (id: number): Promise<Learner> => {
    const response = await api.get(`/learners/${id}`);
    return response.data.data;
  },
};

export const quizzesApi = {
  getAll: async (topic?: string, difficulty?: string): Promise<Quiz[]> => {
    const params = new URLSearchParams();
    if (topic) params.append("topic", topic);
    if (difficulty) params.append("difficulty", difficulty);

    const response = await api.get(`/quizzes?${params.toString()}`);
    return response.data.data;
  },

  getById: async (id: number): Promise<Quiz> => {
    const response = await api.get(`/quizzes/${id}`);
    return response.data.data;
  },
};

export const recommendationsApi = {
  getRecommendations: async (learnerId: number, method: string = "hybrid", nRecommendations: number = 10): Promise<RecommendationResponse> => {
    const response = await api.post("/recommendations", {
      learner_id: learnerId,
      method,
      n_recommendations: nRecommendations,
    });
    return response.data.data;
  },
};

export const performanceApi = {
  submitPerformance: async (learnerId: number, quizId: number, score: number, timeTaken?: number): Promise<any> => {
    const response = await api.post("/performance", {
      learner_id: learnerId,
      quiz_id: quizId,
      score,
      time_taken: timeTaken,
    });
    return response.data;
  },
};

export const analyticsApi = {
  getPerformanceAnalytics: async (): Promise<AnalyticsData> => {
    const response = await api.get("/analytics/performance");
    return response.data.data;
  },

  getLearnerAnalytics: async (learnerId: number): Promise<any> => {
    const response = await api.get(`/analytics/learner/${learnerId}`);
    return response.data.data;
  },
};

export const topicsApi = {
  getAll: async (): Promise<string[]> => {
    const response = await api.get("/topics");
    return response.data.data;
  },
};

// Dynamic Quiz API functions
export const dynamicQuizApi = {
  createSession: async (
    learnerId: number,
    topics: string[],
    difficultyLevels: string[] = ["easy", "medium", "hard"],
    questionsPerTopic: number = 3
  ): Promise<{
    session_id: number;
    total_questions: number;
    topics: string[];
    difficulty_levels: string[];
    questions: DynamicQuestion[];
  }> => {
    console.log("🔗 API call - createSession");
    console.log("URL:", "/dynamic-quiz/create-session");
    console.log("Data:", {
      learner_id: learnerId,
      topics,
      difficulty_levels: difficultyLevels,
      questions_per_topic: questionsPerTopic,
    });

    try {
      const response = await api.post("/dynamic-quiz/create-session", {
        learner_id: learnerId,
        topics,
        difficulty_levels: difficultyLevels,
        questions_per_topic: questionsPerTopic,
      });
      console.log("✅ API response:", response.data);
      return response.data.data;
    } catch (error: any) {
      console.error("❌ API error:", error);
      console.error("❌ Error response:", error.response?.data);
      throw error;
    }
  },

  submitResponse: async (
    sessionId: number,
    questionId: number,
    learnerAnswer: string,
    timeTaken: number = 0
  ): Promise<{
    is_correct: boolean;
    correct_answer: string;
    explanation: string;
    session_complete: boolean;
    session_score?: number;
  }> => {
    const response = await api.post("/dynamic-quiz/submit-response", {
      session_id: sessionId,
      question_id: questionId,
      learner_answer: learnerAnswer,
      time_taken: timeTaken,
    });
    return response.data.data;
  },

  getSession: async (sessionId: number): Promise<QuizSessionAnalytics> => {
    const response = await api.get(`/dynamic-quiz/session/${sessionId}`);
    return response.data.data;
  },

  getLearnerSessions: async (learnerId: number): Promise<QuizSession[]> => {
    const response = await api.get(`/dynamic-quiz/learner-sessions/${learnerId}`);
    return response.data.data;
  },
};

export default api;
