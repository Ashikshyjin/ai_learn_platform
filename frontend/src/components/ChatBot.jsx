import React, { useState, useEffect, useRef } from 'react';

export default function ChatBot({ backendUrl, headers }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am your AI Learning Copilot. Ask me to explain any concept, generate a quiz, or build a study roadmap. If you've uploaded materials, I'll retrieve matches and cite my sources!",
      agent: 'coordinator'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedCitations, setSelectedCitations] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Setup Web Speech API for recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      rec.onerror = (e) => {
        console.error("Speech recognition error", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const handleSend = async (textToSend = input) => {
    if (!textToSend.trim()) return;

    // 1. Add user message
    setMessages((prev) => [...prev, { sender: 'user', text: textToSend }]);
    setInput('');
    setLoading(true);

    // Cancel any ongoing speaking
    if (synthRef.current) {
      synthRef.current.cancel();
    }

    try {
      const res = await fetch(`${backendUrl}/api/chat`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: textToSend })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, {
          sender: 'ai',
          text: data.response,
          citations: data.citations,
          agent: data.agent_routed
        }]);

        // Speak response if voice is toggled
        if (voiceEnabled && synthRef.current) {
          // Clean markdown before speaking to make it sound natural
          const cleanText = data.response
            .replace(/[#*`_~]/g, '')
            .replace(/\[.*?\]/g, '')
            .substring(0, 300); // limit speech length for comfort
          
          const utterance = new SpeechSynthesisUtterance(cleanText);
          synthRef.current.speak(utterance);
        }
      } else {
        setMessages((prev) => [...prev, {
          sender: 'ai',
          text: "Sorry, I had trouble processing that query. Please make sure the backend is active.",
          agent: 'coordinator'
        }]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, {
        sender: 'ai',
        text: "Network error. Failed to reach the copilot agent.",
        agent: 'coordinator'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const toggleListen = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Try Chrome or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const toggleVoiceOutput = () => {
    setVoiceEnabled(!voiceEnabled);
    if (voiceEnabled && synthRef.current) {
      synthRef.current.cancel();
    }
  };

  return (
    <div className="glass-panel animate-slide-in" style={wrapperStyle}>
      {/* HEADER */}
      <div style={chatHeaderStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="pulse-circle" style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 10px var(--accent-primary)' }} />
          <div>
            <h2 style={{ fontSize: '1.1rem' }}>Multi-Agent Tutor</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Routed dynamically by LangGraph Coordinator</span>
          </div>
        </div>

        {/* VOICE SETTINGS */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={toggleVoiceOutput} 
            style={{
              ...toggleVoiceButtonStyle,
              borderColor: voiceEnabled ? 'var(--success)' : 'rgba(255,255,255,0.08)',
              color: voiceEnabled ? 'var(--success)' : 'var(--text-muted)'
            }}
            title={voiceEnabled ? "Voice response ON" : "Voice response OFF"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            {voiceEnabled ? "Voice Output ON" : "Muted"}
          </button>
        </div>
      </div>

      {/* MESSAGES LIST */}
      <div style={messageListStyle}>
        {messages.map((msg, index) => (
          <div 
            key={index} 
            style={{
              ...messageRowStyle,
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            {msg.sender === 'ai' && (
              <div style={aiAvatarStyle}>
                {msg.agent === 'quiz' ? '📝' : msg.agent === 'planner' ? '📅' : '🤖'}
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '75%', gap: '5px' }}>
              <div 
                style={{
                  ...messageBubbleStyle,
                  background: msg.sender === 'user' ? 'linear-gradient(135deg, var(--accent-primary) 0%, #4f46e5 100%)' : 'rgba(255,255,255,0.03)',
                  border: msg.sender === 'user' ? 'none' : '1px solid rgba(255,255,255,0.05)',
                  borderTopLeftRadius: msg.sender === 'ai' ? '0' : '12px',
                  borderTopRightRadius: msg.sender === 'user' ? '0' : '12px',
                }}
              >
                {/* Text render */}
                <p style={textStyle}>{msg.text}</p>

                {/* Citations badges */}
                {msg.citations && msg.citations.length > 0 && (
                  <div style={citationsContainerStyle}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Citations:</span>
                    {msg.citations.map((cit, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => setSelectedCitations(cit)} 
                        style={citationBadgeStyle}
                        title="Click to view reference passage"
                      >
                        {cit.filename}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Agent Routed Label */}
              {msg.sender === 'ai' && (
                <span style={agentLabelStyle}>
                  Agent: <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>{msg.agent}</span>
                </span>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={messageRowStyle}>
            <div style={aiAvatarStyle}>🤖</div>
            <div style={{ ...messageBubbleStyle, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={typingIndicatorStyle}>
                <div style={dotStyle} />
                <div style={{ ...dotStyle, animationDelay: '0.2s' }} />
                <div style={{ ...dotStyle, animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT BAR */}
      <div style={inputContainerStyle}>
        <button 
          onClick={toggleListen} 
          style={{
            ...voiceInputButtonStyle,
            backgroundColor: isListening ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.02)',
            color: isListening ? 'var(--danger)' : 'var(--text-muted)',
            borderColor: isListening ? 'var(--danger)' : 'rgba(255,255,255,0.08)'
          }}
          title={isListening ? "Listening..." : "Click to speak"}
        >
          {isListening ? (
            <div className="pulse-circle-listening" style={{ width: '12px', height: '12px' }} />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          )}
        </button>

        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          onKeyDown={handleKeyPress}
          placeholder={isListening ? "Speak now..." : "Ask your Tutor (e.g. Explain Neural Networks, or Create a study plan)..."} 
          style={chatInputStyle}
        />

        <button onClick={() => handleSend()} style={sendButtonStyle}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>

      {/* CITATION SNIPPET MODAL */}
      {selectedCitations && (
        <div style={modalOverlayStyle} onClick={() => setSelectedCitations(null)}>
          <div className="glass-panel" style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Reference passage</h3>
              <button onClick={() => setSelectedCitations(null)} style={closeButtonStyle}>&times;</button>
            </div>
            <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent-primary)', marginBottom: '10px' }}>File: {selectedCitations.filename}</p>
            <div style={snippetContainerStyle}>
              "{selectedCitations.snippet}"
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Styles for ChatBot
const wrapperStyle = {
  height: '75vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
};

const chatHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 20px',
  borderBottom: '1px solid var(--glass-border)',
  background: 'rgba(255,255,255,0.01)'
};

const toggleVoiceButtonStyle = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.08)',
  padding: '6px 12px',
  borderRadius: '20px',
  fontSize: '0.8rem',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  transition: 'all 0.2s ease'
};

const messageListStyle = {
  flex: 1,
  padding: '20px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '15px'
};

const messageRowStyle = {
  display: 'flex',
  gap: '12px',
  width: '100%',
  alignItems: 'flex-start'
};

const aiAvatarStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.1rem',
  flexShrink: 0
};

const messageBubbleStyle = {
  padding: '12px 16px',
  borderRadius: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const textStyle = {
  fontSize: '0.95rem',
  lineHeight: '1.5',
  color: '#f3f4f6',
  whiteSpace: 'pre-wrap'
};

const citationsContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
  marginTop: '5px',
  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  paddingTop: '8px'
};

const citationBadgeStyle = {
  background: 'rgba(99, 102, 241, 0.1)',
  color: '#818cf8',
  border: '1px solid rgba(99, 102, 241, 0.2)',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '0.75rem',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  outline: 'none',
  maxWidth: '120px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
};

const agentLabelStyle = {
  fontSize: '0.7rem',
  color: 'var(--text-muted)',
  marginLeft: '4px'
};

const inputContainerStyle = {
  padding: '15px 20px',
  borderTop: '1px solid var(--glass-border)',
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  background: 'rgba(255,255,255,0.01)'
};

const chatInputStyle = {
  flex: 1,
  background: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  padding: '12px 18px',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'all 0.2s ease'
};

const voiceInputButtonStyle = {
  width: '42px',
  height: '42px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.08)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease'
};

const sendButtonStyle = {
  background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
  color: '#fff',
  border: 'none',
  width: '42px',
  height: '42px',
  borderRadius: '8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)',
  transition: 'transform 0.2s ease'
};

const typingIndicatorStyle = {
  display: 'flex',
  gap: '4px',
  padding: '6px'
};

const dotStyle = {
  width: '6px',
  height: '6px',
  background: 'var(--text-muted)',
  borderRadius: '50%',
  animation: 'pulse 1.2s infinite ease-in-out'
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
  maxWidth: '450px',
  padding: '25px',
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

const snippetContainerStyle = {
  padding: '15px',
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: '6px',
  color: 'var(--text-main)',
  fontStyle: 'italic',
  fontSize: '0.9rem',
  lineHeight: '1.5'
};
