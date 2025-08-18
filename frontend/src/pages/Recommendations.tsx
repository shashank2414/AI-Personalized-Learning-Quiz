import React, { useState, useEffect } from "react";
import { recommendationsApi } from "../services/api";
import { Recommendation } from "../services/api";

const Recommendations: React.FC = () => {
  // Default learner ID for single-user system
  const DEFAULT_LEARNER_ID = 1;
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [method, setMethod] = useState<"hybrid" | "content" | "collaborative">("hybrid");
  const [nRecommendations, setNRecommendations] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // No need to fetch learners data for single-user system
  }, []);

  const getRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await recommendationsApi.getRecommendations(DEFAULT_LEARNER_ID, method, nRecommendations);
      setRecommendations(result.recommendations);
    } catch (err) {
      setError("Failed to get recommendations");
      console.error("Recommendations error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreDisplay = (recommendation: Recommendation) => {
    if (method === "hybrid") {
      return <div className="recommendation-score">Hybrid Score: {(recommendation.hybrid_score! * 100).toFixed(1)}%</div>;
    } else if (method === "content") {
      return <div className="recommendation-score">Content Score: {(recommendation.content_score! * 100).toFixed(1)}%</div>;
    } else {
      return <div className="recommendation-score">Collaborative Score: {(recommendation.collaborative_score! * 100).toFixed(1)}%</div>;
    }
  };

  const getScoreBreakdown = (recommendation: Recommendation) => {
    if (method === "hybrid") {
      return (
        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
          Content: {(recommendation.content_score! * 100).toFixed(1)}% | Collaborative: {(recommendation.collaborative_score! * 100).toFixed(1)}%
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>Quiz Recommendations</h1>
          <p>Get personalized quiz recommendations using AI-powered algorithms</p>
        </div>
      </div>

      <div className="container">
        {/* Configuration Section */}
        <div className="filter-section">
          <div className="section-header">
            <h2>Recommendation Settings</h2>
            <p>Configure personalized quiz recommendations for learners</p>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label className="form-label">Recommendation Method</label>
              <select className="form-select" value={method} onChange={(e) => setMethod(e.target.value as any)}>
                <option value="hybrid">Hybrid (Content + Collaborative)</option>
                <option value="content">Content-based</option>
                <option value="collaborative">Collaborative Filtering</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="form-label">Number of Recommendations</label>
              <select className="form-select" value={nRecommendations} onChange={(e) => setNRecommendations(parseInt(e.target.value))}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
            </div>

            <div className="filter-group">
              <button className="btn btn-primary" onClick={getRecommendations} disabled={loading} style={{ marginTop: "24px" }}>
                {loading ? "Getting Recommendations..." : "Get Recommendations"}
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && <div className="error">{error}</div>}

        {/* Loading State */}
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p style={{ marginTop: "16px", color: "#6b7280" }}>Generating personalized recommendations...</p>
          </div>
        )}

        {/* Recommendations Display */}
        {!loading && recommendations.length > 0 && (
          <div className="card">
            <h2 style={{ marginBottom: "20px", color: "#1e293b" }}>Recommended Quizzes ({recommendations.length})</h2>
            <div className="grid grid-2">
              {recommendations.map((recommendation, index) => (
                <div key={recommendation.quiz.id} className="recommendation-card">
                  {getScoreDisplay(recommendation)}
                  <div className="quiz-title">{recommendation.quiz.title}</div>
                  <div className="quiz-meta">
                    <span className={`badge badge-${recommendation.quiz.difficulty}`}>{recommendation.quiz.difficulty}</span>
                    <span style={{ color: "#6b7280" }}>{recommendation.quiz.topic}</span>
                    <span style={{ color: "#6b7280" }}>{recommendation.quiz.questions_count} questions</span>
                    <span style={{ color: "#6b7280" }}>{recommendation.quiz.time_limit} min</span>
                  </div>
                  <div className="quiz-description">{recommendation.quiz.description}</div>
                  {getScoreBreakdown(recommendation)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Method Explanation */}
        <div className="card">
          <h2 style={{ marginBottom: "20px", color: "#1e293b" }}>How It Works</h2>
          <div className="grid grid-2">
            <div>
              <h3 style={{ color: "#3b82f6", marginBottom: "12px" }}>🤖 Hybrid Method</h3>
              <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
                Combines content-based filtering (topic preferences and difficulty levels) with collaborative filtering (similar learners' quiz history) to
                provide the most accurate recommendations.
              </p>
            </div>
            <div>
              <h3 style={{ color: "#3b82f6", marginBottom: "12px" }}>📊 Content-based Method</h3>
              <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
                Recommends quizzes based on the learner's topic preferences and performance patterns, focusing on areas where they need improvement.
              </p>
            </div>
            <div>
              <h3 style={{ color: "#3b82f6", marginBottom: "12px" }}>👥 Collaborative Method</h3>
              <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
                Suggests quizzes that similar learners have performed well on, using machine learning to identify patterns in quiz preferences.
              </p>
            </div>
            <div>
              <h3 style={{ color: "#3b82f6", marginBottom: "12px" }}>🎯 Personalized Learning</h3>
              <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
                Each recommendation is tailored to the individual learner's strengths, weaknesses, and learning style for optimal engagement and improvement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
