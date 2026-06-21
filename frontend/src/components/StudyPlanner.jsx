import React, { useState, useEffect } from 'react';

export default function StudyPlanner({ backendUrl, headers, refreshStats }) {
  const [subject, setSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [level, setLevel] = useState('beginner');
  const [hours, setHours] = useState(2.0);
  const [loading, setLoading] = useState(false);

  const [activePlan, setActivePlan] = useState(null);
  const [checkedTasks, setCheckedTasks] = useState({}); // task_key -> boolean

  useEffect(() => {
    // Fetch last study plan if available
    fetch(`${backendUrl}/api/study-plans`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (data.length > 0) {
          setActivePlan(data[0]);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleGenerate = async () => {
    if (!subject.trim() || !examDate.trim()) {
      alert("Please provide both a Subject and an Exam Date.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/study-plan/generate`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          subject: subject,
          exam_date: examDate,
          current_level: level,
          available_hours_per_day: hours
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActivePlan(data);
        setCheckedTasks({});
        refreshStats();
      } else {
        alert("Failed to compile study plan.");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating study plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = (dayIndex, taskIndex) => {
    const key = `${dayIndex}_${taskIndex}`;
    setCheckedTasks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const planData = activePlan?.plan_data || {};
  const schedule = planData.daily_schedule || [];
  const weeklyGoals = planData.weekly_goals || [];

  return (
    <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1>Study Planner Agent</h1>
        <p className="subtitle">Compile optimized roadmaps and schedules leading up to your exam dates.</p>
      </div>

      <div style={layoutGridStyle}>
        {/* INPUT CONFIG */}
        <div className="glass-panel" style={formPanelStyle}>
          <h2 style={{ marginBottom: '15px' }}>Planner parameters</h2>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Subject of Study</label>
            <input 
              type="text" 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
              placeholder="e.g. Deep Learning, Data Structures" 
              className="form-input"
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Completion/Exam Date</label>
            <input 
              type="text" 
              value={examDate} 
              onChange={(e) => setExamDate(e.target.value)} 
              placeholder="e.g. 2026-07-15 or '3 weeks'" 
              className="form-input"
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Current Level</label>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="form-select">
              <option value="beginner">Beginner (No background)</option>
              <option value="intermediate">Intermediate (Basic principles)</option>
              <option value="advanced">Advanced (Hands-on practitioner)</option>
            </select>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Available hours per day</label>
            <input 
              type="number" 
              step="0.5" 
              value={hours} 
              onChange={(e) => setHours(Number(e.target.value))} 
              className="form-input"
            />
          </div>

          <button 
            onClick={handleGenerate} 
            disabled={loading} 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? 'Synthesizing Plan...' : 'Generate Study Roadmap'}
          </button>
        </div>

        {/* STUDY PLAN ROADMAP */}
        <div className="glass-panel" style={planContentPanelStyle}>
          {loading && (
            <div style={statusWrapperStyle}>
              <div className="pulse-circle" style={{ width: '30px', height: '30px', backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 15px var(--accent-primary)' }} />
              <p style={{ fontWeight: 600 }}>The Study Planner Agent is designing topics, pacing, and milestones...</p>
            </div>
          )}

          {!loading && !activePlan && (
            <div style={statusWrapperStyle}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" style={{ marginBottom: '15px' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Configure parameters on the left to output your learning calendar.</p>
            </div>
          )}

          {!loading && activePlan && (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '25px' }}>
              {/* PLAN HEADINGS */}
              <div style={planHeaderStyle}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', color: '#fff' }}>Roadmap: {activePlan.subject}</h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Level: {activePlan.current_level} • Target: {activePlan.target_date} • {activePlan.daily_hours} hrs/day
                  </span>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>Active</span>
              </div>

              <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-primary)', padding: '15px' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.5' }}>{planData.overview}</p>
              </div>

              {/* WEEKLY GOALS */}
              {weeklyGoals.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '10px' }}>Milestone Milestones</h3>
                  <div style={weeklyGridStyle}>
                    {weeklyGoals.map((g, idx) => (
                      <div key={idx} className="glass-card" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent-secondary)', fontSize: '0.85rem' }}>Week {g.week}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>{g.goal}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{g.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DAILY CHECKLIST */}
              <div>
                <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '10px' }}>Daily Pacing & Tasks</h3>
                <div style={dailyContainerStyle}>
                  {schedule.map((dayPlan, dayIdx) => (
                    <div key={dayIdx} className="glass-card" style={dayCardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px', marginBottom: '12px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{dayPlan.day}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{dayPlan.topic} • {dayPlan.duration}</span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {dayPlan.tasks?.map((task, taskIdx) => {
                          const taskKey = `${dayIdx}_${taskIdx}`;
                          const isChecked = !!checkedTasks[taskKey];
                          
                          return (
                            <label 
                              key={taskIdx} 
                              style={{
                                ...taskLabelStyle,
                                textDecoration: isChecked ? 'line-through' : 'none',
                                color: isChecked ? 'var(--text-muted)' : 'var(--text-main)'
                              }}
                            >
                              <input 
                                type="checkbox" 
                                checked={isChecked} 
                                onChange={() => handleTaskToggle(dayIdx, taskIdx)}
                                style={checkboxStyle}
                              />
                              {task}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline Styles for StudyPlanner
const layoutGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1.25fr 2.75fr',
  gap: '30px'
};

const formPanelStyle = {
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

const planContentPanelStyle = {
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

const planHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid var(--glass-border)',
  paddingBottom: '15px'
};

const weeklyGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '15px'
};

const dailyContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px'
};

const dayCardStyle = {
  background: 'rgba(255,255,255,0.015)',
  display: 'flex',
  flexDirection: 'column'
};

const taskLabelStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  fontSize: '0.9rem',
  cursor: 'pointer',
  padding: '4px 0'
};

const checkboxStyle = {
  marginTop: '3px',
  cursor: 'pointer'
};
