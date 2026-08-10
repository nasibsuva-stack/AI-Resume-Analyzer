import { useState } from "react";
import "./App.css";

function App() {
  // =========================================================
  // STATE
  // =========================================================

  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const [loading, setLoading] = useState(false);

  const [extractedText, setExtractedText] = useState("");

  const [analysis, setAnalysis] = useState(null);

  const [error, setError] = useState("");

  // Job matching
  const [jobDescription, setJobDescription] = useState("");
  const [jobMatch, setJobMatch] = useState(null);
  const [jobLoading, setJobLoading] = useState(false);


  // =========================================================
  // FILE HANDLING
  // =========================================================

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Please upload a PDF or DOCX file.");
      setFile(null);
      return;
    }

    setError("");
    setFile(selectedFile);

    // Reset previous results
    setAnalysis(null);
    setJobMatch(null);
    setExtractedText("");
  };


  const handleInputChange = (event) => {
    const selectedFile = event.target.files[0];

    handleFile(selectedFile);
  };


  const handleDrop = (event) => {
    event.preventDefault();

    setDragActive(false);

    const droppedFile = event.dataTransfer.files[0];

    handleFile(droppedFile);
  };


  // =========================================================
  // RESUME ANALYSIS
  // =========================================================

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please upload your resume first.");
      return;
    }

    setLoading(true);
    setError("");

    setExtractedText("");
    setAnalysis(null);
    setJobMatch(null);

    try {
      // =====================================================
      // STEP 1: UPLOAD RESUME
      // =====================================================

      const formData = new FormData();

      formData.append("resume", file);


      const uploadResponse = await fetch(
        "http://localhost:5000/api/upload",
        {
          method: "POST",
          body: formData,
        }
      );


      const uploadData =
        await uploadResponse.json();


      if (
        !uploadResponse.ok ||
        !uploadData.success
      ) {
        throw new Error(
          uploadData.error ||
          "Resume upload failed."
        );
      }


      // Extracted resume text

      const resumeText =
        uploadData.text;


      setExtractedText(
        resumeText
      );


      // =====================================================
      // STEP 2: SEND TEXT TO GEMINI
      // =====================================================

      const analysisResponse =
        await fetch(
          "http://localhost:5000/api/analyze",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              resume_text:
                resumeText,
            }),
          }
        );


      const analysisData =
        await analysisResponse.json();


      if (
        !analysisResponse.ok ||
        !analysisData.success
      ) {
        throw new Error(
          analysisData.error ||
          "AI analysis failed."
        );
      }


      // Save AI result

      setAnalysis(
        analysisData.analysis
      );

    } catch (error) {

      console.error(
        "RESUME ANALYSIS ERROR:",
        error
      );

      setError(
        error.message ||
        "Something went wrong."
      );

    } finally {

      setLoading(false);

    }
  };


  // =========================================================
  // JOB DESCRIPTION MATCHING
  // =========================================================

  const handleJobMatch = async () => {

    if (!extractedText) {
      setError(
        "Please analyze your resume first."
      );

      return;
    }


    if (!jobDescription.trim()) {
      setError(
        "Please enter a job description."
      );

      return;
    }


    setJobLoading(true);
    setError("");
    setJobMatch(null);


    try {

      const response =
        await fetch(
          "http://localhost:5000/api/job-match",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              resume_text:
                extractedText,

              job_description:
                jobDescription,
            }),
          }
        );


      const data =
        await response.json();


      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
          "Job matching failed."
        );
      }


      setJobMatch(
        data.match
      );

    } catch (error) {

      console.error(
        "JOB MATCH ERROR:",
        error
      );

      setError(
        error.message ||
        "Something went wrong."
      );

    } finally {

      setJobLoading(false);

    }
  };


  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="app">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="navbar">

        <div className="logo">

          <span className="logo-icon">
            AI
          </span>

          Resume Analyzer

        </div>


        <div className="nav-links">

          <a href="#home">
            Home
          </a>

          <a href="#features">
            Features
          </a>

          <a href="#job-matcher">
            Job Matching
          </a>

          <a href="#about">
            About
          </a>

        </div>

      </nav>


      <main>

        {/* =================================================
            HERO
        ================================================= */}

        <section
          className="hero"
          id="home"
        >

          <div className="hero-content">

            <div className="badge">
              ✨ AI-Powered Resume Analysis
            </div>


            <h1>

              Make Your Resume

              <span>
                Job-Ready.
              </span>

            </h1>


            <p>

              Upload your resume and get an
              AI-powered analysis of your skills,
              ATS score, strengths, weaknesses,
              missing skills, and improvement
              suggestions.

            </p>

          </div>


          {/* =================================================
              UPLOAD CARD
          ================================================= */}

          <div className="upload-card">

            <div className="upload-header">

              <h2>
                Analyze Your Resume
              </h2>

              <p>
                Upload your resume to get started
              </p>

            </div>


            <div
              className={`drop-zone ${
                dragActive
                  ? "active"
                  : ""
              }`}

              onDragOver={(event) => {

                event.preventDefault();

                setDragActive(true);

              }}

              onDragLeave={() => {

                setDragActive(false);

              }}

              onDrop={handleDrop}
            >

              <div className="upload-icon">
                ↑
              </div>


              <h3>

                {file
                  ? file.name
                  : "Drop your resume here"}

              </h3>


              <p>

                {file

                  ? `${(
                      file.size /
                      1024 /
                      1024
                    ).toFixed(2)} MB`

                  : "or click below to browse your files"}

              </p>


              <label className="browse-button">

                Choose Resume

                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={
                    handleInputChange
                  }
                  hidden
                />

              </label>


              <small>
                Supported formats: PDF, DOCX
              </small>

            </div>


            {/* ANALYZE BUTTON */}

            <button
              className="analyze-button"
              onClick={
                handleAnalyze
              }
              disabled={
                !file ||
                loading
              }
            >

              {loading
                ? "Analyzing Resume..."
                : "Analyze Resume"}

              {!loading && (
                <span>
                  →
                </span>
              )}

            </button>


            {/* ERROR */}

            {error && (

              <div className="error-message">

                {error}

              </div>

            )}

          </div>

        </section>


        {/* =================================================
            AI ANALYSIS RESULTS
        ================================================= */}

        {analysis && (

          <section className="analysis-result">

            {/* RESULTS HEADER */}

            <div className="results-header">

              <div>

                <span className="results-label">
                  AI ANALYSIS COMPLETE
                </span>


                <h2>
                  Resume Analysis Report
                </h2>


                <p>
                  Here's what our AI found
                  in your resume.
                </p>

              </div>


              {/* ATS SCORE */}

              <div className="score-card">

                <span>
                  ATS SCORE
                </span>


                <strong>
                  {analysis.ats_score}
                </strong>


                <small>
                  out of 100
                </small>

              </div>

            </div>


            {/* =================================================
                OVERALL SUMMARY
            ================================================= */}

            <div className="result-card">

              <div className="card-title">

                <span>
                  🧠
                </span>

                <h3>
                  Overall Summary
                </h3>

              </div>


              <p>
                {analysis.overall_summary}
              </p>

            </div>


            {/* =================================================
                CANDIDATE INFORMATION
            ================================================= */}

            <div className="result-grid">

              <div className="result-card">

                <div className="card-title">

                  <span>
                    👤
                  </span>

                  <h3>
                    Candidate
                  </h3>

                </div>


                <p>
                  {analysis.candidate_name ||
                    "Not specified"}
                </p>

              </div>


              <div className="result-card">

                <div className="card-title">

                  <span>
                    💼
                  </span>

                  <h3>
                    Career Level
                  </h3>

                </div>


                <p>
                  {analysis.career_level ||
                    "Not specified"}
                </p>

              </div>

            </div>


            {/* =================================================
                TECHNICAL + SOFT SKILLS
            ================================================= */}

            <div className="result-grid">

              <div className="result-card">

                <div className="card-title">

                  <span>
                    💻
                  </span>

                  <h3>
                    Technical Skills
                  </h3>

                </div>


                <div className="skill-list">

                  {analysis.technical_skills?.length > 0 ? (

                    analysis.technical_skills.map(
                      (skill, index) => (

                        <span
                          key={index}
                          className="skill-tag"
                        >
                          {skill}
                        </span>

                      )
                    )

                  ) : (

                    <p>
                      No technical skills detected.
                    </p>

                  )}

                </div>

              </div>


              <div className="result-card">

                <div className="card-title">

                  <span>
                    🤝
                  </span>

                  <h3>
                    Soft Skills
                  </h3>

                </div>


                <div className="skill-list">

                  {analysis.soft_skills?.length > 0 ? (

                    analysis.soft_skills.map(
                      (skill, index) => (

                        <span
                          key={index}
                          className="skill-tag soft"
                        >
                          {skill}
                        </span>

                      )
                    )

                  ) : (

                    <p>
                      No soft skills detected.
                    </p>

                  )}

                </div>

              </div>

            </div>


            {/* =================================================
                STRENGTHS + WEAKNESSES
            ================================================= */}

            <div className="result-grid">

              <div className="result-card">

                <div className="card-title">

                  <span>
                    💪
                  </span>

                  <h3>
                    Strengths
                  </h3>

                </div>


                <ul className="result-list">

                  {analysis.strengths?.map(
                    (item, index) => (

                      <li key={index}>
                        {item}
                      </li>

                    )
                  )}

                </ul>

              </div>


              <div className="result-card">

                <div className="card-title">

                  <span>
                    ⚠️
                  </span>

                  <h3>
                    Weaknesses
                  </h3>

                </div>


                <ul className="result-list">

                  {analysis.weaknesses?.map(
                    (item, index) => (

                      <li key={index}>
                        {item}
                      </li>

                    )
                  )}

                </ul>

              </div>

            </div>


            {/* =================================================
                MISSING SKILLS
            ================================================= */}

            <div className="result-card">

              <div className="card-title">

                <span>
                  🎯
                </span>

                <h3>
                  Missing Skills
                </h3>

              </div>


              <p className="card-description">

                Skills that could improve
                your profile for modern
                technology roles.

              </p>


              <div className="skill-list">

                {analysis.missing_skills?.map(
                  (skill, index) => (

                    <span
                      key={index}
                      className="missing-skill"
                    >
                      {skill}
                    </span>

                  )
                )}

              </div>

            </div>


            {/* =================================================
                EXPERIENCE + EDUCATION
            ================================================= */}

            <div className="result-grid">

              <div className="result-card">

                <div className="card-title">

                  <span>
                    💼
                  </span>

                  <h3>
                    Experience Analysis
                  </h3>

                </div>


                <p>
                  {analysis.experience_analysis}
                </p>

              </div>


              <div className="result-card">

                <div className="card-title">

                  <span>
                    🎓
                  </span>

                  <h3>
                    Education Analysis
                  </h3>

                </div>


                <p>
                  {analysis.education_analysis}
                </p>

              </div>

            </div>


            {/* =================================================
                PROJECTS
            ================================================= */}

            <div className="result-card">

              <div className="card-title">

                <span>
                  🚀
                </span>

                <h3>
                  Projects Analysis
                </h3>

              </div>


              <p>
                {analysis.projects_analysis}
              </p>

            </div>


            {/* =================================================
                IMPROVEMENTS
            ================================================= */}

            <div className="result-card improvement-card">

              <div className="card-title">

                <span>
                  ✨
                </span>

                <h3>
                  How to Improve Your Resume
                </h3>

              </div>


              <ul className="result-list">

                {analysis.improvements?.map(
                  (item, index) => (

                    <li key={index}>
                      {item}
                    </li>

                  )
                )}

              </ul>

            </div>


            {/* =================================================
                ATS TIPS
            ================================================= */}

            <div className="result-card">

              <div className="card-title">

                <span>
                  📋
                </span>

                <h3>
                  ATS Optimization Tips
                </h3>

              </div>


              <ul className="result-list">

                {analysis.ats_tips?.map(
                  (item, index) => (

                    <li key={index}>
                      {item}
                    </li>

                  )
                )}

              </ul>

            </div>

          </section>

        )}


        {/* =================================================
            JOB DESCRIPTION MATCHER
        ================================================= */}

        <section
          className="job-matcher"
          id="job-matcher"
        >

          <div className="section-heading">

            <span>
              JOB MATCHING
            </span>


            <h2>
              See How Well Your Resume Matches a Job
            </h2>


            <p>
              First analyze your resume, then
              paste a job description below.
              Gemini will compare both.
            </p>

          </div>


          <div className="job-matcher-card">

            <label>
              Job Description
            </label>


            <textarea
              value={jobDescription}
              onChange={(event) =>
                setJobDescription(
                  event.target.value
                )
              }
              placeholder="Paste the job description here..."
              rows="12"
            />


            <button
              className="match-button"
              onClick={
                handleJobMatch
              }
              disabled={
                !extractedText ||
                jobLoading
              }
            >

              {jobLoading
                ? "Matching Resume..."
                : "Match Resume With Job"}

              {!jobLoading && (
                <span>
                  →
                </span>
              )}

            </button>

          </div>

        </section>


        {/* =================================================
            JOB MATCH RESULTS
        ================================================= */}

        {jobMatch && (

          <section className="job-match-result">

            <div className="match-header">

              <div>

                <span className="results-label">
                  JOB MATCH COMPLETE
                </span>


                <h2>
                  Resume vs Job Description
                </h2>


                <p>
                  AI comparison of your resume
                  with the selected job.
                </p>

              </div>


              <div className="match-score">

                <span>
                  MATCH SCORE
                </span>


                <strong>
                  {jobMatch.match_score}%
                </strong>

              </div>

            </div>


            {/* MATCHED SKILLS */}

            <div className="result-card">

              <div className="card-title">

                <span>
                  ✅
                </span>

                <h3>
                  Matched Skills
                </h3>

              </div>


              <div className="skill-list">

                {jobMatch.matched_skills?.map(
                  (skill, index) => (

                    <span
                      key={index}
                      className="skill-tag"
                    >
                      {skill}
                    </span>

                  )
                )}

              </div>

            </div>


            {/* MISSING SKILLS */}

            <div className="result-card">

              <div className="card-title">

                <span>
                  ❌
                </span>

                <h3>
                  Missing Skills
                </h3>

              </div>


              <div className="skill-list">

                {jobMatch.missing_skills?.map(
                  (skill, index) => (

                    <span
                      key={index}
                      className="missing-skill"
                    >
                      {skill}
                    </span>

                  )
                )}

              </div>

            </div>


            {/* KEYWORDS */}

            <div className="result-card">

              <div className="card-title">

                <span>
                  🔑
                </span>

                <h3>
                  Important Keywords
                </h3>

              </div>


              <div className="skill-list">

                {jobMatch.keywords?.map(
                  (keyword, index) => (

                    <span
                      key={index}
                      className="skill-tag"
                    >
                      {keyword}
                    </span>

                  )
                )}

              </div>

            </div>


            {/* RECOMMENDATIONS */}

            <div className="result-card improvement-card">

              <div className="card-title">

                <span>
                  💡
                </span>

                <h3>
                  Recommendations
                </h3>

              </div>


              <ul className="result-list">

                {jobMatch.recommendations?.map(
                  (item, index) => (

                    <li key={index}>
                      {item}
                    </li>

                  )
                )}

              </ul>

            </div>

          </section>

        )}


        {/* =================================================
            FEATURES
        ================================================= */}

        <section
          className="features"
          id="features"
        >

          <div className="section-heading">

            <span>
              FEATURES
            </span>


            <h2>
              Everything You Need to Improve Your Resume
            </h2>

          </div>


          <div className="feature-grid">

            <div className="feature-card">

              <div className="feature-icon">
                📊
              </div>

              <h3>
                ATS Score
              </h3>

              <p>
                Get an estimated ATS compatibility
                score for your resume.
              </p>

            </div>


            <div className="feature-card">

              <div className="feature-icon">
                🧠
              </div>

              <h3>
                AI Analysis
              </h3>

              <p>
                Let AI identify strengths,
                weaknesses, and important
                resume improvements.
              </p>

            </div>


            <div className="feature-card">

              <div className="feature-icon">
                🛠️
              </div>

              <h3>
                Skill Analysis
              </h3>

              <p>
                Discover your existing skills
                and identify missing skills.
              </p>

            </div>


            <div className="feature-card">

              <div className="feature-icon">
                🎯
              </div>

              <h3>
                Job Matching
              </h3>

              <p>
                Compare your resume against
                a job description and find
                missing keywords.
              </p>

            </div>

          </div>

        </section>


        {/* =================================================
            HOW IT WORKS
        ================================================= */}

        <section
          className="about"
          id="about"
        >

          <h2>
            How It Works
          </h2>


          <div className="steps">

            <div>

              <strong>
                01
              </strong>

              <h3>
                Upload
              </h3>

              <p>
                Upload your PDF or DOCX resume.
              </p>

            </div>


            <div>

              <strong>
                02
              </strong>

              <h3>
                Analyze
              </h3>

              <p>
                Our backend extracts and
                analyzes your resume using AI.
              </p>

            </div>


            <div>

              <strong>
                03
              </strong>

              <h3>
                Improve
              </h3>

              <p>
                Get actionable AI-powered
                recommendations and job matching.
              </p>

            </div>

          </div>

        </section>

      </main>


      {/* =================================================
          FOOTER
      ================================================= */}

      <footer>

        <p>
          © 2026 AI Resume Analyzer
        </p>

      </footer>

    </div>
  );
}

export default App;