import React, { useState } from 'react';
import { FileText, Download, ArrowLeft, Home, Edit3, Save, X } from 'lucide-react';
import type { WorkspaceAnswers } from '../utils/excelHandler';
import { exportToPdf } from '../utils/pdfGenerator';

interface WorkspaceData {
  companyName: string;
  appName: string;
  appDescription: string;
  workspaceName: string;
  created_at: string;
}

interface ReportSummaryProps {
  workspaceId: string;
  workspaceData: WorkspaceData;
  answers: WorkspaceAnswers;
  onUpdateWorkspaceData: (data: WorkspaceData) => void;
  onBack: () => void;
  onHome: () => void;
  checklistJson: any;
  moonshotResults: any | null;
}

export const ReportSummary: React.FC<ReportSummaryProps> = ({
  workspaceId,
  workspaceData,
  answers,
  onUpdateWorkspaceData,
  onBack,
  onHome,
  checklistJson,
  moonshotResults
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editCompany, setEditCompany] = useState(workspaceData.companyName);
  const [editApp, setEditApp] = useState(workspaceData.appName);
  const [editDesc, setEditDesc] = useState(workspaceData.appDescription);

  // Calculate statistics
  let totalQuestions = 0;
  let totalAnswered = 0;
  let yesCount = 0;
  let noCount = 0;
  let naCount = 0;

  const principleStats: Array<{
    key: string;
    name: string;
    total: number;
    answered: number;
  }> = [];

  Object.keys(checklistJson).forEach(principleKey => {
    const pData = checklistJson[principleKey];
    const checks = pData.process_checks;
    const pTotal = Object.keys(checks).length;
    let pAnswered = 0;
    
    Object.keys(checks).forEach(processId => {
      totalQuestions++;
      // Search in answers
      let ans = null;
      for (const oId of Object.keys(answers)) {
        if (answers[oId] && answers[oId][processId]) {
          ans = answers[oId][processId];
          break;
        }
      }
      
      if (ans && ans.implementation !== null) {
        totalAnswered++;
        pAnswered++;
        if (ans.implementation === "Yes") yesCount++;
        else if (ans.implementation === "No") noCount++;
        else if (ans.implementation === "N/A") naCount++;
      }
    });

    const cleanName = principleKey.replace(/^\d+\.\s*/, '');
    principleStats.push({
      key: principleKey,
      name: cleanName,
      total: pTotal,
      answered: pAnswered
    });
  });

  const completionPercent = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCompany.trim() || !editApp.trim() || !editDesc.trim()) {
      alert("Please fill in all details.");
      return;
    }
    
    onUpdateWorkspaceData({
      ...workspaceData,
      companyName: editCompany.trim(),
      appName: editApp.trim(),
      appDescription: editDesc.trim()
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditCompany(workspaceData.companyName);
    setEditApp(workspaceData.appName);
    setEditDesc(workspaceData.appDescription);
    setIsEditing(false);
  };

  const handleDownloadPdf = () => {
    try {
      exportToPdf(workspaceData, answers, checklistJson, moonshotResults);
    } catch (err) {
      console.error("PDF Export failed", err);
      alert("Failed to export PDF. Please check console logs.");
    }
  };

  return (
    <div className="checklist-pane" style={{ animation: 'fadeIn 0.3s ease' }}>
      
      {/* Overview stats grid */}
      <div className="glass-panel" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2>Assessment Summary Report</h2>
            <p style={{ margin: 0 }}>Review your process checks and download your official assessment report.</p>
          </div>
          
          <button className="btn btn-primary" onClick={handleDownloadPdf} style={{ padding: '12px 24px' }}>
            <Download size={16} /> Download PDF Report
          </button>
        </div>

        <div className="report-grid">
          {/* Stats Summary Panel */}
          <div className="report-summary-card">
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>Checklist Completion Metrics</h3>
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-value">{completionPercent}%</div>
                <div className="stat-label">Completion</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{totalAnswered}/{totalQuestions}</div>
                <div className="stat-label">Answered</div>
              </div>
              <div className="stat-box">
                <div className="stat-value" style={{ color: '#10b981' }}>{yesCount}</div>
                <div className="stat-label">Yes status</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f9fafb' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Implemented (Yes):</span>
                <span style={{ fontWeight: 700, color: '#166534' }}>{yesCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f9fafb' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Not Implemented (No):</span>
                <span style={{ fontWeight: 700, color: '#991b1b' }}>{noCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f9fafb' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Not Applicable (N/A):</span>
                <span style={{ fontWeight: 700, color: '#5b21b6' }}>{naCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Unanswered Questions:</span>
                <span style={{ fontWeight: 700, color: '#4b5563' }}>{totalQuestions - totalAnswered}</span>
              </div>
            </div>
          </div>

          {/* Project Details Panel */}
          <div className="report-summary-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>
              <h3 style={{ margin: 0 }}>Assessment Metadata</h3>
              {!isEditing && (
                <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem' }} onClick={() => setIsEditing(true)}>
                  <Edit3 size={12} /> Edit Details
                </button>
              )}
            </div>

            {!isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Company Name</strong>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{workspaceData.companyName}</span>
                </div>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Application Name</strong>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{workspaceData.appName}</span>
                </div>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Application Description</strong>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{workspaceData.appDescription}</p>
                </div>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Workspace ID</strong>
                  <span style={{ color: 'var(--text-light)', fontFamily: 'monospace' }}>{workspaceId}</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveEdit}>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Company Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                    value={editCompany} 
                    onChange={e => setEditCompany(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Application Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                    value={editApp} 
                    onChange={e => setEditApp(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Description</label>
                  <textarea 
                    className="form-textarea" 
                    style={{ padding: '6px 10px', fontSize: '0.85rem', minHeight: '60px' }}
                    value={editDesc} 
                    onChange={e => setEditDesc(e.target.value)} 
                    required 
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handleCancelEdit}>
                    <X size={12} /> Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                    <Save size={12} /> Save
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Detailed Principle Progress Table */}
        <div style={{ marginTop: '2.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Principle-by-Principle Status</h3>
          <table className="principle-stats-table">
            <thead>
              <tr>
                <th>Governance Principle</th>
                <th style={{ width: '180px' }}>Completion Status</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Answered</th>
              </tr>
            </thead>
            <tbody>
              {principleStats.map(stat => {
                const pct = stat.total > 0 ? Math.round((stat.answered / stat.total) * 100) : 0;
                return (
                  <tr key={stat.key}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{stat.key}</td>
                    <td>
                      <div className="progress-mini-bar-bg">
                        <div className="progress-mini-bar-fill" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#10b981' : 'var(--primary)' }}></div>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{pct}%</span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>{stat.answered}/{stat.total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Technical test results if uploaded */}
        {moonshotResults && (
          <div style={{ marginTop: '2.5rem', borderTop: '1px solid #f3f4f6', paddingTop: '2rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Technical Verification Details (Project Moonshot)</h3>
            <p>The following technical benchmark summary will be appended to the report:</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', background: '#faf5ff', border: '1px solid #f3e8ff', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '0.5px' }}>Model Connector</strong>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{moonshotResults.metadata?.connector_name || "N/A"}</span>
              </div>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '0.5px' }}>Total Tests</strong>
                  <span style={{ fontWeight: 700 }}>{moonshotResults.results?.stats?.total || 0}</span>
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '0.5px' }}>Passed</strong>
                  <span style={{ fontWeight: 700, color: '#166534' }}>{moonshotResults.results?.stats?.passed || 0}</span>
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '0.5px' }}>Failed</strong>
                  <span style={{ fontWeight: 700, color: '#991b1b' }}>{moonshotResults.results?.stats?.failed || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom controls */}
        <div className="checklist-nav-controls" style={{ marginTop: '3rem' }}>
          <button className="btn btn-secondary" onClick={onBack}>
            <ArrowLeft size={16} /> Back to Technical Test
          </button>
          
          <button className="btn btn-secondary" onClick={onHome}>
            <Home size={16} /> Start Over
          </button>
          
          <button className="btn btn-primary" onClick={handleDownloadPdf}>
            <FileText size={16} /> Export PDF Report
          </button>
        </div>

      </div>
    </div>
  );
};
