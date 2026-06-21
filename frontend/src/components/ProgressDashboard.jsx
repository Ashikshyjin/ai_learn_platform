import React, { useState, useEffect } from 'react';

export default function ProgressDashboard({ stats, refreshStats, backendUrl, headers }) {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error("Error fetching docs", err);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${backendUrl}/api/upload`, {
        method: "POST",
        headers: headers, // Can contain x-gemini-api-key
        body: formData
      });
      if (res.ok) {
        alert("Document processed and embedded successfully!");
        fetchDocuments();
        refreshStats();
      } else {
        const data = await res.json();
        alert(`Upload failed: ${data.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading file. Make sure backend is running.");
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document? It will be removed from the Vector DB.")) return;
    try {
      const res = await fetch(`${backendUrl}/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchDocuments();
        refreshStats();
      }
    } catch (err) {
      console.error("Error deleting doc", err);
    }
  };

  return (
    <div className="animate-slide-in" style={containerStyle}>
      <div style={headerSectionStyle}>
        <div>
          <h1>Welcome back, Scholar</h1>
          <p className="subtitle">Track your progress and manage your course knowledge base groundings.</p>
        </div>
      </div>

      {/* STATS SECTION */}
      <div style={statsGridStyle}>
        <div className="glass-card" style={statCardStyle}>
          <div style={statHeaderStyle}>
            <span style={statTitleStyle}>Course Materials</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20F4 19.5V3.5A2.5 2.5 0 0 1 6.5 1H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z"/></svg>
          </div>
          <span style={statValueStyle}>{stats.total_documents || 0}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Files indexed in Vector DB</span>
        </div>

        <div className="glass-card" style={statCardStyle}>
          <div style={statHeaderStyle}>
            <span style={statTitleStyle}>Quizzes Completed</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-secondary)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <span style={statValueStyle}>{stats.total_quizzes_taken || 0}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Practice sessions completed</span>
        </div>

        <div className="glass-card" style={statCardStyle}>
          <div style={statHeaderStyle}>
            <span style={statTitleStyle}>Average Accuracy</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <span style={{ ...statValueStyle, color: 'var(--success)' }}>{stats.average_quiz_score || 0}%</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Score across all concepts</span>
        </div>
      </div>

      <div style={splitGridStyle}>
        {/* LEFT COLUMN: KNOWLEDGE BASE MANAGER */}
        <div className="glass-panel" style={panelStyle}>
          <h2 style={{ marginBottom: '15px' }}>Course Knowledge Base</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Upload syllabus documents or lecture slides. The system will chunk and embed them to answers queries factually.
          </p>

          {/* UPLOAD BOX */}
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            style={{
              ...uploadBoxStyle,
              borderColor: dragActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.08)',
              background: dragActive ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255, 255, 255, 0.02)'
            }}
          >
            {uploading ? (
              <div style={uploadMessageStyle}>
                <div className="pulse-circle" />
                <span style={{ fontWeight: 600 }}>Analyzing & Indexing PDF...</span>
              </div>
            ) : (
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ marginBottom: '10px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <p style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '5px' }}>Drag and drop your lecture PDF/TXT here</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>or</p>
                <label style={fileLabelStyle}>
                  Browse Files
                  <input type="file" onChange={handleFileChange} accept=".pdf,.txt,.md" style={{ display: 'none' }} />
                </label>
              </div>
            )}
          </div>

          {/* DOCUMENTS LIST */}
          <div style={{ marginTop: '25px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '10px', color: '#fff' }}>Indexed Materials ({documents.length})</h3>
            <div style={docListContainerStyle}>
              {documents.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No materials uploaded yet.
                </div>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} style={docRowStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, overflow: 'hidden' }}>
                      <span style={docNameStyle} title={doc.filename}>{doc.filename}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {(doc.char_count / 1000).toFixed(1)}k chars • Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {doc.summary && (
                        <button 
                          onClick={() => setSelectedSummary(doc)} 
                          style={docActionStyle}
                          title="View AI Summary"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        </button>
                      )}
                      <button 
                        onClick={() => deleteDocument(doc.id)} 
                        style={{ ...docActionStyle, color: 'var(--danger)' }}
                        title="Delete document"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INSIGHTS & WEAK TOPICS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div className="glass-panel" style={panelStyle}>
            <h2 style={{ marginBottom: '15px' }}>Concept Insights</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              We track quiz submissions to identify topics you need to revise.
            </p>

            <h3 style={{ fontSize: '0.95rem', marginBottom: '10px', color: '#fff' }}>Topics Requiring Focus</h3>
            <div style={weakTopicsContainerStyle}>
              {(!stats.weak_topics || stats.weak_topics.length === 0) ? (
                <div style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  🎉 No weak topics flagged yet! Keep taking quizzes.
                </div>
              ) : (
                stats.weak_topics.map((topic, i) => (
                  <div key={i} className="badge badge-danger animate-slide-in" style={{ display: 'inline-flex', padding: '8px 12px', fontSize: '0.8rem', gap: '5px', alignItems: 'center' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    {topic}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-panel" style={panelStyle}>
            <h2 style={{ marginBottom: '15px' }}>Active Study Plans</h2>
            <div style={planListStyle}>
              {(!stats.recent_plans || stats.recent_plans.length === 0) ? (
                <div style={{ padding: '10px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No study roadmaps created. Navigate to Study Planner to generate one.
                </div>
              ) : (
                stats.recent_plans.map((p, i) => (
                  <div key={p.id} style={planRowStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>{p.subject}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Targeting: {p.target_date} • {p.current_level}</span>
                    </div>
                    <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>Active</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI SUMMARY MODAL */}
      {selectedSummary && (
        <div style={modalOverlayStyle} onClick={() => setSelectedSummary(null)}>
          <div className="glass-panel" style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>AI Document Summary</h3>
              <button onClick={() => setSelectedSummary(null)} style={closeButtonStyle}>&times;</button>
            </div>
            <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--accent-secondary)', marginBottom: '10px' }}>{selectedSummary.filename}</p>
            <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {selectedSummary.summary}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Styles for ProgressDashboard
const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '30px'
};

const headerSectionStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '20px'
};

const statCardStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const statHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const statTitleStyle = {
  fontSize: '0.9rem',
  color: 'var(--text-muted)',
  fontWeight: 600
};

const statValueStyle = {
  fontSize: '2.5rem',
  fontWeight: '800',
  color: '#fff'
};

const splitGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1.8fr 1.2fr',
  gap: '30px'
};

const panelStyle = {
  padding: '25px',
  display: 'flex',
  flexDirection: 'column'
};

const uploadBoxStyle = {
  border: '2px dashed rgba(255,255,255,0.08)',
  borderRadius: '12px',
  padding: '40px 20px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease'
};

const uploadMessageStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '15px'
};

const fileLabelStyle = {
  background: 'rgba(99, 102, 241, 0.1)',
  color: 'var(--accent-primary)',
  border: '1px solid rgba(99, 102, 241, 0.2)',
  padding: '6px 16px',
  borderRadius: '6px',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.85rem',
  marginTop: '5px',
  display: 'inline-block'
};

const docListContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  maxHeight: '260px',
  overflowY: 'auto',
  marginTop: '10px',
  paddingRight: '5px'
};

const docRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.04)',
  borderRadius: '8px',
  gap: '10px'
};

const docNameStyle = {
  fontWeight: 500,
  fontSize: '0.9rem',
  color: '#fff',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const docActionStyle = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  transition: 'color 0.2s ease'
};

const weakTopicsContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '10px',
  marginTop: '10px'
};

const planListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const planRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 0',
  borderBottom: '1px solid rgba(255,255,255,0.05)'
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(4px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const modalContentStyle = {
  width: '90%',
  maxWidth: '550px',
  padding: '30px',
  boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
};

const closeButtonStyle = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  fontSize: '1.8rem',
  lineHeight: 1,
  cursor: 'pointer'
};
