import React, { useState, useEffect } from "react";
import { learnersApi, analyticsApi } from "../services/api";
import { Learner, AnalyticsData } from "../services/api";

const Dashboard: React.FC = () => {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [learnersData, analyticsData] = await Promise.all([learnersApi.getAll(), analyticsApi.getPerformanceAnalytics()]);
        setLearners(learnersData);
        setAnalytics(analyticsData);
      } catch (err) {
        setError("Failed to load dashboard data");
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>AI-Powered Quiz Recommendation System</h1>
          <p>Personalized learning recommendations powered by machine learning</p>
        </div>
      </div>

      <div className="container">
        {/* Statistics Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{analytics?.total_performances || 0}</div>
            <div className="stat-label">Quiz Attempts</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{analytics?.average_score?.toFixed(1) || 0}%</div>
            <div className="stat-label">Average Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{analytics?.topic_analytics?.length || 0}</div>
            <div className="stat-label">Topics Covered</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{analytics?.topic_analytics?.filter((topic) => topic.average_score >= 80).length || 0}</div>
            <div className="stat-label">Topics Mastered</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="section-header">
            <h2>Quick Actions</h2>
            <p>Access key features and functionality</p>
          </div>
          <div className="grid grid-4">
            <div className="card" style={{ textAlign: "center", padding: "24px" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>🎯</div>
              <h3 style={{ marginBottom: "12px", color: "#1e293b" }}>Get Recommendations</h3>
              <p style={{ color: "#6b7280", marginBottom: "20px", lineHeight: "1.5" }}>Get personalized quiz recommendations for any learner</p>
              <a href="/recommendations" className="btn btn-primary">
                View Recommendations
              </a>
            </div>
            <div className="card" style={{ textAlign: "center", padding: "24px" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>📈</div>
              <h3 style={{ marginBottom: "12px", color: "#1e293b" }}>Analytics</h3>
              <p style={{ color: "#6b7280", marginBottom: "20px", lineHeight: "1.5" }}>View detailed performance analytics and insights</p>
              <a href="/analytics" className="btn btn-primary">
                View Analytics
              </a>
            </div>
            <div className="card" style={{ textAlign: "center", padding: "24px" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>📚</div>
              <h3 style={{ marginBottom: "12px", color: "#1e293b" }}>Browse Quizzes</h3>
              <p style={{ color: "#6b7280", marginBottom: "20px", lineHeight: "1.5" }}>Explore available quizzes and their topics</p>
              <a href="/quizzes" className="btn btn-primary">
                View Quizzes
              </a>
            </div>
            <div className="card" style={{ textAlign: "center", padding: "24px" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>🧠</div>
              <h3 style={{ marginBottom: "12px", color: "#1e293b" }}>Dynamic Quiz</h3>
              <p style={{ color: "#6b7280", marginBottom: "20px", lineHeight: "1.5" }}>Generate personalized questions and take interactive quizzes</p>
              <a href="/dynamic-quiz" className="btn btn-primary">
                Start Quiz
              </a>
            </div>
          </div>
        </div>

        {/* Recent Performance */}
        <div className="card">
          <div className="section-header">
            <h2>Recent Performance</h2>
            <p>Your latest quiz performance and learning progress</p>
          </div>
          <div className="grid grid-2">
            <div className="performance-summary">
              <div className="performance-metric">
                <div className="metric-label">Overall Accuracy</div>
                <div className="metric-value">{analytics?.average_score?.toFixed(1) || 0}%</div>
              </div>
              <div className="performance-metric">
                <div className="metric-label">Total Attempts</div>
                <div className="metric-value">{analytics?.total_performances || 0}</div>
              </div>
              <div className="performance-metric">
                <div className="metric-label">Topics Mastered</div>
                <div className="metric-value">{analytics?.topic_analytics?.filter((topic) => topic.average_score >= 80).length || 0}</div>
              </div>
              <div className="performance-metric">
                <div className="metric-label">Areas for Improvement</div>
                <div className="metric-value">{analytics?.topic_analytics?.filter((topic) => topic.average_score < 60).length || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* System Features */}
        <div className="card">
          <div className="section-header">
            <h2>System Features</h2>
            <p>Key capabilities and technologies powering the recommendation system</p>
          </div>
          <div className="grid grid-2">
            <div>
              <h3 style={{ color: "#3b82f6", marginBottom: "12px" }}>🤖 Hybrid Recommendation Engine</h3>
              <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
                Combines content-based and collaborative filtering to provide the most accurate quiz recommendations based on learner performance and similar
                user patterns.
              </p>
            </div>
            <div>
              <h3 style={{ color: "#3b82f6", marginBottom: "12px" }}>📊 Real-time Analytics</h3>
              <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
                Track learner progress, identify weak areas, and visualize performance trends with interactive charts and detailed analytics.
              </p>
            </div>
            <div>
              <h3 style={{ color: "#3b82f6", marginBottom: "12px" }}>🎯 Personalized Learning</h3>
              <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
                Each learner receives tailored quiz recommendations based on their unique learning profile and performance history.
              </p>
            </div>
            <div>
              <h3 style={{ color: "#3b82f6", marginBottom: "12px" }}>📈 Performance Tracking</h3>
              <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
                Monitor quiz performance, time taken, and topic proficiency to continuously improve the recommendation algorithm.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
