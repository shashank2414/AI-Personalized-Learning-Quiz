import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { dynamicQuizApi } from "../services/api";
import { DynamicQuestion, QuizSessionAnalytics } from "../services/api";

const DynamicQuiz: React.FC = () => {
  const navigate = useNavigate();
  // Default learner ID for single-user system
  const DEFAULT_LEARNER_ID = 1;
  const [customTopics, setCustomTopics] = useState<string>("");
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(["easy", "medium", "hard"]);
  const [questionsPerTopic, setQuestionsPerTopic] = useState<number>(3);

  // Quiz session state
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<DynamicQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<string>("");
  const [sessionComplete, setSessionComplete] = useState<boolean>(false);
  const [sessionScore, setSessionScore] = useState<number | null>(null);

  // Analytics state
  const [analytics, setAnalytics] = useState<QuizSessionAnalytics | null>(null);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);

  // Loading states
  const [loading, setLoading] = useState<boolean>(true);
  const [creatingSession, setCreatingSession] = useState<boolean>(false);
  const [submittingAnswer, setSubmittingAnswer] = useState<boolean>(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // No need to fetch learners data for single-user system
    setLoading(false);
  }, []);

  const handleCreateSession = async () => {
    console.log("🚀 handleCreateSession called");
    console.log("Default learner ID:", DEFAULT_LEARNER_ID);
    console.log("Custom topics:", customTopics);
    console.log("Selected difficulties:", selectedDifficulties);
    console.log("Questions per topic:", questionsPerTopic);

    if (!customTopics.trim()) {
      setError("Please enter at least one topic");
      return;
    }

    // Parse topics from the input (comma-separated)
    const topics = customTopics
      .split(",")
      .map((topic) => topic.trim())
      .filter((topic) => topic.length > 0);

    console.log("Parsed topics:", topics);

    if (topics.length === 0) {
      setError("Please enter at least one valid topic");
      return;
    }

    try {
      setCreatingSession(true);
      setError(null);

      console.log("📡 Calling API with data:", {
        learnerId: DEFAULT_LEARNER_ID,
        topics,
        difficultyLevels: selectedDifficulties,
        questionsPerTopic,
      });

      const sessionData = await dynamicQuizApi.createSession(DEFAULT_LEARNER_ID, topics, selectedDifficulties, questionsPerTopic);

      setSessionId(sessionData.session_id);
      setQuestions(sessionData.questions);
      setCurrentQuestionIndex(0);
      setUserAnswer("");
      setSelectedOption("");
      setIsAnswered(false);
      setSessionComplete(false);
      setSessionScore(null);
      setShowAnalytics(false);
    } catch (err) {
      setError("Failed to create quiz session");
      console.error("Create session error:", err);
    } finally {
      setCreatingSession(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!sessionId || !questions[currentQuestionIndex]) return;

    const currentQuestion = questions[currentQuestionIndex];
    let answer;

    if (currentQuestion.question_type === "multiple_choice" || currentQuestion.question_type === "true_false") {
      answer = selectedOption;
    } else {
      answer = userAnswer;
    }

    console.log("🔍 Submit Answer Debug:");
    console.log("Question type:", currentQuestion.question_type);
    console.log("Selected option:", selectedOption);
    console.log("User answer:", userAnswer);
    console.log("Final answer:", answer);

    if (!answer || !answer.trim()) {
      setError("Please provide an answer");
      return;
    }

    try {
      setSubmittingAnswer(true);
      setError(null);

      const response = await dynamicQuizApi.submitResponse(
        sessionId,
        currentQuestion.id,
        answer,
        30 // Mock time taken
      );

      setIsCorrect(response.is_correct);
      setExplanation(response.explanation);
      setIsAnswered(true);

      if (response.session_complete) {
        setSessionComplete(true);
        setSessionScore(response.session_score || 0);
      }
    } catch (err) {
      setError("Failed to submit answer");
      console.error("Submit answer error:", err);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer("");
      setSelectedOption("");
      setIsAnswered(false);
      setExplanation("");
    } else {
      // All questions completed - redirect to analytics
      console.log("🎯 All questions completed! Redirecting to analytics...");

      try {
        // Get session analytics before redirecting
        if (sessionId) {
          const analyticsData = await dynamicQuizApi.getSession(sessionId);
          console.log("📊 Analytics data:", analyticsData);

          // Store analytics data in localStorage for the analytics page
          console.log("💾 Storing analytics data in localStorage:");
          console.log("analyticsData:", analyticsData);
          console.log("sessionId:", sessionId);

          localStorage.setItem("dynamicQuizAnalytics", JSON.stringify(analyticsData));
          localStorage.setItem("dynamicQuizSessionId", sessionId.toString());

          console.log("✅ Data stored in localStorage");
        }

        // Redirect to analytics page
        navigate("/analytics");
      } catch (err) {
        console.error("Failed to load analytics before redirect:", err);
        // Still redirect even if analytics loading fails
        navigate("/analytics");
      }
    }
  };

  const handleViewAnalytics = async () => {
    if (!sessionId) return;

    try {
      const analyticsData = await dynamicQuizApi.getSession(sessionId);
      setAnalytics(analyticsData);
      setShowAnalytics(true);
    } catch (err) {
      setError("Failed to load analytics");
      console.error("Analytics error:", err);
    }
  };

  const handleResetQuiz = () => {
    setSessionId(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswer("");
    setSelectedOption("");
    setIsAnswered(false);
    setSessionComplete(false);
    setSessionScore(null);
    setShowAnalytics(false);
    setAnalytics(null);
  };

  const currentQuestion = questions[currentQuestionIndex];

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
        <button onClick={() => setError(null)} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (showAnalytics && analytics) {
    return (
      <div className="container">
        <div className="page-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1>Quiz Analytics</h1>
              <p>Detailed performance analysis from your quiz session</p>
            </div>
            <button onClick={handleResetQuiz} className="btn btn-secondary">
              Take New Quiz
            </button>
          </div>
        </div>

        <div className="analytics-grid">
          {/* Overall Performance */}
          <div className="card">
            <h2>Overall Performance</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{analytics.overall_accuracy.toFixed(1)}%</div>
                <div className="stat-label">Overall Accuracy</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{analytics.session.total_score.toFixed(1)}%</div>
                <div className="stat-label">Total Score</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {analytics.session.correct_answers}/{analytics.session.total_questions}
                </div>
                <div className="stat-label">Correct Answers</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {Math.floor(analytics.session.time_taken / 60)}m {analytics.session.time_taken % 60}s
                </div>
                <div className="stat-label">Time Taken</div>
              </div>
            </div>
          </div>

          {/* Topic Performance */}
          <div className="card">
            <h2>Topic Performance</h2>
            <div className="topic-performance">
              {Object.entries(analytics.topic_performance).map(([topic, stats]) => {
                const accuracy = (stats.correct / stats.total) * 100;
                return (
                  <div key={topic} className="topic-stat">
                    <div className="topic-name">{topic}</div>
                    <div className="topic-accuracy">{accuracy.toFixed(1)}%</div>
                    <div className="topic-details">
                      {stats.correct}/{stats.total} correct
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weak Topics */}
          {analytics.weak_topics.length > 0 && (
            <div className="card">
              <h2>Areas for Improvement</h2>
              <div className="weak-topics">
                {analytics.weak_topics.map((weakTopic) => (
                  <div key={weakTopic.topic} className="weak-topic-item">
                    <div className="weak-topic-name">{weakTopic.topic}</div>
                    <div className="weak-topic-accuracy">{weakTopic.accuracy.toFixed(1)}%</div>
                    <div className="weak-topic-recommendation">Focus on improving {weakTopic.topic} fundamentals</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Difficulty Performance */}
          <div className="card">
            <h2>Difficulty Performance</h2>
            <div className="difficulty-performance">
              {Object.entries(analytics.difficulty_performance).map(([difficulty, stats]) => {
                const accuracy = (stats.correct / stats.total) * 100;
                return (
                  <div key={difficulty} className="difficulty-stat">
                    <div className="difficulty-name">{difficulty}</div>
                    <div className="difficulty-accuracy">{accuracy.toFixed(1)}%</div>
                    <div className="difficulty-details">
                      {stats.correct}/{stats.total} correct
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sessionId && currentQuestion) {
    return (
      <div>
        <div className="page-header">
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h1>Dynamic Quiz</h1>
                <p>Answer questions and track your progress</p>
              </div>
              <div
                className="quiz-progress"
                style={{
                  backgroundColor: "#3b82f6",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
            </div>
          </div>
        </div>
        <div className="container">
          <div className="quiz-content">
            <div className="question-card">
              <div className="question-header">
                <span className="question-topic">{currentQuestion.topic}</span>
                <span className="question-difficulty">{currentQuestion.difficulty}</span>
              </div>

              <div className="question-text">{currentQuestion.question_text}</div>

              {currentQuestion.question_type === "multiple_choice" && currentQuestion.options && (
                <div className="options">
                  {currentQuestion.options.map((option, index) => (
                    <label key={index} className="option">
                      <input
                        type="radio"
                        name="answer"
                        value={option}
                        checked={selectedOption === option}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        disabled={isAnswered}
                      />
                      <span className="option-text">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.question_type === "true_false" && (
                <div className="options">
                  <label className="option">
                    <input
                      type="radio"
                      name="answer"
                      value="True"
                      checked={selectedOption === "True"}
                      onChange={(e) => setSelectedOption(e.target.value)}
                      disabled={isAnswered}
                    />
                    <span className="option-text">True</span>
                  </label>
                  <label className="option">
                    <input
                      type="radio"
                      name="answer"
                      value="False"
                      checked={selectedOption === "False"}
                      onChange={(e) => setSelectedOption(e.target.value)}
                      disabled={isAnswered}
                    />
                    <span className="option-text">False</span>
                  </label>
                </div>
              )}

              {(currentQuestion.question_type === "fill_blank" || currentQuestion.question_type === "short_answer") && (
                <div className="text-input">
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Enter your answer..."
                    disabled={isAnswered}
                    className="answer-input"
                  />
                </div>
              )}

              {isAnswered && (
                <div className={`answer-feedback ${isCorrect ? "correct" : "incorrect"}`}>
                  <div className="feedback-header">{isCorrect ? "✅ Correct!" : "❌ Incorrect"}</div>
                  <div className="correct-answer">Correct Answer: {currentQuestion.correct_answer}</div>
                  {explanation && (
                    <div className="explanation">
                      <strong>Explanation:</strong> {explanation}
                    </div>
                  )}
                </div>
              )}

              <div className="question-actions">
                {!isAnswered ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={
                      submittingAnswer ||
                      (currentQuestion.question_type === "multiple_choice" || currentQuestion.question_type === "true_false"
                        ? !selectedOption
                        : !userAnswer.trim())
                    }
                    className="btn btn-primary"
                  >
                    {submittingAnswer ? "Submitting..." : "Submit Answer"}
                  </button>
                ) : (
                  <div className="next-actions">
                    {sessionComplete ? (
                      <div className="session-complete">
                        <h3>Quiz Complete!</h3>
                        <p>Your score: {sessionScore?.toFixed(1)}%</p>
                        <button onClick={handleViewAnalytics} className="btn btn-primary">
                          View Analytics
                        </button>
                      </div>
                    ) : (
                      <button onClick={handleNextQuestion} className="btn btn-primary">
                        {currentQuestionIndex < questions.length - 1 ? "Next Question" : "View Analytics"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>AI-Powered Dynamic Quiz Generator</h1>
          <p>Enter your own topics and let AI generate personalized questions for you. Get instant feedback and detailed analytics.</p>
        </div>
      </div>
      <div className="container">
        <div className="quiz-setup">
          {/* Custom Topics Input */}
          <div className="card">
            <div className="section-header">
              <h2>Enter Your Topics</h2>
              <p>Specify the topics you want to be quizzed on</p>
            </div>
            <div className="topic-input-section">
              <label htmlFor="custom-topics" className="form-label">
                Enter topics separated by commas (e.g., "Machine Learning, Python Programming, Data Analysis")
              </label>
              <textarea
                id="custom-topics"
                value={customTopics}
                onChange={(e) => setCustomTopics(e.target.value)}
                placeholder="Enter your topics here..."
                className="form-textarea"
                rows={4}
              />
              <div className="topic-examples">
                <p>
                  <strong>Example topics:</strong>
                </p>
                <ul>
                  <li>Machine Learning, Neural Networks, Deep Learning</li>
                  <li>Python Programming, Web Development, Database Design</li>
                  <li>Data Science, Statistics, Business Analytics</li>
                  <li>React Development, Node.js, API Design</li>
                  <li>Docker, Kubernetes, Cloud Computing</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="card">
            <div className="section-header">
              <h2>Select Difficulty Levels</h2>
              <p>Choose the difficulty levels for your quiz questions</p>
            </div>
            <div className="difficulty-grid">
              {["easy", "medium", "hard"].map((difficulty) => (
                <label key={difficulty} className="difficulty-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedDifficulties.includes(difficulty)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDifficulties([...selectedDifficulties, difficulty]);
                      } else {
                        setSelectedDifficulties(selectedDifficulties.filter((d) => d !== difficulty));
                      }
                    }}
                  />
                  <span className="difficulty-name">{difficulty}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Questions per Topic */}
          <div className="card">
            <div className="section-header">
              <h2>Questions per Topic</h2>
              <p>Set the number of questions for each topic-difficulty combination</p>
            </div>
            <input
              type="number"
              min="1"
              max="10"
              value={questionsPerTopic}
              onChange={(e) => setQuestionsPerTopic(Number(e.target.value))}
              className="form-input"
            />
            <p className="form-help">Number of questions to generate for each topic-difficulty combination</p>
          </div>

          {/* Create Quiz Button */}
          <div className="card">
            <button onClick={handleCreateSession} disabled={creatingSession || !customTopics.trim()} className="btn btn-primary btn-large">
              {creatingSession ? "Generating Quiz with AI..." : "Generate AI Quiz"}
            </button>
            {creatingSession && (
              <div className="generation-status">
                <p>🤖 AI is generating personalized questions for your topics...</p>
                <p>This may take a few moments depending on the number of topics and questions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicQuiz;
