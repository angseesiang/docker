import React, { useState, useEffect } from 'react';
import { Briefcase, FolderOpen, ArrowRight, Trash2 } from 'lucide-react';

interface WorkspaceData {
  companyName: string;
  appName: string;
  appDescription: string;
  workspaceName: string;
  created_at: string;
}

interface WorkspaceSetupProps {
  onWorkspaceCreated: (workspaceId: string, data: WorkspaceData) => void;
  onBack: () => void;
}

export const WorkspaceSetup: React.FC<WorkspaceSetupProps> = ({ onWorkspaceCreated, onBack }) => {
  const [companyName, setCompanyName] = useState('');
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [existingWorkspaces, setExistingWorkspaces] = useState<Array<{ id: string; data: WorkspaceData }>>([]);
  const [error, setError] = useState('');

  // Load existing workspaces from localStorage
  useEffect(() => {
    try {
      const keys = Object.keys(localStorage);
      const workspaces: Array<{ id: string; data: WorkspaceData }> = [];
      
      keys.forEach(key => {
        if (key.startsWith('aiv_workspace_')) {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const parsed = JSON.parse(item);
              if (parsed.workspaceName) {
                workspaces.push({
                  id: key.replace('aiv_workspace_', ''),
                  data: parsed
                });
              }
            } catch (err) {
              console.error("Error parsing stored workspace", err);
            }
          }
        }
      });
      
      // Sort by creation date descending
      workspaces.sort((a, b) => {
        return new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime();
      });
      
      setExistingWorkspaces(workspaces);
    } catch (e) {
      console.error("Error loading workspaces", e);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedWorkspace = workspaceName.trim();
    const trimmedCompany = companyName.trim();
    const trimmedApp = appName.trim();
    const trimmedDesc = appDescription.trim();

    if (!trimmedWorkspace || !trimmedCompany || !trimmedApp || !trimmedDesc) {
      setError('Please fill in all the required fields.');
      return;
    }

    // Sanitize workspace ID (spaces to hyphens, remove special characters)
    let workspaceId = trimmedWorkspace.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    if (!workspaceId) {
      setError('Invalid workspace name.');
      return;
    }

    // Check if workspace already exists
    const storageKey = `aiv_workspace_${workspaceId}`;
    if (localStorage.getItem(storageKey)) {
      setError('A workspace with this name already exists. Please choose a different name.');
      return;
    }

    const newWorkspaceData: WorkspaceData = {
      companyName: trimmedCompany,
      appName: trimmedApp,
      appDescription: trimmedDesc,
      workspaceName: trimmedWorkspace,
      created_at: new Date().toISOString()
    };

    onWorkspaceCreated(workspaceId, newWorkspaceData);
  };

  const handleSelectWorkspace = (id: string, data: WorkspaceData) => {
    onWorkspaceCreated(id, data);
  };

  const handleDeleteWorkspace = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this workspace? This will permanently delete your progress.")) {
      localStorage.removeItem(`aiv_workspace_${id}`);
      localStorage.removeItem(`aiv_answers_${id}`);
      localStorage.removeItem(`aiv_moonshot_${id}`);
      setExistingWorkspaces(prev => prev.filter(w => w.id !== id));
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
      <h2>Set Up Your Assessment Workspace</h2>
      <p style={{ marginBottom: '2rem' }}>
        Provide details about the AI application you are testing. Workspaces allow you to save your progress locally and return to it later.
      </p>

      {error && (
        <div className="alert alert-warning">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="company">Company Name <span className="required">*</span></label>
          <input 
            type="text" 
            id="company" 
            className="form-input" 
            placeholder="e.g., Bank ABC" 
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            maxLength={50}
          />
          <div className="form-help">The name of the assessing company will be reflected in the final report.</div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="app-name">Application Name <span className="required">*</span></label>
          <input 
            type="text" 
            id="app-name" 
            className="form-input" 
            placeholder="e.g., Chatbot A" 
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            required
            maxLength={50}
          />
          <div className="form-help">The name of the Generative AI application under evaluation.</div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="app-desc">Application Description <span className="required">*</span></label>
          <textarea 
            id="app-desc" 
            className="form-textarea" 
            placeholder="e.g., Chatbot A is an internal chatbot used by employees to extract and summarise policies. It leverages LLMs to provide quick, accurate answers." 
            value={appDescription}
            onChange={(e) => setAppDescription(e.target.value)}
            required
            maxLength={256}
          />
          <div className="form-help">Describe the purpose, scope, and target users of this application (max 256 characters).</div>
        </div>

        <div className="form-group" style={{ marginBottom: '2.5rem' }}>
          <label className="form-label" htmlFor="workspace-name">Workspace Name <span className="required">*</span></label>
          <input 
            type="text" 
            id="workspace-name" 
            className="form-input" 
            placeholder="e.g., Chatbot A Assessment v1" 
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            required
            maxLength={50}
          />
          <div className="form-help">This name serves as your local ID. It cannot be changed after creation.</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            Back
          </button>
          
          <button type="submit" className="btn btn-primary">
            Create Workspace <ArrowRight size={16} />
          </button>
        </div>
      </form>

      {existingWorkspaces.length > 0 && (
        <div style={{ marginTop: '3.5rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <FolderOpen size={20} className="text-violet" /> Resume Previous Work
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {existingWorkspaces.map(w => (
              <div 
                key={w.id} 
                className="principle-card-mini"
                style={{ 
                  justifyContent: 'space-between', 
                  cursor: 'pointer',
                  padding: '12px 16px'
                }}
                onClick={() => handleSelectWorkspace(w.id, w.data)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                  <div className="principle-number" style={{ background: '#f3e8ff' }}>
                    <Briefcase size={14} />
                  </div>
                  <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      {w.data.workspaceName}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {w.data.appName} | {w.data.companyName}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                    {new Date(w.data.created_at).toLocaleDateString()}
                  </span>
                  <button 
                    className="btn btn-danger" 
                    style={{ padding: '6px', borderRadius: '6px' }}
                    onClick={(e) => handleDeleteWorkspace(w.id, e)}
                    title="Delete Workspace"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
