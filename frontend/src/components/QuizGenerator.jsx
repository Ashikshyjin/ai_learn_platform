import React, { useState, useEffect } from 'react';

export default function QuizGenerator({ backendUrl, headers, refreshStats }) {
  const [documents, setDocuments] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // question_id -> user choice
  const [result, setResult] = useState(null);

  useEffect(() => {
    // Fetch docs list for selecting context
    fetch(`${backendUrl}/api/documents`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setDocuments(data))
      .catch(err => console.error(err));
  }, []);

  const handleDocToggle = (docId) => {
    setSelectedDocs(prev => 
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setAnswers({});
    setQuestions([]);
    
    try {
      const res = await fetch(`${backendUrl}/api/quiz/generate`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          topic: topic || undefined,
          document_ids: selectedDocs.length > 0 ? selectedDocs : undefined,
          num_questions: numQuestions
        })
      });

      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      } else {
        alert("Failed to generate quiz. Try specifying a clearer topic.");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating quiz.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (qId, optionVal) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: optionVal
    }));
  };

  const handleSubmit = async () => {
    // Validate that all questions are answered
    if (Object.keys(answers).length < questions.length) {
      if (!window.confirm("You have not answered all questions. Submit anyway?")) return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/quiz/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          quiz_title: topic || "Practice Quiz",
          answers: answers,
          questions: questions
        })
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        refreshStats();
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting quiz results.");
    }
  };

  return (
    <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1>Quiz Generator Agent</h1>
        <p className="subtitle">Construct tests dynamically from documents or topics to reinforce your knowledge.</p>
      </div>

      <div style={layoutGridStyle}>
        {/* CONFIG PANEL */}
        <div className="glass-panel" style={configPanelStyle}>
          <h2 style={{ marginBottom: '15px' }}>Quiz Settings</h2>
          
          <div style={formGroupStyle}>
            <label style={labelStyle}>Specify Topic (optional)</label>
            <input 
              type="text" 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)} 
              placeholder="e.g. Backpropagation, CNN, PostgreSQL" 
              className="form-input"
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Questions Count</label>
            <select 
              value={numQuestions} 
              onChange={(e) => setNumQuestions(Number(e.target.value))} 
              className="form-select"
            >
              <option value="3">3 Questions</option>
              <option value="5">5 Questions</option>
              <option value="10">10 Questions</option>
            </select>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Restrict to Course Materials (optional)</label>
            <div style={docChecklistStyle}>
              {documents.length === 0 ? (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No uploaded materials available. Topic mode will be used.</span>
              ) : (
                documents.map(doc => (
                  <label key={doc.id} style={docLabelStyle}>
                    <input 
                      type="checkbox" 
                      checked={selectedDocs.includes(doc.id)} 
                      onChange={() => handleDocToggle(doc.id)}
                      style={{ marginRight: '8px' }}
                    />
                    {doc.filename}
                  </label>
                ))
              )}
            </div>
          </div>

          <button 
            onClick={handleGenerate} 
            disabled={loading} 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? 'Synthesizing Test...' : 'Generate Practice Quiz'}
          </button>
        </div>

        {/* QUIZ PLAYGROUND */}
        <div className="glass-panel" style={quizPlaygroundStyle}>
          {loading && (
            <div style={statusWrapperStyle}>
              <div className="pulse-circle" style={{ width: '30px', height: '30px', backgroundColor: 'var(--accent-secondary)', boxShadow: '0 0 15px var(--accent-secondary)' }} />
              <p style={{ fontWeight: 600 }}>The Quiz Agent is reviewing materials and compiling scenarios...</p>
            </div>
          )}

          {!loading && questions.length === 0 && (
            <div style={statusWrapperStyle}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" style={{ marginBottom: '15px' }}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Configure settings on the left to start your practice session.</p>
            </div>
          )}

          {!loading && questions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%' }}>
              {/* SCORE BANNER */}
              {result && (
                <div className="glass-card animate-slide-in" style={{
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  border: '1px solid var(--success)', 
                  background: 'rgba(16, 185, 129, 0.05)',
                  padding: '20px'
                }}>
                  <div>
                    <h3 style={{ color: 'var(--success)' }}>Quiz Complete!</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Weak Topics Found: {result.weak_topics.join(', ') || 'None! Excellent work!'}</p>
                  </div>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>{result.score} / {result.total_questions}</span>
                </div>
              )}

              {/* QUESTIONS LIST */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                {questions.map((q, idx) => {
                  const qIdStr = String(q.id);
                  const userAns = answers[qIdStr];
                  const feedbackQ = result?.detailed_feedback.find(f => String(f.id) === qIdStr);

                  return (
                    <div key={q.id} className="glass-card" style={questionCardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>Question {idx + 1} ({q.type.toUpperCase()})</span>
                        {feedbackQ && (
                          <span className={feedbackQ.is_correct ? "badge badge-success" : "badge badge-danger"}>
                            {feedbackQ.is_correct ? 'Correct' : 'Incorrect'}
                          </span>
                        )}
                      </div>
                      
                      <p style={{ fontWeight: 600, fontSize: '1rem', color: '#fff', marginBottom: '15px' }}>{q.question}</p>

                      {/* Options rendering */}
                      {q.type === 'fill_blank' ? (
                        <div style={{ width: '100%' }}>
                          <input 
                            type="text" 
                            value={userAns || ''} 
                            disabled={!!result}
                            onChange={(e) => handleOptionSelect(qIdStr, e.target.value)}
                            placeholder="Type your answer here..."
                            className="form-input"
                          />
                        </div>
                      ) : (
                        <div style={optionsGridStyle}>
                          {q.options?.map((opt, oIdx) => {
                            const isSelected = userAns === opt;
                            let cardColor = 'rgba(255,255,255,0.02)';
                            let borderColor = 'rgba(255,255,255,0.06)';

                            if (isSelected) {
                              borderColor = 'var(--accent-primary)';
                              cardColor = 'rgba(99, 102, 241, 0.1)';
                            }

                            if (result) {
                              const isCorrectOption = opt === q.correct_answer;
                              const isUserWrongChoice = isSelected && !isCorrectOption;

                              if (isCorrectOption) {
                                borderColor = 'var(--success)';
                                cardColor = 'rgba(16, 185, 129, 0.15)';
                              } else if (isUserWrongChoice) {
                                borderColor = 'var(--danger)';
                                cardColor = 'rgba(239, 68, 68, 0.15)';
                              }
                            }

                            return (
                              <button
                                key={oIdx}
                                disabled={!!result}
                                onClick={() => handleOptionSelect(qIdStr, opt)}
                                style={{
                                  ...optionButtonStyle,
                                  background: cardColor,
                                  borderColor: borderColor
                                }}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Explanation box */}
                      {result && feedbackQ && (
                        <div className="animate-slide-in" style={explanationBoxStyle}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--success)', display: 'block', marginBottom: '4px' }}>AI Explanation:</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{feedbackQ.explanation}</span>
                          <span style={{ fontSize: '0.85rem', color: '#fff', display: 'block', marginTop: '6px' }}>Correct Answer: <strong>{q.correct_answer}</strong></span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!result && (
                <button 
                  onClick={handleSubmit} 
                  className="btn-primary" 
                  style={{ alignSelf: 'flex-end' }}
                >
                  Submit Quiz Answers
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline Styles for QuizGenerator
const layoutGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1.25fr 2.75fr',
  gap: '30px'
};

const configPanelStyle = {
  padding: '25px',
  height: 'fit-content'
};

const formGroupStyle = {
  marginBottom: '20px'
};

const labelStyle = {
  fontSize: '0.85rem',
  color: 'var(--text-muted)',
  fontWeight: 600,
  display: 'block',
  marginBottom: '8px'
};

const docChecklistStyle = {
  maxHeight: '180px',
  overflowY: 'auto',
  background: 'rgba(0,0,0,0.15)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '8px',
  padding: '10px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const docLabelStyle = {
  fontSize: '0.85rem',
  color: 'var(--text-main)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: 'flex',
  alignItems: 'center'
};

const quizPlaygroundStyle = {
  padding: '30px',
  minHeight: '400px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const statusWrapperStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: '15px',
  padding: '40px'
};

const questionCardStyle = {
  display: 'flex',
  flexDirection: 'column',
  background: 'rgba(255,255,255,0.015)'
};

const optionsGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '10px',
  width: '100%'
};

const optionButtonStyle = {
  border: '1px solid',
  padding: '12px 16px',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '0.9rem',
  fontWeight: 500,
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  outline: 'none'
};

const explanationBoxStyle = {
  marginTop: '15px',
  padding: '12px',
  borderRadius: '6px',
  background: 'rgba(255,255,255,0.02)',
  borderLeft: '4px solid var(--success)'
};
