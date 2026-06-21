import React, { useState, useEffect } from 'react';

export default function WorkflowBuilder({ backendUrl, headers }) {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [workflowName, setWorkflowName] = useState('Study Pack Generation');
  
  // Available blocks
  const availableBlocks = ["Summarize", "Quiz", "Flashcards"];
  const [chain, setChain] = useState(["Summarize", "Quiz", "Flashcards"]); // Default chain

  const [loading, setLoading] = useState(false);
  const [runResult, setRunResult] = useState(null); // { status, logs, output_data }
  const [activeResultTab, setActiveResultTab] = useState('summary');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
        if (data.length > 0) {
          setSelectedDocId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addBlockToChain = (block) => {
    if (chain.includes(block)) return; // Keep linear unique blocks for study workflows
    setChain(prev => [...prev, block]);
  };

  const removeBlockFromChain = (block) => {
    setChain(prev => prev.filter(b => b !== block));
  };

  const handleRun = async () => {
    if (chain.length === 0) {
      alert("Please add at least one step to your workflow.");
      return;
    }

    setLoading(true);
    setRunResult(null);

    try {
      const res = await fetch(`${backendUrl}/api/workflow/run`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          workflow_name: workflowName,
          steps: chain,
          document_id: selectedDocId ? Number(selectedDocId) : undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        setRunResult(data);
        // Default active tab to first item in output
        if (data.output_data) {
          const keys = Object.keys(data.output_data);
          if (keys.length > 0) {
            setActiveResultTab(keys[0]);
          }
        }
      } else {
        alert("Failed to run workflow.");
      }
    } catch (err) {
      console.error(err);
      alert("Error executing workflow.");
    } finally {
      setLoading(false);
    }
  };

  const output = runResult?.output_data || {};

  return (
    <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1>AI Workflow Builder</h1>
        <p className="subtitle">Assemble and connect modular AI nodes to automate study material processing pipelines.</p>
      </div>

      <div style={layoutGridStyle}>
        {/* WORKSPACE & CANVAS */}
        <div className="glass-panel" style={canvasPanelStyle}>
          <h2>Workflow Design Canvas</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Click available blocks to append them to your processing sequence. Drag-and-drop or customize node parameters.
          </p>

          <div style={blocksBankStyle}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Available Nodes:</span>
            <div style={bankFlexStyle}>
              {availableBlocks.map(block => {
                const inChain = chain.includes(block);
                return (
                  <button
                    key={block}
                    disabled={inChain}
                    onClick={() => addBlockToChain(block)}
                    style={{
                      ...bankButtonStyle,
                      opacity: inChain ? 0.4 : 1,
                      cursor: inChain ? 'not-allowed' : 'pointer'
                    }}
                  >
                    + {block}
                  </button>
                );
              })}
            </div>
          </div>

          {/* VISUAL SEQUENCE CANVAS */}
          <div style={canvasBoxStyle}>
            <div style={nodeCardStyle}>
              <div style={nodeHeaderStyle}>
                <span style={nodeTypeStyle}>Input Node</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Required</span>
              </div>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', marginBottom: '8px', display: 'block' }}>Course Document Selector</span>
              <select 
                value={selectedDocId} 
                onChange={(e) => setSelectedDocId(e.target.value)} 
                className="form-select"
                style={{ fontSize: '0.85rem', padding: '8px' }}
              >
                <option value="">-- No file (General Topic Mode) --</option>
                {documents.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.filename}</option>
                ))}
              </select>
            </div>

            {chain.map((block, idx) => (
              <React.Fragment key={block}>
                {/* Arrow connector */}
                <div style={connectorArrowStyle}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                </div>

                <div className="glass-card" style={{
                  ...nodeCardStyle,
                  borderColor: loading && idx === 0 ? 'var(--accent-secondary)' : 'rgba(255,255,255,0.08)',
                  boxShadow: loading && idx === 0 ? '0 0 15px rgba(168, 85, 247, 0.3)' : 'none'
                }}>
                  <div style={nodeHeaderStyle}>
                    <span style={{ ...nodeTypeStyle, color: 'var(--accent-secondary)' }}>AI Node</span>
                    <button onClick={() => removeBlockFromChain(block)} style={removeNodeButtonStyle}>&times;</button>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>{block}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {block === 'Summarize' ? 'Compiles 250-word educational outline' :
                     block === 'Quiz' ? 'Drafts questions matching text context' :
                     'Generates Q&A key term flashcards'}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>

          <div style={configRowStyle}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Workflow Name</label>
              <input 
                type="text" 
                value={workflowName} 
                onChange={(e) => setWorkflowName(e.target.value)} 
                className="form-input"
                style={{ padding: '8px 12px', fontSize: '0.9rem' }}
              />
            </div>
            <button 
              onClick={handleRun} 
              disabled={loading || chain.length === 0} 
              className="btn-primary"
              style={{ padding: '10px 24px', alignSelf: 'flex-end' }}
            >
              {loading ? 'Executing Pipeline...' : 'Run Pipeline'}
            </button>
          </div>
        </div>

        {/* RESULTS SCREEN */}
        <div className="glass-panel" style={resultsPanelStyle}>
          <h2>Execution Terminal</h2>

          {loading && (
            <div style={statusWrapperStyle}>
              <div className="pulse-circle" style={{ width: '30px', height: '30px', backgroundColor: 'var(--success)', boxShadow: '0 0 15px var(--success)' }} />
              <p style={{ fontWeight: 600 }}>Executing nodes in sequence...</p>
            </div>
          )}

          {!loading && !runResult && (
            <div style={statusWrapperStyle}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" style={{ marginBottom: '15px' }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Run workflow design to inspect output logs and documents.</p>
            </div>
          )}

          {!loading && runResult && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '15px' }}>
              <div style={terminalHeaderStyle}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status: <strong style={{ color: 'var(--success)' }}>{runResult.status.toUpperCase()}</strong></span>
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Completed</span>
              </div>

              {/* TABS SELECT */}
              <div style={tabBarStyle}>
                {Object.keys(output).map(tabKey => (
                  <button
                    key={tabKey}
                    onClick={() => setActiveResultTab(tabKey)}
                    style={{
                      ...tabButtonStyle,
                      borderBottomColor: activeResultTab === tabKey ? 'var(--accent-primary)' : 'transparent',
                      color: activeResultTab === tabKey ? '#fff' : 'var(--text-muted)'
                    }}
                  >
                    {tabKey.toUpperCase()}
                  </button>
                ))}
                <button
                  onClick={() => setActiveResultTab('logs')}
                  style={{
                    ...tabButtonStyle,
                    borderBottomColor: activeResultTab === 'logs' ? 'var(--accent-secondary)' : 'transparent',
                    color: activeResultTab === 'logs' ? '#fff' : 'var(--text-muted)'
                  }}
                >
                  SYSTEM LOGS
                </button>
              </div>

              {/* TAB CONTENT */}
              <div style={terminalConsoleStyle}>
                {activeResultTab === 'summary' && (
                  <div className="animate-slide-in" style={{ padding: '15px', color: '#f3f4f6', lineHeight: '1.6', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                    {output.summary}
                  </div>
                )}

                {activeResultTab === 'quiz' && (
                  <div className="animate-slide-in" style={resultsQuizFlex}>
                    {output.quiz?.map((q, idx) => (
                      <div key={q.id} style={quizOutputCardStyle}>
                        <strong>Q{idx + 1}: {q.question}</strong>
                        {q.options && (
                          <div style={{ paddingLeft: '12px', marginTop: '6px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {q.options.map((opt, oIdx) => <span key={oIdx}>• {opt}</span>)}
                          </div>
                        )}
                        <span style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '8px', display: 'block' }}>Correct Answer: {q.correct_answer}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeResultTab === 'flashcards' && (
                  <div className="animate-slide-in" style={flashcardsGridStyle}>
                    {output.flashcards?.map((card, idx) => (
                      <div key={idx} className="glass-card" style={flashcardItemStyle}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>FRONT</span>
                        <p style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', margin: '4px 0 8px 0' }}>{card.front}</p>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)' }}>BACK</span>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>{card.back}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeResultTab === 'logs' && (
                  <pre className="animate-slide-in" style={logsStyle}>
                    {runResult.logs}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline Styles for WorkflowBuilder
const layoutGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1.7fr 1.3fr',
  gap: '30px'
};

const canvasPanelStyle = {
  padding: '25px',
  display: 'flex',
  flexDirection: 'column'
};

const blocksBankStyle = {
  background: 'rgba(255,255,255,0.01)',
  border: '1px solid rgba(255,255,255,0.04)',
  borderRadius: '8px',
  padding: '12px 16px',
  marginBottom: '25px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const bankFlexStyle = {
  display: 'flex',
  gap: '10px'
};

const bankButtonStyle = {
  background: 'rgba(99, 102, 241, 0.1)',
  color: 'var(--accent-primary)',
  border: '1px solid rgba(99, 102, 241, 0.2)',
  padding: '6px 14px',
  borderRadius: '6px',
  fontWeight: 600,
  fontSize: '0.8rem',
  transition: 'all 0.2s ease'
};

const canvasBoxStyle = {
  background: 'rgba(0,0,0,0.15)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: '12px',
  padding: '30px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flex: 1,
  minHeight: '380px',
  overflowY: 'auto'
};

const nodeCardStyle = {
  width: '100%',
  maxWidth: '350px',
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  padding: '16px',
  transition: 'all 0.3s ease'
};

const nodeHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px'
};

const nodeTypeStyle = {
  fontSize: '0.7rem',
  color: 'var(--accent-primary)',
  fontWeight: 700,
  textTransform: 'uppercase'
};

const removeNodeButtonStyle = {
  background: 'transparent',
  border: 'none',
  color: 'var(--danger)',
  fontSize: '1.2rem',
  lineHeight: 1,
  cursor: 'pointer'
};

const connectorArrowStyle = {
  margin: '10px 0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: 'pulse-green 2s infinite'
};

const configRowStyle = {
  display: 'flex',
  gap: '20px',
  marginTop: '25px',
  alignItems: 'center',
  borderTop: '1px solid rgba(255,255,255,0.05)',
  paddingTop: '20px'
};

const labelStyle = {
  fontSize: '0.8rem',
  color: 'var(--text-muted)',
  fontWeight: 600,
  display: 'block',
  marginBottom: '6px'
};

const resultsPanelStyle = {
  padding: '25px',
  display: 'flex',
  flexDirection: 'column',
  height: '650px'
};

const statusWrapperStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  gap: '15px',
  flex: 1
};

const terminalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  paddingBottom: '10px'
};

const tabBarStyle = {
  display: 'flex',
  gap: '15px',
  borderBottom: '1px solid rgba(255,255,255,0.08)'
};

const tabButtonStyle = {
  background: 'transparent',
  border: 'none',
  borderBottom: '2px solid transparent',
  padding: '6px 8px',
  fontSize: '0.8rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  outline: 'none'
};

const terminalConsoleStyle = {
  flex: 1,
  background: 'rgba(0,0,0,0.2)',
  border: '1px solid rgba(255,255,255,0.04)',
  borderRadius: '8px',
  overflowY: 'auto',
  fontFamily: 'monospace'
};

const resultsQuizFlex = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '15px'
};

const quizOutputCardStyle = {
  padding: '12px',
  background: 'rgba(255,255,255,0.01)',
  border: '1px solid rgba(255,255,255,0.03)',
  borderRadius: '6px',
  fontSize: '0.85rem'
};

const flashcardsGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '12px',
  padding: '15px'
};

const flashcardItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  padding: '12px 16px',
  background: 'rgba(255,255,255,0.015)'
};

const logsStyle = {
  padding: '15px',
  color: '#c9d1d9',
  fontSize: '0.8rem',
  lineHeight: '1.4',
  whiteSpace: 'pre-wrap',
  margin: 0
};
