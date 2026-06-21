import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ProgressDashboard from './components/ProgressDashboard';
import ChatBot from './components/ChatBot';
import StudyPlanner from './components/StudyPlanner';
import QuizGenerator from './components/QuizGenerator';
import InterviewPrep from './components/InterviewPrep';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import WorkflowBuilder from './components/WorkflowBuilder';

const BACKEND_URL = "http://localhost:8000";

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState({
    total_documents: 0,
    total_quizzes_taken: 0,
    average_quiz_score: 0,
    weak_topics: [],
    recent_plans: [],
    recent_docs: []
  });

  // Load API Key from local storage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
    fetchStats(savedKey);
  }, []);

  const fetchStats = async (key = apiKey) => {
    try {
      const headers = {};
      if (key) {
        headers["x-gemini-api-key"] = key;
      }
      const res = await fetch(`${BACKEND_URL}/api/dashboard`, { headers });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
    }
  };

  const handleSaveSettings = (key) => {
    setApiKey(key);
    if (key.trim()) {
      localStorage.setItem('gemini_api_key', key);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
    setShowSettings(false);
    fetchStats(key);
  };

  const requestHeaders = apiKey ? { "x-gemini-api-key": apiKey } : {};

  return (
    <div className="app-container">
      {/* SIDE NAVIGATION */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        apiKeyConfigured={!!apiKey}
        setShowSettings={setShowSettings}
      />

      {/* WORKSPACE AREA */}
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <ProgressDashboard 
            stats={stats} 
            refreshStats={() => fetchStats()} 
            backendUrl={BACKEND_URL}
            headers={requestHeaders}
          />
        )}
        {activeTab === 'tutor' && (
          <ChatBot 
            backendUrl={BACKEND_URL} 
            headers={requestHeaders}
          />
        )}
        {activeTab === 'planner' && (
          <StudyPlanner 
            backendUrl={BACKEND_URL} 
            headers={requestHeaders}
            refreshStats={() => fetchStats()}
          />
        )}
        {activeTab === 'quiz' && (
          <QuizGenerator 
            backendUrl={BACKEND_URL} 
            headers={requestHeaders}
            refreshStats={() => fetchStats()}
          />
        )}
        {activeTab === 'interview' && (
          <InterviewPrep 
            backendUrl={BACKEND_URL} 
            headers={requestHeaders}
          />
        )}
        {activeTab === 'skillgap' && (
          <ResumeAnalyzer 
            backendUrl={BACKEND_URL} 
            headers={requestHeaders}
          />
        )}
        {activeTab === 'workflows' && (
          <WorkflowBuilder 
            backendUrl={BACKEND_URL} 
            headers={requestHeaders}
          />
        )}
      </main>

      {/* SETTINGS DRAWER / OVERLAY */}
      {showSettings && (
        <SettingsDrawer 
          initialKey={apiKey} 
          onSave={handleSaveSettings} 
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

// Sub-component SettingsDrawer inside App.jsx for ease of state routing
function SettingsDrawer({ initialKey, onSave, onClose }) {
  const [key, setKey] = useState(initialKey);

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div className="glass-panel" style={drawerStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Settings</h2>
          <button onClick={onClose} style={closeButtonStyle}>&times;</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            To ground the tutor in your course PDFs, generate study planners, or conduct mock interviews, configure your Gemini API Key below.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Gemini API Key</label>
            <input 
              type="password" 
              value={key} 
              onChange={(e) => setKey(e.target.value)} 
              placeholder="AIzaSy..." 
              className="form-input"
            />
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Your key is saved locally in your browser's local storage and is sent directly to your local FastAPI backend instance.
          </p>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button onClick={() => onSave(key)} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Configuration</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
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

const drawerStyle = {
  width: '90%',
  maxWidth: '450px',
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
