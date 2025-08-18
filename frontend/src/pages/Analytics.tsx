import React, { useState, useEffect } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { analyticsApi, learnersApi } from "../services/api";
import { AnalyticsData, Learner, QuizSessionAnalytics } from "../services/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// Type guard function to validate QuizSessionAnalytics
const isValidQuizSessionAnalytics = (data: any): data is QuizSessionAnalytics => {
  return (
    data &&
    typeof data === "object" &&
    data.session &&
    typeof data.session.id === "number" &&
    Array.isArray(data.session.topics) &&
    Array.isArray(data.session.difficulty_levels) &&
    typeof data.overall_accuracy === "number" &&
    typeof data.topic_performance === "object"
  );
};

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [dynamicQuizAnalytics, setDynamicQuizAnalytics] = useState<QuizSessionAnalytics | null>(null);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);

        // Check for dynamic quiz analytics from localStorage
        const storedAnalytics = localStorage.getItem("dynamicQuizAnalytics");
        const sessionId = localStorage.getItem("dynamicQuizSessionId");

        console.log("🔍 Checking localStorage for dynamic quiz analytics:");
        console.log("storedAnalytics:", storedAnalytics);
        console.log("sessionId:", sessionId);

        if (storedAnalytics && sessionId) {
          console.log("📊 Found dynamic quiz analytics in localStorage");
          try {
            const parsedData = JSON.parse(storedAnalytics);
            console.log("📊 Parsed data:", parsedData);

            if (isValidQuizSessionAnalytics(parsedData)) {
              setDynamicQuizAnalytics(parsedData);
              console.log("✅ Valid quiz session analytics data");
            } else {
              console.error("❌ Invalid quiz session analytics data structure");
            }

            // Clear localStorage after retrieving
            localStorage.removeItem("dynamicQuizAnalytics");
            localStorage.removeItem("dynamicQuizSessionId");
          } catch (error) {
            console.error("❌ Error parsing dynamic quiz analytics:", error);
          }
        } else {
          console.log("❌ No dynamic quiz analytics found in localStorage");
        }

        const [analyticsData, learnersData] = await Promise.all([analyticsApi.getPerformanceAnalytics(), learnersApi.getAll()]);
        setAnalytics(analyticsData);
        setLearners(learnersData);
      } catch (err) {
        setError("Failed to load analytics data");
        console.error("Analytics error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
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

  // If we have dynamic quiz analytics, show them even if regular analytics is empty
  if (dynamicQuizAnalytics && dynamicQuizAnalytics.session) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>Analytics Dashboard</h1>
            <p>Performance insights and learning analytics</p>
          </div>
        </div>
        <div className="container">
          {/* Dynamic Quiz Analytics */}
          <div className="card" style={{ marginBottom: "32px", border: "2px solid #3b82f6" }}>
            <div className="section-header">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2>🎯 Dynamic Quiz Session Results</h2>
                  <p>Detailed performance analysis from your recent quiz session</p>
                </div>
                <span
                  style={{
                    backgroundColor: "#3b82f6",
                    color: "white",
                    padding: "6px 16px",
                    borderRadius: "20px",
                    fontSize: "14px",
                    fontWeight: "600",
                    whiteSpace: "nowrap",
                  }}
                >
                  Session #{dynamicQuizAnalytics.session.id}
                </span>
              </div>
            </div>

            {/* Overall Performance */}
            <div style={{ marginBottom: "32px" }}>
              <div className="subsection-header">
                <h3>📊 Overall Performance</h3>
                <p>Key metrics and performance summary</p>
              </div>

              {/* Performance Metrics */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                <div style={{ textAlign: "center", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#3b82f6" }}>{dynamicQuizAnalytics.overall_accuracy.toFixed(1)}%</div>
                  <div style={{ color: "#6b7280", fontSize: "14px" }}>Overall Accuracy</div>
                </div>
                <div style={{ textAlign: "center", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#10b981" }}>
                    {dynamicQuizAnalytics.session.correct_answers}/{dynamicQuizAnalytics.session.total_questions}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: "14px" }}>Correct Answers</div>
                </div>
                <div style={{ textAlign: "center", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#f59e0b" }}>{dynamicQuizAnalytics.session.topics.length}</div>
                  <div style={{ color: "#6b7280", fontSize: "14px" }}>Topics Covered</div>
                </div>
              </div>

              {/* Performance Progress Chart */}
              <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "8px" }}>
                <h4 style={{ color: "#1e293b", marginBottom: "12px", textAlign: "center", fontSize: "16px" }}>📈 Performance Overview</h4>
                <div style={{ maxWidth: "300px", margin: "0 auto" }}>
                  <Doughnut
                    data={{
                      labels: ["Correct", "Incorrect"],
                      datasets: [
                        {
                          data: [
                            dynamicQuizAnalytics.session.correct_answers,
                            dynamicQuizAnalytics.session.total_questions - dynamicQuizAnalytics.session.correct_answers,
                          ],
                          backgroundColor: [
                            "rgba(16, 185, 129, 0.8)", // Green for correct
                            "rgba(239, 68, 68, 0.8)", // Red for incorrect
                          ],
                          borderColor: ["rgba(16, 185, 129, 1)", "rgba(239, 68, 68, 1)"],
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: {
                            padding: 8,
                            font: {
                              size: 12,
                            },
                          },
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              const total = dynamicQuizAnalytics.session.total_questions;
                              const percentage = ((context.parsed / total) * 100).toFixed(1);
                              return `${context.label}: ${context.parsed} (${percentage}%)`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Topic Performance Chart */}
            <div style={{ marginBottom: "24px" }}>
              <div className="subsection-header">
                <h3>📈 Topic Performance</h3>
                <p>Performance breakdown by topic area</p>
              </div>
              <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "8px" }}>
                <div style={{ height: "250px" }}>
                  <Bar
                    data={{
                      labels: Object.keys(dynamicQuizAnalytics.topic_performance),
                      datasets: [
                        {
                          label: "Accuracy (%)",
                          data: Object.values(dynamicQuizAnalytics.topic_performance).map((performance) => (performance.correct / performance.total) * 100),
                          backgroundColor: Object.values(dynamicQuizAnalytics.topic_performance).map((performance) => {
                            const accuracy = (performance.correct / performance.total) * 100;
                            return accuracy >= 80 ? "rgba(16, 185, 129, 0.8)" : accuracy >= 60 ? "rgba(245, 158, 11, 0.8)" : "rgba(239, 68, 68, 0.8)";
                          }),
                          borderColor: Object.values(dynamicQuizAnalytics.topic_performance).map((performance) => {
                            const accuracy = (performance.correct / performance.total) * 100;
                            return accuracy >= 80 ? "rgba(16, 185, 129, 1)" : accuracy >= 60 ? "rgba(245, 158, 11, 1)" : "rgba(239, 68, 68, 1)";
                          }),
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              const topic = context.label;
                              const performance = dynamicQuizAnalytics.topic_performance[topic];
                              return [`Accuracy: ${context.parsed.y.toFixed(1)}%`, `Correct: ${performance.correct}/${performance.total}`];
                            },
                          },
                        },
                      },
                      scales: {
                        x: {
                          ticks: {
                            font: {
                              size: 11,
                            },
                          },
                        },
                        y: {
                          beginAtZero: true,
                          max: 100,
                          ticks: {
                            callback: function (value) {
                              return value + "%";
                            },
                            font: {
                              size: 11,
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Difficulty Performance Chart */}
            {dynamicQuizAnalytics.difficulty_performance && Object.keys(dynamicQuizAnalytics.difficulty_performance).length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <div className="subsection-header">
                  <h3>🎯 Difficulty Performance</h3>
                  <p>Performance analysis by difficulty level</p>
                </div>
                <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "8px" }}>
                  <div style={{ maxWidth: "250px", margin: "0 auto" }}>
                    <Doughnut
                      data={{
                        labels: Object.keys(dynamicQuizAnalytics.difficulty_performance),
                        datasets: [
                          {
                            data: Object.values(dynamicQuizAnalytics.difficulty_performance).map(
                              (performance) => (performance.correct / performance.total) * 100
                            ),
                            backgroundColor: [
                              "rgba(34, 197, 94, 0.8)", // Easy - Green
                              "rgba(245, 158, 11, 0.8)", // Medium - Yellow
                              "rgba(239, 68, 68, 0.8)", // Hard - Red
                            ],
                            borderColor: ["rgba(34, 197, 94, 1)", "rgba(245, 158, 11, 1)", "rgba(239, 68, 68, 1)"],
                            borderWidth: 1,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                          legend: {
                            position: "bottom",
                            labels: {
                              padding: 6,
                              font: {
                                size: 11,
                              },
                            },
                          },
                          tooltip: {
                            callbacks: {
                              label: function (context) {
                                const difficulty = context.label;
                                const performance = dynamicQuizAnalytics.difficulty_performance[difficulty];
                                return [`Accuracy: ${context.parsed.toFixed(1)}%`, `Correct: ${performance.correct}/${performance.total}`];
                              },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Areas for Improvement */}
            <div style={{ marginBottom: "32px" }}>
              <h3 style={{ color: "#ef4444", marginBottom: "16px" }}>⚠️ Areas for Improvement</h3>

              {/* Weak Topics Chart */}
              {dynamicQuizAnalytics.weak_topics && dynamicQuizAnalytics.weak_topics.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <div className="subsection-header">
                    <h4 style={{ color: "#991b1b" }}>📊 Weak Topics Performance</h4>
                    <p>Areas that need improvement and focus</p>
                  </div>
                  <div style={{ backgroundColor: "#fef2f2", padding: "12px", borderRadius: "8px", border: "1px solid #fecaca" }}>
                    <div style={{ height: "200px" }}>
                      <Bar
                        data={{
                          labels: dynamicQuizAnalytics.weak_topics.map((topic) => topic.topic),
                          datasets: [
                            {
                              label: "Accuracy (%)",
                              data: dynamicQuizAnalytics.weak_topics.map((topic) => topic.accuracy),
                              backgroundColor: "rgba(239, 68, 68, 0.8)",
                              borderColor: "rgba(239, 68, 68, 1)",
                              borderWidth: 1,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false,
                            },
                            tooltip: {
                              callbacks: {
                                label: function (context) {
                                  const weakTopic = dynamicQuizAnalytics.weak_topics[context.dataIndex];
                                  return [`Accuracy: ${context.parsed.y.toFixed(1)}%`, `Correct: ${weakTopic.correct}/${weakTopic.total}`];
                                },
                              },
                            },
                          },
                          scales: {
                            x: {
                              ticks: {
                                font: {
                                  size: 10,
                                },
                              },
                            },
                            y: {
                              beginAtZero: true,
                              max: 100,
                              ticks: {
                                callback: function (value) {
                                  return value + "%";
                                },
                                font: {
                                  size: 10,
                                },
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Improvement Recommendations */}
              <div style={{ backgroundColor: "#f0f9ff", padding: "16px", borderRadius: "8px", border: "1px solid #0ea5e9" }}>
                <div className="subsection-header">
                  <h4 style={{ color: "#0c4a6e" }}>🎯 Personalized Recommendations</h4>
                  <p>Actionable insights and improvement strategies</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
                  {/* Focus Areas */}
                  <div style={{ backgroundColor: "white", padding: "12px", borderRadius: "8px" }}>
                    <h5 style={{ color: "#0c4a6e", marginBottom: "6px", fontSize: "14px" }}>🎯 Focus Areas</h5>
                    <ul style={{ color: "#475569", fontSize: "13px", lineHeight: "1.5" }}>
                      {dynamicQuizAnalytics.weak_topics && dynamicQuizAnalytics.weak_topics.length > 0 ? (
                        dynamicQuizAnalytics.weak_topics.slice(0, 3).map((topic, index) => (
                          <li key={index} style={{ marginBottom: "4px" }}>
                            <strong>{topic.topic}</strong> - Practice more questions in this area
                          </li>
                        ))
                      ) : (
                        <li>Great job! No specific weak areas identified.</li>
                      )}
                    </ul>
                  </div>

                  {/* Study Tips */}
                  <div style={{ backgroundColor: "white", padding: "12px", borderRadius: "8px" }}>
                    <h5 style={{ color: "#0c4a6e", marginBottom: "6px", fontSize: "14px" }}>📚 Study Tips</h5>
                    <ul style={{ color: "#475569", fontSize: "13px", lineHeight: "1.5" }}>
                      <li>Review concepts in weak topics</li>
                      <li>Take more practice quizzes</li>
                      <li>Focus on understanding fundamentals</li>
                      <li>Use spaced repetition techniques</li>
                    </ul>
                  </div>

                  {/* Next Steps */}
                  <div style={{ backgroundColor: "white", padding: "12px", borderRadius: "8px" }}>
                    <h5 style={{ color: "#0c4a6e", marginBottom: "6px", fontSize: "14px" }}>🚀 Next Steps</h5>
                    <ul style={{ color: "#475569", fontSize: "13px", lineHeight: "1.5" }}>
                      <li>Generate a new quiz focusing on weak topics</li>
                      <li>Review explanations for incorrect answers</li>
                      <li>Track your progress over time</li>
                      <li>Set specific learning goals</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Session Details */}
            <div>
              <h3 style={{ color: "#3b82f6", marginBottom: "16px" }}>📋 Session Details</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div>
                  <div style={{ fontWeight: "600", color: "#1e293b", marginBottom: "4px" }}>Topics</div>
                  <div style={{ color: "#6b7280" }}>{dynamicQuizAnalytics.session.topics.join(", ")}</div>
                </div>
                <div>
                  <div style={{ fontWeight: "600", color: "#1e293b", marginBottom: "4px" }}>Difficulty Levels</div>
                  <div style={{ color: "#6b7280" }}>{dynamicQuizAnalytics.session.difficulty_levels.join(", ")}</div>
                </div>
                <div>
                  <div style={{ fontWeight: "600", color: "#1e293b", marginBottom: "4px" }}>Time Taken</div>
                  <div style={{ color: "#6b7280" }}>{Math.round(dynamicQuizAnalytics.session.time_taken / 60)} minutes</div>
                </div>
              </div>
            </div>
          </div>

          {/* Show regular analytics if available */}
          {analytics && analytics.topic_analytics && analytics.topic_analytics.length > 0 && (
            <div>
              <h2 style={{ marginBottom: "20px", color: "#1e293b" }}>📊 Overall System Analytics</h2>
              {/* Regular analytics content will be rendered here */}
            </div>
          )}
        </div>
      </div>
    );
  }

  // If no dynamic quiz analytics and no regular analytics, show no data message
  if (!analytics || !analytics.topic_analytics || analytics.topic_analytics.length === 0) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>Analytics Dashboard</h1>
            <p>Performance insights and learning analytics</p>
          </div>
        </div>
        <div className="container">
          <div className="card">
            <div className="section-header">
              <h2>No Data Available</h2>
              <p>There is no analytics data available yet. Please take some quizzes to see your performance analytics.</p>
            </div>
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: "4rem", marginBottom: "16px" }}>📊</div>
              <p style={{ color: "#6b7280", fontSize: "16px", marginBottom: "24px" }}>
                Start by taking some quizzes or generating dynamic questions to see your performance analytics.
              </p>
              <a href="/dynamic-quiz" className="btn btn-primary">
                Start Dynamic Quiz
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const topicChartData = {
    labels: analytics.topic_analytics.map((item) => item.topic),
    datasets: [
      {
        label: "Average Score (%)",
        data: analytics.topic_analytics.map((item) => item.average_score),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
      {
        label: "Number of Attempts",
        data: analytics.topic_analytics.map((item) => item.total_attempts),
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 1,
        yAxisID: "y1",
      },
    ],
  };

  const difficultyChartData = {
    labels: analytics.difficulty_analytics.map((item) => item.difficulty),
    datasets: [
      {
        label: "Average Score (%)",
        data: analytics.difficulty_analytics.map((item) => item.average_score),
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)", // Easy - Green
          "rgba(245, 158, 11, 0.8)", // Medium - Yellow
          "rgba(239, 68, 68, 0.8)", // Hard - Red
        ],
        borderColor: ["rgba(34, 197, 94, 1)", "rgba(245, 158, 11, 1)", "rgba(239, 68, 68, 1)"],
        borderWidth: 1,
      },
    ],
  };

  const difficultyDistributionData = {
    labels: analytics.difficulty_analytics.map((item) => item.difficulty),
    datasets: [
      {
        data: analytics.difficulty_analytics.map((item) => item.total_attempts),
        backgroundColor: ["rgba(34, 197, 94, 0.8)", "rgba(245, 158, 11, 0.8)", "rgba(239, 68, 68, 0.8)"],
        borderColor: ["rgba(34, 197, 94, 1)", "rgba(245, 158, 11, 1)", "rgba(239, 68, 68, 1)"],
        borderWidth: 2,
      },
    ],
  };

  // Learner performance heatmap data
  const learnerPerformanceData = learners.map((learner) => ({
    name: learner.name,
    scores: Object.entries(learner.topic_scores || {}).map(([topic, score]) => ({
      topic,
      score: score * 100,
    })),
  }));

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  };

  const topicChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Average Score (%)",
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: true,
          text: "Number of Attempts",
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Analytics Dashboard</h1>
          <p>Performance insights and learning analytics</p>
        </div>
      </div>

      <div className="container">
        {/* Summary Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{analytics.total_performances}</div>
            <div className="stat-label">Total Quiz Attempts</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{analytics.average_score.toFixed(1)}%</div>
            <div className="stat-label">Overall Average Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{analytics.topic_analytics.length}</div>
            <div className="stat-label">Topics Covered</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{learners.length}</div>
            <div className="stat-label">Active Learners</div>
          </div>
        </div>

        {/* Topic Performance Chart */}
        <div className="card">
          <div className="section-header">
            <h2>📈 Topic Performance Analysis</h2>
            <p>Shows average scores and attempt counts for each topic</p>
          </div>
          <div className="chart-container">
            <Bar data={topicChartData} options={topicChartOptions} />
          </div>
        </div>

        {/* Difficulty Analysis */}
        <div className="grid grid-2">
          <div className="card">
            <div className="section-header">
              <h2>🎯 Performance by Difficulty</h2>
              <p>Average scores across different difficulty levels</p>
            </div>
            <div className="chart-container">
              <Bar data={difficultyChartData} options={chartOptions} />
            </div>
          </div>

          <div className="card">
            <div className="section-header">
              <h2>📊 Difficulty Distribution</h2>
              <p>Distribution of quiz attempts by difficulty</p>
            </div>
            <div className="chart-container">
              <Doughnut data={difficultyDistributionData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Learner Performance Heatmap */}
        <div className="card">
          <div className="section-header">
            <h2>👥 Learner Performance Overview</h2>
            <p>Detailed performance breakdown by learner and topic</p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="learner-performance-table">
              <thead>
                <tr>
                  <th>Learner</th>
                  {analytics.topic_analytics &&
                    analytics.topic_analytics.map((topic) => (
                      <th key={topic.topic} style={{ textAlign: "center" }}>
                        {topic.topic}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {learnerPerformanceData.slice(0, 10).map((learner, index) => (
                  <tr key={learner.name}>
                    <td style={{ fontWeight: "600" }}>{learner.name}</td>
                    {analytics.topic_analytics &&
                      analytics.topic_analytics.map((topic) => {
                        const score = learner.scores.find((s) => s.topic === topic.topic)?.score || 0;
                        const scoreClass = score >= 80 ? "excellent" : score >= 60 ? "good" : "needs-improvement";

                        return (
                          <td key={topic.topic} style={{ textAlign: "center" }}>
                            <span className={`performance-score ${scoreClass}`}>{score.toFixed(0)}%</span>
                          </td>
                        );
                      })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: "#6b7280", marginTop: "16px", textAlign: "center" }}>
            Topic-wise performance scores for top 10 learners (Green: ≥80%, Yellow: 60-79%, Red: &lt;60%)
          </p>
        </div>

        {/* Key Insights */}
        <div className="card">
          <h2 style={{ marginBottom: "20px", color: "#1e293b" }}>Key Insights</h2>
          <div className="grid grid-2">
            <div>
              <h3 style={{ color: "#3b82f6", marginBottom: "12px" }}>📊 Performance Trends</h3>
              <ul style={{ color: "#6b7280", lineHeight: "1.6" }}>
                <li>Overall average score: {analytics.average_score.toFixed(1)}%</li>
                <li>
                  Most attempted topic:{" "}
                  {analytics.topic_analytics.length > 0
                    ? analytics.topic_analytics.reduce((max, current) => (current.total_attempts > max.total_attempts ? current : max)).topic
                    : "No data available"}
                </li>
                <li>
                  Best performing topic:{" "}
                  {analytics.topic_analytics.length > 0
                    ? analytics.topic_analytics.reduce((max, current) => (current.average_score > max.average_score ? current : max)).topic
                    : "No data available"}
                </li>
              </ul>
            </div>
            <div>
              <h3 style={{ color: "#3b82f6", marginBottom: "12px" }}>🎯 Recommendations</h3>
              <ul style={{ color: "#6b7280", lineHeight: "1.6" }}>
                <li>Focus on topics with lower average scores</li>
                <li>Provide more practice quizzes for difficult topics</li>
                <li>Consider adjusting difficulty levels based on performance</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Dynamic Quiz Analytics */}
        {dynamicQuizAnalytics && (
          <div className="card" style={{ marginTop: "32px", border: "2px solid #3b82f6" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ color: "#1e293b", margin: 0 }}>🎯 Dynamic Quiz Session Results</h2>
              <span
                style={{
                  backgroundColor: "#3b82f6",
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: "16px",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Session #{dynamicQuizAnalytics.session.id}
              </span>
            </div>

            {/* Overall Performance */}
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ color: "#3b82f6", marginBottom: "16px" }}>📊 Overall Performance</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div style={{ textAlign: "center", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#3b82f6" }}>{dynamicQuizAnalytics.overall_accuracy.toFixed(1)}%</div>
                  <div style={{ color: "#6b7280", fontSize: "14px" }}>Overall Accuracy</div>
                </div>
                <div style={{ textAlign: "center", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#10b981" }}>
                    {dynamicQuizAnalytics.session.correct_answers}/{dynamicQuizAnalytics.session.total_questions}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: "14px" }}>Correct Answers</div>
                </div>
                <div style={{ textAlign: "center", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#f59e0b" }}>{dynamicQuizAnalytics.session.topics.length}</div>
                  <div style={{ color: "#6b7280", fontSize: "14px" }}>Topics Covered</div>
                </div>
              </div>
            </div>

            {/* Topic Performance */}
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ color: "#3b82f6", marginBottom: "16px" }}>📈 Topic Performance</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
                {Object.entries(dynamicQuizAnalytics.topic_performance).map(([topic, performance]) => (
                  <div key={topic} style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                    <div style={{ fontWeight: "600", marginBottom: "8px", color: "#1e293b" }}>{topic}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#6b7280" }}>
                        {performance.correct}/{performance.total} correct
                      </span>
                      <span
                        style={{
                          fontWeight: "600",
                          color:
                            performance.correct / performance.total >= 0.8 ? "#10b981" : performance.correct / performance.total >= 0.6 ? "#f59e0b" : "#ef4444",
                        }}
                      >
                        {((performance.correct / performance.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weak Topics */}
            {dynamicQuizAnalytics.weak_topics && dynamicQuizAnalytics.weak_topics.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ color: "#ef4444", marginBottom: "16px" }}>⚠️ Areas for Improvement</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  {dynamicQuizAnalytics.weak_topics.map((weakTopic, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "12px",
                        backgroundColor: "#fef2f2",
                        borderRadius: "8px",
                        border: "1px solid #fecaca",
                      }}
                    >
                      <div style={{ fontWeight: "600", color: "#991b1b", marginBottom: "4px" }}>{weakTopic.topic}</div>
                      <div style={{ color: "#6b7280", fontSize: "14px" }}>Accuracy: {weakTopic.accuracy.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Session Details */}
            <div>
              <h3 style={{ color: "#3b82f6", marginBottom: "16px" }}>📋 Session Details</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div>
                  <div style={{ fontWeight: "600", color: "#1e293b", marginBottom: "4px" }}>Topics</div>
                  <div style={{ color: "#6b7280" }}>{dynamicQuizAnalytics.session.topics.join(", ")}</div>
                </div>
                <div>
                  <div style={{ fontWeight: "600", color: "#1e293b", marginBottom: "4px" }}>Difficulty Levels</div>
                  <div style={{ color: "#6b7280" }}>{dynamicQuizAnalytics.session.difficulty_levels.join(", ")}</div>
                </div>
                <div>
                  <div style={{ fontWeight: "600", color: "#1e293b", marginBottom: "4px" }}>Time Taken</div>
                  <div style={{ color: "#6b7280" }}>{Math.round(dynamicQuizAnalytics.session.time_taken / 60)} minutes</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
