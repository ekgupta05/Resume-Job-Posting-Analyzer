import { useState } from "react";
import { useDropzone } from "react-dropzone";

function ResumeUploader() {
  const [file, setFile] = useState(null);
  const [jobPosting, setJobPosting] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const onDrop = (acceptedFiles) => {
    setFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleUpload = async () => {
    if (!file || !jobPosting) {
      alert("Please upload a resume and paste a job posting.");
      return;
    }

    setLoading(true);
    setResult(null); // clear old results while loading

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("job_posting", jobPosting);

    try {
      const response = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Error:", err);
      alert("Something went wrong. Check if the backend is running.");
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "700px", margin: "40px auto", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        📄 Resume & Job Posting Analyzer
      </h2>

      {/* Drag & drop area */}
      <div
        {...getRootProps()}
        style={{
          border: "2px dashed #888",
          borderRadius: "8px",
          padding: "30px",
          marginBottom: "20px",
          textAlign: "center",
          backgroundColor: "#fafafa",
          cursor: "pointer",
        }}
      >
        <input {...getInputProps()} />
        {file ? <p>{file.name}</p> : <p>Drag & drop your resume here, or click to select</p>}
      </div>

      {/* Job posting textarea */}
      <label style={{ fontWeight: "bold" }}>Job Posting</label>
      <textarea
        placeholder="Paste job posting here..."
        value={jobPosting}
        onChange={(e) => setJobPosting(e.target.value)}
        style={{
          width: "100%",
          height: "120px",
          marginBottom: "20px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          padding: "10px",
        }}
      />

      <button
        onClick={handleUpload}
        style={{
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "6px",
          padding: "10px 20px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        Analyze
      </button>

      {/* Loading Bar */}
      {loading && (
        <div style={{ marginTop: "20px" }}>
          <p>⏳ Analyzing resume...</p>
          <div style={{ background: "#eee", borderRadius: "8px", overflow: "hidden" }}>
            <div
              className="loading-bar"
              style={{
                width: "100%",
                height: "10px",
                background: "linear-gradient(90deg, #007bff 25%, #80bdff 50%, #007bff 75%)",
                backgroundSize: "200% 100%",
                animation: "loading 1.5s infinite linear",
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div style={{ marginTop: "30px" }}>
          <h3>Results</h3>

          {/* Fit Score Progress Bar */}
          <p>🎯 Fit Score: {result.fit_score}%</p>
          <div style={{ background: "#eee", borderRadius: "8px", overflow: "hidden" }}>
            <div
              style={{
                width: `${result.fit_score}%`,
                background: result.fit_score >= 70 ? "green" : result.fit_score >= 40 ? "orange" : "red",
                color: "white",
                textAlign: "center",
                padding: "4px 0",
              }}
            >
              {result.fit_score}%
            </div>
          </div>

          {/* Matched Skills */}
          <div style={{ marginTop: "20px" }}>
            <h4>✅ Matched Skills</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {result.matched.map((skill, index) => (
                <span
                  key={index}
                  style={{
                    background: "#d4edda",
                    color: "#155724",
                    padding: "6px 10px",
                    borderRadius: "16px",
                    fontSize: "14px",
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Missing Skills */}
          <div style={{ marginTop: "20px" }}>
            <h4>❌ Missing Skills</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {result.missing.map((skill, index) => (
                <span
                  key={index}
                  style={{
                    background: "#f8d7da",
                    color: "#721c24",
                    padding: "6px 10px",
                    borderRadius: "16px",
                    fontSize: "14px",
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumeUploader;
