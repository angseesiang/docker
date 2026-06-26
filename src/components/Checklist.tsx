import React, { useState, useEffect } from 'react';
import { Home, ArrowLeft, ArrowRight, Download, Upload, HelpCircle, CheckCircle2 } from 'lucide-react';
import { exportToExcel, importFromExcel } from '../utils/excelHandler';
import type { WorkspaceAnswers } from '../utils/excelHandler';

interface WorkspaceData {
  companyName: string;
  appName: string;
  appDescription: string;
  workspaceName: string;
  created_at: string;
}

interface ChecklistProps {
  workspaceId: string;
  workspaceData: WorkspaceData;
  answers: WorkspaceAnswers;
  onUpdateAnswers: (newAnswers: WorkspaceAnswers) => void;
  onNext: () => void;
  onBack: () => void;
  onHome: () => void;
  checklistJson: any;
}

export const Checklist: React.FC<ChecklistProps> = ({
  workspaceData,
  answers,
  onUpdateAnswers,
  onNext,
  onBack,
  onHome,
  checklistJson
}) => {
  const [activePrincipleKey, setActivePrincipleKey] = useState<string>('');
  const [mapData, setMapData] = useState<{ [processId: string]: string[] }>({});
  const [showInstructions, setShowInstructions] = useState(true);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  // Set default active principle to the first one in the list
  useEffect(() => {
    const keys = Object.keys(checklistJson);
    if (keys.length > 0 && !activePrincipleKey) {
      setActivePrincipleKey(keys[0]);
    }
  }, [checklistJson, activePrincipleKey]);

  // Fetch framework map data
  useEffect(() => {
    fetch('/assets/references/map.json')
      .then(res => res.json())
      .then(data => setMapData(data))
      .catch(err => console.error("Error loading map.json", err));
  }, []);

  if (!activePrincipleKey || !checklistJson[activePrincipleKey]) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading checklist...</div>;
  }

  const activePrinciple = checklistJson[activePrincipleKey];
  const processChecks = activePrinciple.process_checks;

  // Group processes by outcome_id
  const outcomeGroups: { [outcomeId: string]: any[] } = {};
  Object.keys(processChecks).forEach(processId => {
    const check = processChecks[processId];
    const outcomeId = check.outcome_id;
    if (!outcomeGroups[outcomeId]) {
      outcomeGroups[outcomeId] = [];
    }
    outcomeGroups[outcomeId].push({
      id: processId,
      ...check
    });
  });

  // Sort outcome IDs (e.g. 1.1, 1.2)
  const sortedOutcomeIds = Object.keys(outcomeGroups).sort((a, b) => parseFloat(a) - parseFloat(b));

  // Compute checklist stats
  let totalQuestions = 0;
  let totalAnswered = 0;
  const principleProgress: { [key: string]: { answered: number; total: number } } = {};

  Object.keys(checklistJson).forEach(pKey => {
    const pData = checklistJson[pKey];
    const checks = pData.process_checks;
    let pTotal = Object.keys(checks).length;
    let pAnswered = 0;

    Object.keys(checks).forEach(processId => {
      totalQuestions++;
      // Check if this process has an answer in state
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
      }
    });

    principleProgress[pKey] = {
      answered: pAnswered,
      total: pTotal
    };
  });

  const progressPercent = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;

  // Handle implementation response change
  const handleImplChange = (outcomeId: string, processId: string, value: "Yes" | "No" | "N/A") => {
    const updated = { ...answers };
    if (!updated[outcomeId]) {
      updated[outcomeId] = {};
    }
    if (!updated[outcomeId][processId]) {
      updated[outcomeId][processId] = { implementation: null, elaboration: "" };
    }
    updated[outcomeId][processId].implementation = value;
    onUpdateAnswers(updated);
  };

  // Handle elaboration text change
  const handleElabChange = (outcomeId: string, processId: string, value: string) => {
    const updated = { ...answers };
    if (!updated[outcomeId]) {
      updated[outcomeId] = {};
    }
    if (!updated[outcomeId][processId]) {
      updated[outcomeId][processId] = { implementation: null, elaboration: "" };
    }
    updated[outcomeId][processId].elaboration = value;
    onUpdateAnswers(updated);
  };

  // Export to Excel
  const handleExportExcel = async () => {
    try {
      const buffer = await exportToExcel('/assets/references/aivtf-excel.xlsx', answers);
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AI_Verify_Process_Checks_${workspaceData.appName.replace(/\s+/g, '_')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export Excel failed", err);
      alert("Failed to export Excel. Please try again.");
    }
  };

  // Import from Excel
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    setImportSuccess('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx')) {
      setImportError('Please upload a valid Excel (.xlsx) file.');
      return;
    }

    try {
      const importedAnswers = await importFromExcel(file, checklistJson);
      onUpdateAnswers(importedAnswers);
      setImportSuccess('Worksheet imported successfully! All answers have been loaded.');
      
      // Clear file input
      e.target.value = '';
    } catch (err) {
      console.error("Import Excel failed", err);
      setImportError('Failed to parse the Excel file. Please ensure it matches the AI Verify format.');
    }
  };

  const getBadgeColorName = (color: string) => {
    switch (color) {
      case 'blue': return 'US NIST AI RMF';
      case 'green': return 'ISO 42001';
      case 'violet': return 'Hiroshima Process CoC';
      default: return color.toUpperCase();
    }
  };

  return (
    <div className="checklist-container" style={{ animation: 'fadeIn 0.3s ease' }}>
      
      {/* Sidebar navigation */}
      <div className="checklist-sidebar">
        <div className="sidebar-header">
          <span>Assessment Checklist</span>
        </div>
        <div className="sidebar-list">
          {Object.keys(checklistJson).map(pKey => {
            const isActive = pKey === activePrincipleKey;
            const progress = principleProgress[pKey] || { answered: 0, total: 0 };
            const isCompleted = progress.answered === progress.total;

            return (
              <button
                key={pKey}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => setActivePrincipleKey(pKey)}
              >
                <span className="sidebar-item-label" title={pKey}>
                  {pKey}
                </span>
                <div className="sidebar-item-progress">
                  <span>Progress: {progress.answered}/{progress.total}</span>
                  {isCompleted && <CheckCircle2 size={12} style={{ color: isActive ? 'white' : '#10b981' }} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Checklist Panel */}
      <div className="checklist-pane">
        
        {/* Progress Header Card */}
        <div className="checklist-main-header">
          <div className="progress-info-row">
            <span>Overall Assessment Progress</span>
            <span className="progress-percentage">{progressPercent}% Completed</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Answered {totalAnswered} of {totalQuestions} compliance questions
          </div>
          
          <div className="checklist-actions-bar">
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>
              Auto-save enabled: Progress saved to browser storage.
            </span>
            
            <div className="action-buttons-group">
              <button className="btn btn-secondary btn-light" onClick={handleExportExcel} title="Export to Excel">
                <Download size={14} /> Export to Excel
              </button>
              
              <label className="btn btn-secondary btn-light" style={{ cursor: 'pointer' }} title="Import from Excel">
                <Upload size={14} /> Import from Excel
                <input 
                  type="file" 
                  accept=".xlsx" 
                  style={{ display: 'none' }} 
                  onChange={handleImportExcel}
                />
              </label>
            </div>
          </div>

          {importError && (
            <div className="alert alert-warning" style={{ marginTop: '12px', marginBottom: 0 }}>
              {importError}
            </div>
          )}
          {importSuccess && (
            <div className="alert alert-info" style={{ marginTop: '12px', marginBottom: 0, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>
              {importSuccess}
            </div>
          )}
        </div>

        {/* Expandable Instructions Box */}
        <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div 
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => setShowInstructions(!showInstructions)}
          >
            <span style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)' }}>
              <HelpCircle size={16} /> Checklist Instructions
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
              {showInstructions ? 'Hide' : 'Show'}
            </span>
          </div>
          {showInstructions && (
            <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid #f3f4f6', paddingTop: '10px' }}>
              <ul style={{ paddingLeft: '1.25rem' }}>
                <li style={{ marginBottom: '4px' }}>Answer the process check questions for each of the 11 AI governance principles.</li>
                <li style={{ marginBottom: '4px' }}>Select <strong>Yes</strong> if the process is fully implemented and you have supporting evidence.</li>
                <li style={{ marginBottom: '4px' }}>Select <strong>No</strong> or <strong>N/A</strong> if it is not implemented or not applicable, and provide elaboration.</li>
                <li>You may export your assessment to Excel to edit offline and import it back here.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Principle Description Panel */}
        <div className="principle-intro-box">
          <div className="principle-title">{activePrincipleKey}</div>
          <div className="principle-desc">{activePrinciple.principle_description}</div>
        </div>

        {/* Outcomes & Processes List */}
        {sortedOutcomeIds.map(outcomeId => {
          const processes = outcomeGroups[outcomeId];
          return (
            <div key={outcomeId} className="outcome-container">
              <div className="outcome-header">
                <span className="outcome-id-badge">Outcome {outcomeId}</span>
                <div className="outcome-title">{processes[0].outcomes}</div>
              </div>

              {processes.map(proc => {
                const processId = proc.id;
                const badges = mapData[processId] || [];
                
                // Get current answers
                const ans = answers[outcomeId]?.[processId] || { implementation: null, elaboration: '' };

                return (
                  <div key={processId} className="process-box">
                    <div className="process-header">
                      <span className="process-id-label">Process {processId}</span>
                      {badges.length > 0 && (
                        <div className="badges-row">
                          {badges.map(b => (
                            <span key={b} className={`crosswalk-badge ${b}`}>
                              {getBadgeColorName(b)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="process-columns">
                      <div className="process-desc-col">
                        {proc.process_to_achieve_outcomes}
                      </div>
                      
                      <div className="evidence-col">
                        <div className="evidence-title">Expected Evidence</div>
                        <div className="evidence-content">
                          <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                            Type: {proc.evidence_type}
                          </strong>
                          {proc.evidence}
                        </div>
                      </div>
                    </div>

                    <div className="process-inputs-row">
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Implemented?</div>
                        <div className="radio-group">
                          <label className="radio-option">
                            <input 
                              type="radio" 
                              name={`impl-${processId}`} 
                              value="Yes" 
                              checked={ans.implementation === "Yes"}
                              onChange={() => handleImplChange(outcomeId, processId, "Yes")}
                            />
                            <span className="radio-label Yes">Yes</span>
                          </label>
                          <label className="radio-option">
                            <input 
                              type="radio" 
                              name={`impl-${processId}`} 
                              value="No" 
                              checked={ans.implementation === "No"}
                              onChange={() => handleImplChange(outcomeId, processId, "No")}
                            />
                            <span className="radio-label No">No</span>
                          </label>
                          <label className="radio-option">
                            <input 
                              type="radio" 
                              name={`impl-${processId}`} 
                              value="N/A" 
                              checked={ans.implementation === "N/A"}
                              onChange={() => handleImplChange(outcomeId, processId, "N/A")}
                            />
                            <span className="radio-label NA">N/A</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Elaboration:</div>
                        <textarea 
                          className="form-input" 
                          style={{ minHeight: '60px', fontSize: '0.85rem', padding: '8px 12px' }}
                          placeholder="Provide elaboration on evidence location, or reasons for No / N/A selections."
                          value={ans.elaboration}
                          onChange={(e) => handleElabChange(outcomeId, processId, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Bottom Navigation */}
        <div className="checklist-nav-controls">
          <button className="btn btn-secondary" onClick={onBack}>
            <ArrowLeft size={16} /> Back to Setup
          </button>
          
          <button className="btn btn-secondary" onClick={onHome}>
            <Home size={16} /> Start Over
          </button>
          
          <button className="btn btn-primary" onClick={onNext}>
            Next: Technical Test <ArrowRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
};
