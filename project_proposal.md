Week 1: Problem Definition and Proposal Preparation

1. Project Title

Personalized Quiz Recommendation System


2. Problem Statement

Traditional e-learning platforms often provide static quiz questions that are the same for all learners, regardless of their learning pace, strengths, or weaknesses. This one-size-fits-all approach leads to inefficient learning, decreased engagement, and poor knowledge retention.

Personalized learning aims to adapt educational content based on individual performance and learning styles, thereby enhancing engagement and outcomes. The specific problem we aim to solve is:

“How can we recommend the most relevant quizzes to each learner based on their past performance and topic proficiency, improving engagement and retention?”


3. Objectives

Analyze learner performance data and identify weak areas.

Build a recommendation system that suggests quizzes tailored to each learner’s needs.

Evaluate the system using accuracy, coverage, and learner improvement metrics.

Deploy a simple interface for interaction and recommendations.


4. Scope

Duration: 4 weeks

Focus on quiz recommendation only, not full course content.

Use a small, simulated dataset of learners, quizzes, and performance scores.

Implement core recommendation logic (Collaborative Filtering or Content-Based).

Create a simple web-based demo or Jupyter notebook showcasing recommendations.


5. Dataset Selection or Creation

Simulated Dataset:

Learner Table: learner_id, name, past performance score per topic

Quiz Table: quiz_id, topic, difficulty level

Performance Table: learner_id, quiz_id, score

We will generate synthetic data (~50 learners, 100 quizzes) for controlled experimentation.


6. Initial Literature Review

"Deep Knowledge Tracing" – Piech et al., 2015: Introduced RNN-based models for predicting student knowledge states.

"A survey of personalized learning approaches" – Explores adaptive learning strategies in e-learning platforms.

Collaborative Filtering in Recommender Systems – Key technique for personalized recommendations.


7. Proposed Solution Approach

Learning Type: Supervised + Collaborative Filtering approach.

Recommendation Strategy:

Start with content-based filtering (recommend quizzes based on topics where user scores low).

Integrate collaborative filtering for similarity-based recommendations.

Tools & Frameworks:

Python, Pandas, Scikit-learn

Surprise library (for collaborative filtering)

Flask or Streamlit for simple UI demo

8. Expected Deliverables by Week 4

Code: Recommendation system implemented in Python.

Dataset: Simulated learner and quiz dataset.

Model: Trained model for generating quiz recommendations.

Documentation: Complete explanation of approach and code usage.

Demo: Simple web-based or notebook-based demo showing personalized recommendations.

Presentation & Video: Short demo video explaining the system.

---------------------------------------------------------------------------------------------------------------------------

Week 2: Data Collection and Preprocessing
Objective

The goal of Week 2 is to create or select the dataset for the personalized quiz recommendation system, clean and preprocess the data, and perform exploratory analysis to understand key patterns. This stage ensures we have a structured, high-quality dataset ready for model building in Week 3.

Detailed Tasks
✅ 1. Dataset Creation

Since real learner data may not be easily available, we will simulate the dataset to resemble a real-world learning environment:

Learners Table (learners.csv)

Columns: learner_id, name, age, preferred_topics, average_score

Example:

L001, Alice, 21, ["Math", "Science"], 75


Quizzes Table (quizzes.csv)

Columns: quiz_id, topic, difficulty_level

Example:

Q001, Math, Medium


Performance Table (performance.csv)

Columns: learner_id, quiz_id, score

Example:

L001, Q001, 80


We will generate synthetic data for at least:

50 learners

100 quizzes

500–1000 performance records

✅ 2. Data Cleaning

Remove any duplicate records.

Ensure consistent formatting for topics and difficulty levels.

Handle missing values (although synthetic data will minimize this).

Normalize scores (e.g., scale 0–100).

✅ 3. Feature Engineering

Topic proficiency:
For each learner, calculate average score per topic.

Difficulty preference:
Determine which difficulty level the learner performs best in.

Overall learner profile:
Combine topic proficiency and difficulty trends to create features.

Example engineered features for a learner:

learner_id: L001
math_proficiency: 80
science_proficiency: 70
preferred_difficulty: Medium

✅ 4. Exploratory Data Analysis (EDA)

Perform visual and statistical analysis to understand the dataset:

Distribution of scores per topic (bar chart)

Count of quizzes per difficulty level

Average learner performance per topic

Correlation between difficulty and success rate

Tools: Pandas, Matplotlib, Seaborn

Example visualizations:

Bar chart: Topic vs Average Score

Heatmap: Correlation between features

✅ 5. Split Data

Separate the dataset into:

Training Set (80%)

Testing Set (20%)

Use stratified splitting if needed to maintain topic balance.

Expected Outputs

By the end of Week 2, you should have:

✅ learners.csv, quizzes.csv, and performance.csv files with synthetic data.

✅ Preprocessing script (preprocess.py) that cleans and prepares the data.

✅ EDA report (EDA.ipynb) with visualizations and insights.

✅ Ready-to-use dataset for model building in Week 3.