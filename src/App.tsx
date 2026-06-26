import { useState, useEffect } from 'react';
import { Welcome } from './components/Welcome';
import { WorkspaceSetup } from './components/WorkspaceSetup';
import { Checklist } from './components/Checklist';
import { TechnicalTest } from './components/TechnicalTest';
import { ReportSummary } from './components/ReportSummary';
import type { WorkspaceAnswers } from './utils/excelHandler';
import { Briefcase } from 'lucide-react';

type Step = 'WELCOME' | 'WORKSPACE_SETUP' | 'CHECKLIST' | 'TECHNICAL_TEST' | 'REPORT_PREVIEW';

interface WorkspaceData {
  companyName: string;
  appName: string;
  appDescription: string;
  workspaceName: string;
  created_at: string;
}

export default function App() {
  const [currentStep, setCurrentStep] = useState<Step>('WELCOME');
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null);
  const [answers, setAnswers] = useState<WorkspaceAnswers>({});
  const [moonshotResults, setMoonshotResults] = useState<any | null>(null);
  const [checklistJson, setChecklistJson] = useState<any>(null);

  // Fetch checklist reference JSON
  useEffect(() => {
    fetch('/assets/references/checklist.json')
      .then(res => res.json())
      .then(data => setChecklistJson(data))
      .catch(err => console.error("Error loading checklist.json", err));
  }, []);

  // Save answers to localStorage when updated
  useEffect(() => {
    if (workspaceId && Object.keys(answers).length > 0) {
      localStorage.setItem(`aiv_answers_${workspaceId}`, JSON.stringify(answers));
    }
  }, [answers, workspaceId]);

  // Save moonshot results to localStorage when updated
  useEffect(() => {
    if (workspaceId) {
      if (moonshotResults) {
        localStorage.setItem(`aiv_moonshot_${workspaceId}`, JSON.stringify(moonshotResults));
      } else {
        localStorage.removeItem(`aiv_moonshot_${workspaceId}`);
      }
    }
  }, [moonshotResults, workspaceId]);

  // Initialize workspace when created or selected
  const handleWorkspaceCreated = (id: string, data: WorkspaceData) => {
    setWorkspaceId(id);
    setWorkspaceData(data);
    
    // Save workspace metadata
    localStorage.setItem(`aiv_workspace_${id}`, JSON.stringify(data));
    
    // Load existing answers for this workspace if they exist
    const savedAnswers = localStorage.getItem(`aiv_answers_${id}`);
    if (savedAnswers) {
      try {
        setAnswers(JSON.parse(savedAnswers));
      } catch (e) {
        console.error("Error loading saved answers", e);
        setAnswers({});
      }
    } else {
      setAnswers({});
    }

    // Load existing moonshot results if they exist
    const savedMoonshot = localStorage.getItem(`aiv_moonshot_${id}`);
    if (savedMoonshot) {
      try {
        setMoonshotResults(JSON.parse(savedMoonshot));
      } catch (e) {
        console.error("Error loading saved moonshot", e);
        setMoonshotResults(null);
      }
    } else {
      setMoonshotResults(null);
    }
    
    setCurrentStep('CHECKLIST');
  };

  // Update workspace metadata inline (from report summary)
  const handleUpdateWorkspaceData = (data: WorkspaceData) => {
    if (workspaceId) {
      setWorkspaceData(data);
      localStorage.setItem(`aiv_workspace_${workspaceId}`, JSON.stringify(data));
    }
  };

  // Start over / return to welcome page
  const handleStartOver = () => {
    if (window.confirm("Do you want to return to the Home page? Your assessment data is saved in this workspace and won't be lost.")) {
      setCurrentStep('WELCOME');
      setWorkspaceId(null);
      setWorkspaceData(null);
      setAnswers({});
      setMoonshotResults(null);
    }
  };

  // Render wizard screens based on current step
  const renderStep = () => {
    if (!checklistJson) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--primary)' }}>Loading Assessment Reference Data...</h3>
            <p>Please wait while we initialize the checklist framework.</p>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 'WELCOME':
        return <Welcome onStart={() => setCurrentStep('WORKSPACE_SETUP')} />;
      case 'WORKSPACE_SETUP':
        return (
          <WorkspaceSetup 
            onWorkspaceCreated={handleWorkspaceCreated} 
            onBack={() => setCurrentStep('WELCOME')} 
          />
        );
      case 'CHECKLIST':
        if (!workspaceId || !workspaceData) return null;
        return (
          <Checklist
            workspaceId={workspaceId}
            workspaceData={workspaceData}
            answers={answers}
            onUpdateAnswers={setAnswers}
            onNext={() => setCurrentStep('TECHNICAL_TEST')}
            onBack={() => setCurrentStep('WORKSPACE_SETUP')}
            onHome={handleStartOver}
            checklistJson={checklistJson}
          />
        );
      case 'TECHNICAL_TEST':
        return (
          <TechnicalTest
            moonshotResults={moonshotResults}
            onUploadResults={setMoonshotResults}
            onNext={() => setCurrentStep('REPORT_PREVIEW')}
            onBack={() => setCurrentStep('CHECKLIST')}
          />
        );
      case 'REPORT_PREVIEW':
        if (!workspaceId || !workspaceData) return null;
        return (
          <ReportSummary
            workspaceId={workspaceId}
            workspaceData={workspaceData}
            answers={answers}
            onUpdateWorkspaceData={handleUpdateWorkspaceData}
            onBack={() => setCurrentStep('TECHNICAL_TEST')}
            onHome={handleStartOver}
            checklistJson={checklistJson}
            moonshotResults={moonshotResults}
          />
        );
      default:
        return <Welcome onStart={() => setCurrentStep('WORKSPACE_SETUP')} />;
    }
  };

  return (
    <div className="app-container">
      {/* Header Branding bar */}
      <header className="header">
        <div className="logo-container">
          <img 
            src="/assets/images/aiverify_logo.png" 
            alt="AI Verify Foundation" 
            className="logo-img"
            onError={(e) => {
              // Fallback text logo if assets are not loaded
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="app-title-container">
            <span className="app-brand">AI Verify</span>
            <span className="app-subtitle">Testing Framework Process Checks</span>
          </div>
        </div>

        {workspaceData && (
          <div className="workspace-badge">
            <Briefcase size={14} /> Active Workspace: <strong>{workspaceData.workspaceName}</strong>
          </div>
        )}
      </header>

      {/* Main Screen Content Area */}
      <main style={{ flex: 1 }}>
        {renderStep()}
      </main>

      {/* Footer copyright */}
      <footer style={{ marginTop: '3rem', padding: '1.5rem 0', borderTop: '1px solid rgba(229, 231, 235, 0.5)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-light)' }}>
        &copy; {new Date().getFullYear()} AI Verify Foundation. All rights reserved. 
      </footer>
    </div>
  );
}
