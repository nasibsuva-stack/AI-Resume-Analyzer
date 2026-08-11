# 🤖 AI Resume Analyzer

An AI-powered resume analysis web application that uses Google's Gemini AI to analyze resumes, generate ATS scores, identify skills, detect weaknesses, suggest improvements, and compare resumes against job descriptions.

---

## 🚀 Features

### 📄 Resume Upload

- Upload PDF resumes
- Upload DOCX resumes
- Drag-and-drop support
- File validation
- Maximum file size: 10 MB

### 🧠 AI Resume Analysis

The application analyzes the uploaded resume using Gemini AI and provides:

- ATS Score
- Overall Resume Summary
- Candidate Name
- Career Level
- Technical Skills
- Soft Skills
- Strengths
- Weaknesses
- Missing Skills
- Experience Analysis
- Education Analysis
- Projects Analysis
- Resume Improvement Suggestions
- ATS Optimization Tips

### 🎯 Job Description Matching

Users can paste a job description and compare it with their resume.

The application provides:

- Job Match Score
- Matched Skills
- Missing Skills
- Important Keywords
- Personalized Recommendations

### 🎨 Modern UI

- Responsive design
- Drag-and-drop resume upload
- Professional dashboard
- Mobile-friendly layout
- Clean AI analysis results
- Job matching interface

---

# 🛠️ Tech Stack

## Frontend

- React.js
- JavaScript
- HTML
- CSS
- Vite

## Backend

- Python
- Flask
- Flask-CORS

## AI

- Google Gemini API
- Gemini 3.6 Flash

## Resume Processing

- PyPDF
- python-docx

## Development Tools

- Git
- GitHub
- VS Code
- npm
- Python virtual environment

---

# 🏗️ Project Architecture

```text
                         AI RESUME ANALYZER
                                |
                +---------------+---------------+
                |                               |
                ↓                               ↓
           React Frontend                  Flask Backend
                |                               |
                |                         Resume Upload
                |                               |
                |                         PDF / DOCX
                |                               |
                |                         Text Extraction
                |                               |
                +---------------+---------------+
                                |
                                ↓
                         Google Gemini AI
                                |
                +---------------+---------------+
                |                               |
                ↓                               ↓
          Resume Analysis                 Job Matching
                |                               |
                ↓                               ↓
        ATS Score                        Match Score
        Skills                           Matched Skills
        Strengths                        Missing Skills
        Weaknesses                       Keywords
        Improvements                     Recommendations
