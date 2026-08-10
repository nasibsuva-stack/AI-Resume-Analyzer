import os
import json

from flask import Flask, request, jsonify
from flask_cors import CORS

from werkzeug.utils import secure_filename

from dotenv import load_dotenv

from pypdf import PdfReader
from docx import Document

from google import genai


# =========================================================
# CONFIGURATION
# =========================================================

load_dotenv()


app = Flask(__name__)


CORS(app)


UPLOAD_FOLDER = "uploads"


ALLOWED_EXTENSIONS = {
    "pdf",
    "docx"
}


app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


# Maximum upload size = 10 MB

app.config["MAX_CONTENT_LENGTH"] = (
    10 * 1024 * 1024
)


# Create uploads directory

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)


# =========================================================
# GEMINI CLIENT
# =========================================================

gemini_api_key = os.getenv(
    "GEMINI_API_KEY"
)


if not gemini_api_key:

    print(
        "WARNING: GEMINI_API_KEY is not configured."
    )


client = None


if gemini_api_key:

    client = genai.Client(
        api_key=gemini_api_key
    )


# =========================================================
# FILE HELPERS
# =========================================================

def allowed_file(filename):

    return (
        "." in filename
        and
        filename.rsplit(
            ".",
            1
        )[1].lower()
        in ALLOWED_EXTENSIONS
    )


# =========================================================
# PDF TEXT EXTRACTION
# =========================================================

def extract_pdf_text(filepath):

    text = ""


    reader = PdfReader(
        filepath
    )


    for page in reader.pages:

        page_text = page.extract_text()


        if page_text:

            text += (
                page_text +
                "\n"
            )


    return text


# =========================================================
# DOCX TEXT EXTRACTION
# =========================================================

def extract_docx_text(filepath):

    document = Document(
        filepath
    )


    paragraphs = []


    for paragraph in document.paragraphs:

        if paragraph.text.strip():

            paragraphs.append(
                paragraph.text
            )


    return "\n".join(
        paragraphs
    )


# =========================================================
# RESUME TEXT EXTRACTION
# =========================================================

def extract_resume_text(
    filepath,
    filename
):

    extension = (
        filename
        .rsplit(
            ".",
            1
        )[1]
        .lower()
    )


    if extension == "pdf":

        return extract_pdf_text(
            filepath
        )


    if extension == "docx":

        return extract_docx_text(
            filepath
        )


    return ""


# =========================================================
# CLEAN AI JSON
# =========================================================

def clean_json_response(text):

    text = text.strip()


    # Remove markdown code block
    # if Gemini returns one accidentally.

    if text.startswith(
        "```json"
    ):

        text = text[
            7:
        ]


    elif text.startswith(
        "```"
    ):

        text = text[
            3:
        ]


    if text.endswith(
        "```"
    ):

        text = text[
            :-3
        ]


    return text.strip()


# =========================================================
# AI RESUME ANALYSIS
# =========================================================

def analyze_resume_with_ai(
    resume_text
):

    if not client:

        raise Exception(
            "Gemini API key is not configured."
        )


    prompt = f"""
You are an expert resume analyzer
and ATS consultant.

Analyze the candidate's resume carefully.

Return ONLY valid JSON.

Do not use markdown.

Do not use ```json.

Do not add explanations outside JSON.

Use exactly this JSON structure:

{{
  "ats_score": 0,
  "overall_summary": "",
  "candidate_name": "",
  "career_level": "",
  "skills": [],
  "technical_skills": [],
  "soft_skills": [],
  "strengths": [],
  "weaknesses": [],
  "missing_skills": [],
  "improvements": [],
  "experience_analysis": "",
  "education_analysis": "",
  "projects_analysis": "",
  "ats_tips": []
}}

Rules:

1. ats_score must be an integer
   from 0 to 100.

2. Analyze only information present
   in the resume.

3. Do not invent experience,
   education, skills, projects,
   certifications, or achievements.

4. Identify technical skills separately.

5. Identify soft skills separately.

6. Give practical resume improvements.

7. Identify useful skills that appear
   to be missing from the resume.

8. Keep the analysis concise but useful.

9. Return valid JSON only.

RESUME:

{resume_text}
"""


    response = client.models.generate_content(

        model="gemini-3.6-flash",

        contents=prompt,

        config={
            "response_mime_type":
                "application/json"
        }
    )


    result = clean_json_response(
        response.text
    )


    return json.loads(
        result
    )


# =========================================================
# JOB DESCRIPTION MATCHING
# =========================================================

