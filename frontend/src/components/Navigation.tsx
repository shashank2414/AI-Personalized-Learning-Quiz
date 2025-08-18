import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navigation: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-brand">
          <Link to="/">🧠 AI Quiz System</Link>
        </div>
        <div className="nav-links">
          <Link to="/" className={isActive("/") ? "active" : ""}>
            Dashboard
          </Link>
          <Link to="/dynamic-quiz" className={isActive("/dynamic-quiz") ? "active" : ""}>
            Dynamic Quiz
          </Link>
          <Link to="/recommendations" className={isActive("/recommendations") ? "active" : ""}>
            Recommendations
          </Link>
          <Link to="/analytics" className={isActive("/analytics") ? "active" : ""}>
            Analytics
          </Link>

          <Link to="/quizzes" className={isActive("/quizzes") ? "active" : ""}>
            Quizzes
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
