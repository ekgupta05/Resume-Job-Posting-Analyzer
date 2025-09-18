# 📄 Resume & Job Posting Analyzer  

An AI-powered web app that compares your **resume** against a **job posting** to highlight matched and missing skills.  
It calculates a **fit score** and presents results in a clean, interactive UI.  

Built with **FastAPI (backend)** + **React (frontend)** + **OpenAI API**.  

---

## 🚀 Features
- 📂 Drag & drop your **resume (PDF)**  
- 📝 Paste the **job posting**  
- 🤖 AI extracts **hard & soft skills** from both  
- 🎯 Calculates a **fit score (0–100%)**  
- ✅ Shows **matched skills** in green tags  
- ❌ Shows **missing skills** in red tags  
- ⏳ Loading animation while analyzing  

---

## 🛠️ Tech Stack
- **Frontend**: React, React Dropzone  
- **Backend**: FastAPI, pdfplumber, OpenAI API  
- **Other**: dotenv, CORS middleware, JSON caching  

---

## ⚡ Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/your-username/resume-analyzer.git
cd resume-analyzer

cd resume_analyzer
python3 -m venv .venv
source .venv/bin/activate   # Mac/Linux
.venv\Scripts\activate      # Windows

pip install -r requirements.txt

OPENAI_API_KEY=your_api_key_here

uvicorn server:app --reload

cd resume-analyzer-frontend
npm install
npm start
