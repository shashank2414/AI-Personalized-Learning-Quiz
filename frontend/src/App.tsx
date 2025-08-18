import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import Dashboard from "./pages/Dashboard";
import Recommendations from "./pages/Recommendations";
import Analytics from "./pages/Analytics";

import Quizzes from "./pages/Quizzes";
import DynamicQuiz from "./pages/DynamicQuiz";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/analytics" element={<Analytics />} />

            <Route path="/quizzes" element={<Quizzes />} />
            <Route path="/dynamic-quiz" element={<DynamicQuiz />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