def match_resume_with_job(
    resume_text,
    job_description
):

    if not client:

        raise Exception(
            "Gemini API key is not configured."
        )


    prompt = f"""
You are an expert ATS,
recruitment, and resume matching assistant.

Compare the candidate's resume with
the provided job description.

Return ONLY valid JSON.

Do not use markdown.

Do not use ```json.

Do not add explanations outside JSON.

Use exactly this JSON structure:

{{
  "match_score": 0,
  "matched_skills": [],
  "missing_skills": [],
  "keywords": [],
  "recommendations": []
}}

Rules:

1. match_score must be an integer
   from 0 to 100.

2. matched_skills should contain skills
   clearly present in both the resume
   and job description.

3. missing_skills should contain important
   requirements from the job description
   that are not clearly present in
   the resume.

4. keywords should contain important
   technical, professional, and role-related
   keywords from the job description.

5. recommendations should give practical
   suggestions for improving the resume
   specifically for this job.

6. Do not invent experience or skills.

7. Do not claim that the candidate has
   a skill unless the resume clearly
   supports it.

8. Return valid JSON only.

RESUME:

{resume_text}


JOB DESCRIPTION:

{job_description}
"""


    response = client.models.generate_content(

        model="gemini-3.6-flash",

        contents=prompt,

        config={
            "response_mime_type":
                "application/json"
        }
    )


    result = clean_json_response(
        response.text
    )


    return json.loads(
        result
    )


# =========================================================
# HOME ROUTE
# =========================================================

@app.route("/")
def home():

    return jsonify({

        "success": True,

        "message":
            "AI Resume Analyzer Backend is Running!"

    })


# =========================================================
# UPLOAD RESUME
# =========================================================

@app.route(
    "/api/upload",
    methods=["POST"]
)
def upload_resume():

    if "resume" not in request.files:

        return jsonify({

            "success": False,

            "error":
                "No resume file was provided."

        }), 400


    file = request.files[
        "resume"
    ]


    if file.filename == "":

        return jsonify({

            "success": False,

            "error":
                "No file was selected."

        }), 400


    if not allowed_file(
        file.filename
    ):

        return jsonify({

            "success": False,

            "error":
                "Only PDF and DOCX files are allowed."

        }), 400


    filename = secure_filename(
        file.filename
    )


    filepath = os.path.join(

        app.config[
            "UPLOAD_FOLDER"
        ],

        filename

    )


    try:

        file.save(
            filepath
        )


        resume_text = (
            extract_resume_text(
                filepath,
                filename
            )
        )


        if not resume_text.strip():

            return jsonify({

                "success": False,

                "error":
                    "Could not extract text from this resume."

            }), 400


        return jsonify({

            "success": True,

            "filename":
                filename,

            "text":
                resume_text,

            "message":
                "Resume uploaded successfully."

        })


    except Exception as error:

        print(
            "UPLOAD ERROR:",
            error
        )


        return jsonify({

            "success": False,

            "error":
                str(error)

        }), 500


# =========================================================
# AI RESUME ANALYSIS API
# =========================================================

@app.route(
    "/api/analyze",
    methods=["POST"]
)
def analyze_resume():

    data = request.get_json()


    if not data:

        return jsonify({

            "success": False,

            "error":
                "No JSON data received."

        }), 400


    resume_text = data.get(
        "resume_text",
        ""
    )


    if not resume_text.strip():

        return jsonify({

            "success": False,

            "error":
                "Resume text is required."

        }), 400


    try:

        analysis = (
            analyze_resume_with_ai(
                resume_text
            )
        )


        return jsonify({

            "success": True,

            "analysis":
                analysis

        })


    except json.JSONDecodeError:

        return jsonify({

            "success": False,

            "error":
                "AI returned invalid JSON."

        }), 500


    except Exception as error:

        print(
            "AI ANALYSIS ERROR:",
            error
        )


        return jsonify({

            "success": False,

            "error":
                str(error)

        }), 500


# =========================================================
# JOB MATCH API
# =========================================================

@app.route(
    "/api/job-match",
    methods=["POST"]
)
def job_match():

    data = request.get_json()


    if not data:

        return jsonify({

            "success": False,

            "error":
                "No JSON data received."

        }), 400


    resume_text = data.get(
        "resume_text",
        ""
    )


    job_description = data.get(
        "job_description",
        ""
    )


    if not resume_text.strip():

        return jsonify({

            "success": False,

            "error":
                "Resume text is required."

        }), 400


    if not job_description.strip():

        return jsonify({

            "success": False,

            "error":
                "Job description is required."

        }), 400


    try:

        match = (
            match_resume_with_job(
                resume_text,
                job_description
            )
        )


        return jsonify({

            "success": True,

            "match":
                match

        })


    except json.JSONDecodeError:

        return jsonify({

            "success": False,

            "error":
                "AI returned invalid JSON."

        }), 500


    except Exception as error:

        print(
            "JOB MATCH ERROR:",
            error
        )


        return jsonify({

            "success": False,

            "error":
                str(error)

        }), 500


# =========================================================
# ERROR HANDLER - FILE TOO LARGE
# =========================================================

@app.errorhandler(413)
def file_too_large(error):

    return jsonify({

        "success": False,

        "error":
            "File is too large. Maximum size is 10 MB."

    }), 413


# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":

    app.run(

        host="0.0.0.0",

        port=5000,

        debug=True

    )