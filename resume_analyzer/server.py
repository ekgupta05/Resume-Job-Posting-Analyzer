import os
import pdfplumber
import json
import hashlib
from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from dotenv import load_dotenv

# cache setup
cache = {}
CACHE_FILE = "cache.json"

# load cache from disk at startup
if os.path.exists(CACHE_FILE):
    try:
        with open(CACHE_FILE, "r") as f:
            cache = json.load(f)
        print(f"✅ Cache loaded from {CACHE_FILE}, {len(cache)} entries")
    except Exception as e:
        print("⚠️ Could not load cache:", e)
    

def get_cache_key(resume_text, job_posting):
    """Create a unique hash key for a resume + job pair"""
    return hashlib.md5((resume_text + job_posting).encode()).hexdigest()

load_dotenv()

app = FastAPI()

#allow react to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_methods=["*"],
    allow_headers=["*"],
)

# open ai key 
client = OpenAI (
    api_key=os.getenv("OPENAI_API_KEY")
)

@app.post("/analyze")
async def analyze(resume: UploadFile, job_posting: str = Form(...)):
    resume_text = ""    #extract text from resume
    with pdfplumber.open(resume.file) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                resume_text += text + "\n"

    
    job_posting = " ".join(job_posting.split())
    resume_text = " ".join(resume_text.split())

    key = get_cache_key(resume_text, job_posting)
    if key in cache:
        print("💾 Cache hit for key:", key)
        return cache[key] 

    prompt = f"""
    You are a resume analyzer. Compare the resume with the job posting.

    Resume: {resume_text}
    Job Posting: {job_posting}

    Rules:
    1. Return ONLY valid JSON. No explanations, markdown, or code fences.
    2. JSON must follow this schema:
    {{
        "hard_skills_resume": [],
        "hard_skills_job": [],
        "soft_skills_resume": [],
        "soft_skills_job": [],
        "matched": [],
        "missing": [],
        "fit_score": 0
    }}
    3. When identifying skills:
        - Extract explicit hard/soft skills listed directly in the text.
        - Infer additional skills from job descriptions, responsibilities, and context.
    4. When comparing:
        - If a skill is an exact match (e.g., "Python" vs "Python"), 
          list it once (e.g., "Python").
        - If two skills are close synonyms, use "≈" notation 
          (e.g., "teamwork ≈ collaborative attitude").
        - If two skills are conceptually similar but worded differently, 
          also use "≈".
        - Never return "x ≈ x". If both sides are the same, return just "x".
    5. The "fit_score" must be an integer percentage between 0 and 100, 
       calculated as:
       (number of matched skills ÷ total number of job skills) × 100

    Examples:
    - Resume: ["supportive communication"], Job: ["communication"]
      Matched: ["supportive communication ≈ communication"]

    - Resume: ["leadership"], Job: ["collaboration"]
      Matched: ["leadership ≈ collaboration"]

    - Resume: ["critical thinking"], Job: ["problem-solving"]
      Matched: ["critical thinking ≈ problem-solving"]
    """


    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0,
        seed=42,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )

    output = response.choices[0].message.content.strip()
    
    print("Raw model output:", output)
    try:
        data = json.loads(output)
    except json.JSONDecodeError:
        return {"error": "Invalid JSON from model", "raw_output": output}

    # cleans up matched skills
    if "matched" in data:
        cleaned_matches = []
        for match in data["matched"]:
            if "≈" in match:
                left, right = [s.strip() for s in match.split("≈")]
                if left == right:   # for example "Python ≈ Python"
                    cleaned_matches.append(left)
                else:
                    cleaned_matches.append(match)
            else:
                cleaned_matches.append(match)
        data["matched"] = cleaned_matches

    #  fit_score
    if isinstance(data, dict):
        total_skills = len(data.get("hard_skills_job", [])) + len(data.get("soft_skills_job", []))
        matched_skills = len(data.get("matched", []))
        if total_skills > 0:
            data["fit_score"] = int((matched_skills / total_skills) * 100)

    cache[key] = data

    # save updated cache to disk
    try:
        with open(CACHE_FILE, "w") as f:
            json.dump(cache, f)
        print(f"💾 Cache updated: {len(cache)} entries saved to {CACHE_FILE}")
    except Exception as e:
        print("⚠️ Could not save cache:", e)

    return data
