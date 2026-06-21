import React from 'react';

export default function Sidebar({ activeTab, setActiveTab, apiKeyConfigured, setShowSettings }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
    )},
    { id: 'tutor', label: 'Tutor Chat', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    )},
    { id: 'planner', label: 'Study Planner', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    )},
    { id: 'quiz', label: 'Quiz Maker', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
    )},
    { id: 'interview', label: 'Interview Prep', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    )},
    { id: 'skillgap', label: 'Skill Analyzer', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
    )},
    { id: 'workflows', label: 'Workflow Builder', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
    )}
  ];

  return (
    <div className="sidebar" style={sidebarStyle}>
      <div className="logo-container" style={logoContainerStyle}>
        <div className="logo-icon" style={logoIconStyle}>GA</div>
        <div className="logo-text">
          <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>Learning Copilot</h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>THE GEN ACADEMY</span>
        </div>
      </div>

      <nav style={navStyle}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              ...navButtonStyle,
              ...(activeTab === item.id ? activeButtonStyle : {})
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div style={footerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: apiKeyConfigured ? 'var(--success)' : '#4b5563',
            boxShadow: apiKeyConfigured ? '0 0 8px var(--success)' : 'none'
          }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {apiKeyConfigured ? 'Gemini API Connected' : 'API Key Missing'}
          </span>
        </div>
        <button 
          onClick={() => setShowSettings(true)} 
          style={settingsButtonStyle}
          title="Configure API Keys"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      </div>
    </div>
  );
}

// Inline Styles for structural layout of Sidebar
const sidebarStyle = {
  width: 'var(--sidebar-width)',
  position: 'fixed',
  top: 0,
  left: 0,
  bottom: 0,
  background: 'rgba(10, 8, 28, 0.75)',
  backdropFilter: 'blur(20px)',
  borderRight: '1px solid var(--glass-border)',
  display: 'flex',
  flexDirection: 'column',
  padding: '30px 20px',
  zIndex: 100
};

const logoContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '40px'
};

const logoIconStyle = {
  width: '38px',
  height: '38px',
  borderRadius: '10px',
  background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '800',
  fontSize: '1rem',
  color: '#fff',
  boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
};

const navStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  flex: 1
};

const navButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  borderRadius: '10px',
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  fontSize: '0.95rem',
  fontWeight: '500',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  outline: 'none'
};

const activeButtonStyle = {
  background: 'rgba(99, 102, 241, 0.15)',
  color: '#fff',
  borderLeft: '3px solid var(--accent-primary)',
  paddingLeft: '13px'
};

const footerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'between',
  gap: '10px',
  paddingTop: '20px',
  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  justifyContent: 'space-between'
};

const settingsButtonStyle = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: '5px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 0.2s ease'
};
