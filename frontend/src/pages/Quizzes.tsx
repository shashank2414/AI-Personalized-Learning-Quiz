import React, { useState, useEffect } from "react";
import { quizzesApi, topicsApi } from "../services/api";
import { Quiz } from "../services/api";

const Quizzes: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [quizzesData, topicsData] = await Promise.all([quizzesApi.getAll(), topicsApi.getAll()]);
        setQuizzes(quizzesData);
        setTopics(topicsData);
      } catch (err) {
        setError("Failed to load quizzes");
        console.error("Quizzes error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter quizzes based on search term, topic, and difficulty
  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) || quiz.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTopic = selectedTopic === "all" || quiz.topic === selectedTopic;
    const matchesDifficulty = selectedDifficulty === "all" || quiz.difficulty === selectedDifficulty;

    return matchesSearch && matchesTopic && matchesDifficulty;
  });

  // Calculate statistics
  const totalQuizzes = quizzes.length;
  const topicCounts = quizzes.reduce((acc, quiz) => {
    acc[quiz.topic] = (acc[quiz.topic] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const difficultyCounts = quizzes.reduce((acc, quiz) => {
    acc[quiz.difficulty] = (acc[quiz.difficulty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
          <h1>Quizzes</h1>
          <p>Browse and explore all available quizzes across different topics and difficulty levels</p>
        </div>
      </div>

      <div className="container">
        {/* Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{totalQuizzes}</div>
            <div className="stat-label">Total Quizzes</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{filteredQuizzes.length}</div>
            <div className="stat-label">Filtered Results</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{topics.length}</div>
            <div className="stat-label">Topics Covered</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{Object.keys(difficultyCounts).length}</div>
            <div className="stat-label">Difficulty Levels</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-section">
          <h2 style={{ marginBottom: "20px", color: "#1e293b" }}>Filter Quizzes</h2>
          <div className="filter-row">
            <div className="filter-group">
              <label className="form-label">Search Quizzes</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label className="form-label">Filter by Topic</label>
              <select className="form-select" value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}>
                <option value="all">All Topics</option>
                {topics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="form-label">Filter by Difficulty</label>
              <select className="form-select" value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)}>
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quizzes Grid */}
        <div className="card">
          <h2 style={{ marginBottom: "20px", color: "#1e293b" }}>Available Quizzes ({filteredQuizzes.length})</h2>

          {filteredQuizzes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>No quizzes found matching your criteria.</div>
          ) : (
            <div className="grid grid-2">
              {filteredQuizzes.map((quiz) => (
                <div key={quiz.id} className="quiz-card">
                  <div className="quiz-details">
                    <div className="quiz-info">
                      <div className="quiz-title">{quiz.title}</div>
                      <div className="quiz-meta">
                        <span className={`badge badge-${quiz.difficulty}`}>{quiz.difficulty}</span>
                        <span style={{ color: "#6b7280" }}>{quiz.topic}</span>
                      </div>
                    </div>
                    <div className="quiz-stats">
                      <div>{quiz.questions_count} questions</div>
                      <div>{quiz.time_limit} min</div>
                    </div>
                  </div>
                  <div className="quiz-description">{quiz.description}</div>
                  <div style={{ marginTop: "12px", fontSize: "12px", color: "#6b7280" }}>Created: {new Date(quiz.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quiz Distribution */}
        <div className="card">
          <h2 style={{ marginBottom: "20px", color: "#1e293b" }}>Quiz Distribution</h2>
          <div className="grid grid-2">
            <div>
              <h3 style={{ color: "#3b82f6", marginBottom: "12px" }}>📚 By Topic</h3>
              <div style={{ color: "#6b7280", lineHeight: "1.6" }}>
                {Object.entries(topicCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([topic, count]) => (
                    <div
                      key={topic}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        padding: "4px 0",
                      }}
                    >
                      <span>{topic}</span>
                      <span style={{ fontWeight: "600" }}>{count} quizzes</span>
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <h3 style={{ color: "#3b82f6", marginBottom: "12px" }}>📊 By Difficulty</h3>
              <div style={{ color: "#6b7280", lineHeight: "1.6" }}>
                {Object.entries(difficultyCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([difficulty, count]) => (
                    <div
                      key={difficulty}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        padding: "4px 0",
                      }}
                    >
                      <span style={{ textTransform: "capitalize" }}>{difficulty}</span>
                      <span style={{ fontWeight: "600" }}>{count} quizzes</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Features */}
        <div className="card">
          <h2 style={{ marginBottom: "20px", color: "#1e293b" }}>Quiz Features</h2>
          <div className="grid grid-2">
            <div>
              <h3 style={{ color: "#3b82f6", marginBottom: "12px" }}>🎯 Adaptive Difficulty</h3>
              <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
                Quizzes are categorized by difficulty levels (Easy, Medium, Hard) to match learners' current proficiency and help them progress gradually.
              </p>
            </div>
            <div>
              <h3 style={{ color: "#3b82f6", marginBottom: "12px" }}>⏱️ Time Management</h3>
              <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
                Each quiz has a recommended time limit to help learners develop time management skills and simulate real exam conditions.
              </p>
            </div>
            <div>
              <h3 style={{ color: "#3b82f6", marginBottom: "12px" }}>📖 Comprehensive Coverage</h3>
              <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
                Quizzes cover 10 different topics with varying question counts to ensure thorough understanding of each subject area.
              </p>
            </div>
            <div>
              <h3 style={{ color: "#3b82f6", marginBottom: "12px" }}>🔄 Continuous Updates</h3>
              <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
                The quiz database is regularly updated with new content to keep learning materials fresh and relevant to current educational standards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quizzes;
