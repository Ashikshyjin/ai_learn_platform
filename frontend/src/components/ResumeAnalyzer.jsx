import React, { useState } from 'react';

export default function ResumeAnalyzer({ backendUrl, headers }) {
  const [resumeText, setResumeText] = useState('');
  const [role, setRole] = useState('AI Engineer');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { current_skills, missing_skills, learning_roadmap }

  const handleAnalyze = async () => {
    if (!resumeText.trim() || !role.trim()) {
      alert("Please paste your resume content and enter a target role.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/resume/analyze`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text_content: resumeText,
          target_role: role
        })
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        alert("Failed to analyze resume.");
      }
    } catch (err) {
      console.error(err);
      alert("Error parsing resume.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasteDemo = () => {
    setResumeText(
      "John Doe\nEmail: john@gmail.com\n\nExperience:\n" +
      "- Software Engineer at Tech Corp: built Flask microservices, SQL databases, and ETL scripts using Python.\n" +
      "- Developed machine learning algorithms, trained NLP sentiment classifiers using scikit-learn and pandas.\n\n" +
      "Skills:\nPython, Flask, Scikit-learn, Pandas, PostgreSQL, Machine Learning, NLP, Docker."
    );
  };

  return (
    <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1>Resume-to-Learning Roadmap Agent</h1>
        <p className="subtitle">Identify gaps in your skills relative to target roles, and build a curriculum to bridge them.</p>
      </div>

      {!result ? (
        <div style={formLayoutGrid}>
          <div className="glass-panel" style={formWorkspaceStyle}>
            <h2>Provide Career Target</h2>
            
            <div style={formGroupStyle}>
              <label style={labelStyle}>Target Job Role</label>
              <input 
                type="text" 
                value={role} 
                onChange={(e) => setRole(e.target.value)} 
                placeholder="e.g. AI Engineer, Senior Backend Developer" 
                className="form-input"
              />
            </div>

            <div style={formGroupStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={labelStyle}>Paste Resume Content</label>
                <button onClick={handlePasteDemo} style={demoButtonStyle}>Use Demo Text</button>
              </div>
              <textarea 
                value={resumeText} 
                onChange={(e) => setResumeText(e.target.value)}
                rows={12} 
                placeholder="Paste the raw text of your resume or CV here..." 
                className="form-textarea"
              />
            </div>

            <button 
              onClick={handleAnalyze} 
              disabled={loading} 
              className="btn-primary" 
              style={{ justifyContent: 'center' }}
            >
              {loading ? 'Performing Skills Matching...' : 'Analyze Resume Skills'}
            </button>
          </div>

          <div className="glass-panel" style={infoPanelStyle}>
            <h2>Why Use This?</h2>
            <ul style={infoListStyle}>
              <li>
                <strong>Recruiter Alignment:</strong> Compare your skills against actual industry standards for your dream role.
              </li>
              <li>
                <strong>Targeted Growth:</strong> Avoid studying arbitrary concepts; focus directly on what is missing from your profile.
              </li>
              <li>
                <strong>Tailored Syllabus:</strong> Generates a step-by-step timeline including books, doc pages, and tutorials.
              </li>
            </ul>
          </div>
        </div>
      ) : (
        /* ANALYSIS RESULTS */
        <div className="animate-slide-in" style={resultsLayoutGrid}>
          {/* SKILLS COMPARISON PANEL */}
          <div className="glass-panel" style={skillsCardStyle}>
            <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Skills Gap Analysis</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target: <strong>{role}</strong></span>
              </div>
              <button onClick={() => setResult(null)} className="btn-secondary" style={{ padding: '8px 16px' }}>Re-Analyze</button>
            </div>

            <div style={comparisonGridStyle}>
              <div>
                <h3 style={{ fontSize: '0.95rem', color: 'var(--success)', marginBottom: '10px' }}>Current Skills Found</h3>
                <div style={badgeContainerStyle}>
                  {result.current_skills.map((s, idx) => (
                    <span key={idx} className="badge badge-success">{s}</span>
                  ))}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '0.95rem', color: 'var(--danger)', marginBottom: '10px' }}>Missing Core Skills</h3>
                <div style={badgeContainerStyle}>
                  {result.missing_skills.map((s, idx) => (
                    <span key={idx} className="badge badge-danger">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ROADMAP CURRICULUM PANEL */}
          <div className="glass-panel" style={roadmapPanelStyle}>
            <h2 style={{ marginBottom: '20px' }}>Personal Learning Curriculum</h2>
            
            <div style={timelineContainerStyle}>
              {result.learning_roadmap.map((phase, idx) => (
                <div key={idx} style={timelineItemStyle}>
                  <div style={timelineBulletStyle}>{idx + 1}</div>
                  <div className="glass-card" style={{ flex: 1, background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}>{phase.phase}</h4>
                      <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>{phase.duration}</span>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Core Topics:</span>
                      <ul style={{ paddingLeft: '18px', fontSize: '0.85rem', marginTop: '4px', color: 'var(--text-main)' }}>
                        {phase.topics?.map((topic, tIdx) => (
                          <li key={tIdx} style={{ marginBottom: '3px' }}>{topic}</li>
                        ))}
                      </ul>
                    </div>

                    {phase.resources && phase.resources.length > 0 && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>Suggested Materials:</span>
                        <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', marginTop: '4px', color: 'var(--text-muted)' }}>
                          {phase.resources.map((res, rIdx) => (
                            <li key={rIdx}>{res}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Styles for ResumeAnalyzer
const formLayoutGrid = {
  display: 'grid',
  gridTemplateColumns: '2.5fr 1.5fr',
  gap: '30px'
};

const formWorkspaceStyle = {
  padding: '35px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
};

const formGroupStyle = {
  marginBottom: '10px'
};

const labelStyle = {
  fontSize: '0.85rem',
  color: 'var(--text-muted)',
  fontWeight: 600
};

const demoButtonStyle = {
  background: 'transparent',
  border: 'none',
  color: 'var(--accent-primary)',
  fontSize: '0.8rem',
  fontWeight: 600,
  cursor: 'pointer',
  textDecoration: 'underline'
};

const infoPanelStyle = {
  padding: '30px'
};

const infoListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  paddingLeft: '20px',
  marginTop: '20px',
  color: 'var(--text-main)',
  fontSize: '0.95rem',
  lineHeight: '1.6'
};

const resultsLayoutGrid = {
  display: 'flex',
  flexDirection: 'column',
  gap: '30px'
};

const skillsCardStyle = {
  padding: '25px'
};

const comparisonGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '30px'
};

const badgeContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginTop: '5px'
};

const roadmapPanelStyle = {
  padding: '30px'
};

const timelineContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  position: 'relative',
  paddingLeft: '20px',
  borderLeft: '2px solid rgba(255,255,255,0.06)'
};

const timelineItemStyle = {
  display: 'flex',
  gap: '20px',
  position: 'relative'
};

const timelineBulletStyle = {
  position: 'absolute',
  left: '-31px',
  top: '4px',
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  background: 'var(--bg-primary)',
  border: '2px solid var(--accent-primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.7rem',
  fontWeight: 700,
  color: '#fff'
};
