import React, { useState, useEffect } from 'react';
import { Home, ArrowLeft, ArrowRight, Download, Upload, HelpCircle, CheckCircle2, Sparkles, Highlighter, EyeOff } from 'lucide-react';
import { exportToExcel, importFromExcel } from '../utils/excelHandler';

const principleSummaries: { [key: string]: string } = {
  "1. Transparency": "Transparency ensures visibility into an AI system's intent, impact, data usage, and limitations. It enables affected stakeholders to understand how decisions are reached and data is processed, mitigating risks of opacity.",
  "2. Explainability": "Explainability ensures that AI decisions can be explained and understood by users. The required depth of explanation varies by context and consequences. If direct explanations are not possible (black-box models), alternative governance measures must be used.",
  "3. Reproducibility": "Reproducibility builds system resilience by enabling the replication of outcomes and errors. It relies on logging capabilities to monitor the AI lifecycle, track data inputs, and review system outputs to trace root causes.",
  "4. Safety": "Safety prevents AI systems from causing physical or other intolerable harm. It employs a risk-based approach to identify, assess, and mitigate risks throughout the AI lifecycle, keeping residual risk within tolerable levels.",
  "5. Security": "Security protects AI systems from adversarial attacks and protects data confidentiality, integrity, and availability. It uses risk-based security controls and clear stakeholder roles (developers, operators, users) to govern system safety.",
  "6. Robustness": "Robustness ensures AI systems maintain performance under changing environments or adversarial conditions. It focuses on technical validation throughout the system's life cycle alongside standard cybersecurity testing.",
  "7. Fairness": "Fairness aims to prevent unfair bias against individuals or groups. It requires aligning model outcomes with defined fairness criteria and conducting validation checks throughout the development lifecycle.",
  "8. Data Governance": "Data Governance establishes authority and clear decision-making processes for managing data across its lifecycle. It ensures data quality, compliance, and integrity for all inputs used in the AI systems.",
  "9. Accountability": "Accountability implements clear internal governance structures. It ensures proper management oversight, defining roles and responsibilities for the development and deployment of AI systems.",
  "10. Human agency": "Human agency ensures humans retain oversight and the ability to intervene, override, or self-assess when using AI systems. This prevents over-reliance and corrects negative system outcomes.",
  "11. Inclusive growth": "Inclusive growth commits stakeholders to use AI for beneficial outcomes for humans and the planet. It focuses on augmenting creativity, reducing social/economic inequalities, and protecting natural environments."
};
import type { WorkspaceAnswers } from '../utils/excelHandler';

const generateAISummary = (text: string): string => {
  if (!text) return "";
  
  // Clean up whitespace
  let clean = text.replace(/\s+/g, ' ').trim();
  
  // Remove parenthetical details which are usually examples or exceptions
  clean = clean.replace(/\s*\([^)]*\)/g, '');
  
  // Remove common verbose introductory phrases
  const prefixesToRemove = [
    /^[Dd]ocumentary evidence of an?\s+/,
    /^[Dd]ocumentary evidence showing that\s+/,
    /^[Dd]ocumentary evidence to show that\s+/,
    /^[Dd]ocumentary evidence\s+/,
    /^[Pp]rocesses in place to\s+/,
    /^[Pp]rocesses in place for\s+/,
    /^[Ww]here possible,\s+/,
    /^[Ww]here possible\s+/
  ];
  
  for (const regex of prefixesToRemove) {
    clean = clean.replace(regex, '');
  }
  
  // Clean up any remaining leading/trailing whitespace or punctuation
  clean = clean.trim();
  
  // Capitalize first letter
  clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  
  // If there are sub-bullets (new lines / commas separating examples), keep the core statement
  const parts = clean.split(/, e\.g\.,|, for example,|, such as/i);
  if (parts.length > 0) {
    clean = parts[0].trim();
  }
  
  // Ensure it ends with a period
  if (!clean.endsWith('.') && !clean.endsWith('?') && !clean.endsWith('!')) {
    clean += '.';
  }
  
  return clean;
};

interface SummarizableTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  predefinedSummary?: string;
  compact?: boolean;
}

const SummarizableText: React.FC<SummarizableTextProps> = ({
  text,
  className = "",
  style,
  predefinedSummary,
  compact = false
}) => {
  const [showSummary, setShowSummary] = useState(false);
  const [highlightSummary, setHighlightSummary] = useState(false);

  // Clean up states when text changes
  useEffect(() => {
    setShowSummary(false);
    setHighlightSummary(false);
  }, [text]);

  const summary = predefinedSummary || generateAISummary(text);

  const bottomPadding = showSummary 
    ? (compact ? '3.2rem' : '4.2rem') 
    : (compact ? '2.2rem' : '3.2rem');

  return (
    <div 
      className="summarizable-container" 
      style={{ 
        position: 'relative', 
        paddingBottom: bottomPadding, 
        transition: 'padding-bottom 0.2s ease',
        width: '100%',
        ...style 
      }}
    >
      <div className={`summarizable-content ${className}`}>
        {text}
      </div>

      {showSummary && (
        <div className={`summary-box ${highlightSummary ? 'highlighted' : ''}`} style={{ marginTop: compact ? '0.5rem' : '1rem' }}>
          <div className="summary-title-row">
            <div className="summary-title-text">
              <Sparkles size={10} /> AI Summary
            </div>
            <div className="summary-actions">
              <button 
                className={`btn-summary-action highlight-btn ${highlightSummary ? 'active' : ''}`}
                onClick={() => setHighlightSummary(!highlightSummary)}
                title="Highlight summary text"
              >
                <Highlighter size={10} /> {highlightSummary ? 'Highlighted' : 'Highlight'}
              </button>
              <button 
                className="btn-summary-action"
                onClick={() => setShowSummary(false)}
                title="Hide summary box"
              >
                <EyeOff size={10} /> Hide
              </button>
            </div>
          </div>
          <div className="summary-content-text" style={{ fontSize: compact ? '0.8rem' : '0.88rem' }}>
            {summary}
          </div>
        </div>
      )}

      <button 
        className={`btn btn-secondary btn-light btn-ai-summary ${compact ? 'compact' : ''}`}
        onClick={() => setShowSummary(!showSummary)}
        style={{ 
          position: 'absolute', 
          right: '0', 
          bottom: '0',
          margin: '0.25rem 0'
        }}
      >
        <Sparkles size={compact ? 12 : 14} />
        {showSummary ? 'Hide Summary' : 'Summarize'}
      </button>
    </div>
  );
};

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
          <SummarizableText 
            text={activePrinciple.principle_description} 
            predefinedSummary={principleSummaries[activePrincipleKey]}
          />
        </div>

        {/* Outcomes & Processes List */}
        {sortedOutcomeIds.map(outcomeId => {
          const processes = outcomeGroups[outcomeId];
          return (
            <div key={outcomeId} className="outcome-container">
              <div className="outcome-header">
                <span className="outcome-id-badge">Outcome {outcomeId}</span>
                <SummarizableText 
                  text={processes[0].outcomes}
                  className="outcome-title"
                  compact={true}
                  style={{ marginTop: '0.5rem' }}
                />
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
                        <SummarizableText 
                          text={proc.process_to_achieve_outcomes}
                          compact={true}
                        />
                      </div>
                      
                      <div className="evidence-col">
                        <div className="evidence-title">Expected Evidence</div>
                        <div className="evidence-content">
                          <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                            Type: {proc.evidence_type}
                          </strong>
                          <SummarizableText 
                            text={proc.evidence}
                            compact={true}
                          />
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
