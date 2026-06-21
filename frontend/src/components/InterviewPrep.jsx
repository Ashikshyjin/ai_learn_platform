import React, { useState, useEffect, useRef } from 'react';

export default function InterviewPrep({ backendUrl, headers }) {
  const [role, setRole] = useState('AI Engineer');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null); // { id, role, current_question, is_finished, feedback, transcript }
  const [answer, setAnswer] = useState('');
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => setIsListening(true);
      rec.onresult = (e) => {
        const transcript = Array.from(e.results)
          .map(result => result[0].transcript)
          .join('');
        setAnswer(prev => prev + (prev ? ' ' : '') + transcript);
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;
    }
  }, []);

  const handleStart = async () => {
    if (!role.trim()) return;
    setLoading(true);
    setSession(null);
    setAnswer('');
    
    try {
      const res = await fetch(`${backendUrl}/api/interview/start`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: role })
      });

      if (res.ok) {
        const data = await res.json();
        setSession(data);
      } else {
        alert("Failed to start mock interview.");
      }
    } catch (err) {
      console.error(err);
      alert("Error starting interview session.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!answer.trim()) {
      alert("Please provide an answer before continuing.");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setLoading(true);
    const ansText = answer;
    setAnswer('');

    try {
      const res = await fetch(`${backendUrl}/api/interview/answer`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          session_id: session.id,
          answer: ansText
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSession(data);
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting answer.");
    } finally {
      setLoading(false);
    }
  };

  const toggleVoiceCapture = () => {
    if (!recognitionRef.current) {
      alert("Browser speech recognition is not supported in this browser. Try Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const currentIdx = session?.transcript.length ? Math.floor(session.transcript.length / 2) : 0;
  const totalQuestions = 4; // Set in backend coordinator start

  return (
    <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1>Interview Preparation Agent</h1>
        <p className="subtitle">Simulate real technical recruiter phone screens and receive detailed constructive feedback reports.</p>
      </div>

      {!session && (
        <div className="glass-panel" style={startWrapperStyle}>
          <div style={{ maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h2>Configure Mock Session</h2>
            
            <div style={formGroupStyle}>
              <label style={labelStyle}>Target Job Role</label>
              <input 
                type="text" 
                value={role} 
                onChange={(e) => setRole(e.target.value)} 
                placeholder="e.g. AI Engineer, React Developer, Data Scientist" 
                className="form-input"
              />
            </div>

            <button 
              onClick={handleStart} 
              disabled={loading} 
              className="btn-primary" 
              style={{ justifyContent: 'center' }}
            >
              {loading ? 'Assembling Recruiter Board...' : 'Begin Mock Interview'}
            </button>
          </div>
        </div>
      )}

      {session && (
        <div style={sessionLayoutGrid}>
          {/* LEFT: THE INTERACTIVE SCREEN */}
          <div className="glass-panel" style={workspacePanelStyle}>
            {/* Progress indicators */}
            <div style={progressHeaderStyle}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Role: <strong>{session.role}</strong></span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {session.is_finished ? 'Interview Complete' : `Question ${currentIdx + 1} of ${totalQuestions}`}
              </span>
            </div>

            {!session.is_finished ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                {/* QUESTION CARD */}
                <div className="glass-card" style={questionCardStyle}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Interviewer Question:</span>
                  <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', lineHeight: '1.5' }}>
                    {session.current_question}
                  </p>
                </div>

                {/* ANSWER CARD */}
                <div style={answerInputAreaStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={labelStyle}>Draft Candidate Answer</label>
                    <button 
                      onClick={toggleVoiceCapture} 
                      style={{
                        ...voiceCapButtonStyle,
                        backgroundColor: isListening ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.02)',
                        color: isListening ? 'var(--danger)' : 'var(--text-muted)',
                        borderColor: isListening ? 'var(--danger)' : 'rgba(255,255,255,0.08)'
                      }}
                      title={isListening ? "Listening... click to pause" : "Dictate answer"}
                    >
                      {isListening ? (
                        <div className="pulse-circle-listening" style={{ width: '8px', height: '8px', marginRight: '6px' }} />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
                      )}
                      {isListening ? "Listening..." : "Voice Answer"}
                    </button>
                  </div>

                  <textarea 
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={6}
                    placeholder="Type or dictate your response in detail. Speak as if talking to a recruiter..."
                    className="form-textarea"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                  <button onClick={() => setSession(null)} className="btn-secondary">Exit session</button>
                  <button onClick={handleAnswerSubmit} disabled={loading} className="btn-primary">
                    {loading ? 'Recording...' : currentIdx + 1 === totalQuestions ? 'Submit and Finish' : 'Next Question'}
                  </button>
                </div>
              </div>
            ) : (
              /* REPORT VIEW */
              <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
                  <h2>Review Report</h2>
                  <button onClick={() => setSession(null)} className="btn-primary">Start New Mock Session</button>
                </div>
                <div className="glass-card" style={feedbackReportStyle}>
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.95rem' }}>{session.feedback}</p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: TRANSCRIPT LOG */}
          <div className="glass-panel" style={transcriptPanelStyle}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Live Log</h2>
            <div style={transcriptLogsStyle}>
              {session.transcript.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Awaiting candidate first reply...
                </div>
              ) : (
                session.transcript.map((turn, i) => (
                  <div key={i} style={transcriptTurnStyle}>
                    <span style={{ 
                      fontWeight: 700, 
                      fontSize: '0.8rem', 
                      color: turn.speaker === 'Interviewer' ? 'var(--accent-secondary)' : 'var(--accent-primary)',
                      textTransform: 'uppercase'
                    }}>
                      {turn.speaker}
                    </span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '3px' }}>{turn.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Styles for InterviewPrep
const startWrapperStyle = {
  padding: '60px 40px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
};

const formGroupStyle = {
  marginBottom: '20px'
};

const labelStyle = {
  fontSize: '0.85rem',
  color: 'var(--text-muted)',
  fontWeight: 600,
  display: 'block'
};

const sessionLayoutGrid = {
  display: 'grid',
  gridTemplateColumns: '2.5fr 1.5fr',
  gap: '30px'
};

const workspacePanelStyle = {
  padding: '30px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
};

const progressHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  paddingBottom: '10px'
};

const questionCardStyle = {
  background: 'rgba(99, 102, 241, 0.05)',
  borderLeft: '4px solid var(--accent-secondary)',
  padding: '20px'
};

const answerInputAreaStyle = {
  display: 'flex',
  flexDirection: 'column'
};

const voiceCapButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '4px 10px',
  borderRadius: '20px',
  border: '1px solid',
  fontSize: '0.75rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease'
};

const feedbackReportStyle = {
  background: 'rgba(255,255,255,0.01)',
  border: '1px solid rgba(255,255,255,0.05)',
  maxHeight: '500px',
  overflowY: 'auto',
  padding: '25px'
};

const transcriptPanelStyle = {
  padding: '20px',
  maxHeight: '650px',
  display: 'flex',
  flexDirection: 'column'
};

const transcriptLogsStyle = {
  flex: 1,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '15px'
};

const transcriptTurnStyle = {
  padding: '10px 12px',
  background: 'rgba(255,255,255,0.01)',
  borderRadius: '6px',
  border: '1px solid rgba(255,255,255,0.03)'
};
