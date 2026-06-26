import React, { useState } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';

interface TechnicalTestProps {
  moonshotResults: any | null;
  onUploadResults: (results: any | null) => void;
  onNext: () => void;
  onBack: () => void;
}

export const TechnicalTest: React.FC<TechnicalTestProps> = ({
  moonshotResults,
  onUploadResults,
  onNext,
  onBack
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState('');

  const parseMoonshotJson = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      
      // Basic validation to check if it's a Project Moonshot result
      // Project Moonshot results typically have metadata, stats, results, etc.
      // If not, we will create a mock-structured report or accept standard structures.
      const hasMetadata = parsed.metadata !== undefined || parsed.exec_metadata !== undefined;
      
      if (!hasMetadata) {
        setError("Invalid file format. The uploaded JSON does not appear to be a valid Project Moonshot report.");
        return;
      }
      
      // Extract stats if available, or generate them
      let stats = parsed.results?.stats || parsed.stats;
      if (!stats) {
        // Fallback calculation if stats don't exist
        const total = parsed.results?.length || 0;
        const passed = parsed.results?.filter((r: any) => r.status === 'passed' || r.grade === 'A' || r.passed === true).length || 0;
        stats = {
          total,
          passed,
          failed: total - passed
        };
      }

      const structuredResults = {
        metadata: parsed.metadata || parsed.exec_metadata || { connector_name: "Generic LLM Connector" },
        results: {
          stats,
          details: parsed.results || []
        }
      };

      onUploadResults(structuredResults);
      setError('');
    } catch (err) {
      setError("Failed to parse JSON. Please upload a valid JSON file.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;
    readAndParseFile(file);
  };

  const readAndParseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        parseMoonshotJson(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setError('');
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        setError('Please upload a valid JSON file.');
        return;
      }
      readAndParseFile(file);
    }
  };

  const handleClear = () => {
    onUploadResults(null);
    setError('');
  };

  const stats = moonshotResults?.results?.stats || { total: 0, passed: 0, failed: 0 };
  const metadata = moonshotResults?.metadata || {};

  return (
    <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
      <h2>Upload Technical Test Results (Optional)</h2>
      <p style={{ marginBottom: '2rem' }}>
        If you have conducted automated technical safety testing (e.g., bench-marking, adversarial red-teaming) on your application using <strong>Project Moonshot</strong>, upload the JSON test report here. The findings will be integrated into the final Summary Report.
      </p>

      {error && (
        <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
          <span>{error}</span>
        </div>
      )}

      {!moonshotResults ? (
        <div 
          className={`upload-container ${isDragOver ? 'dragover' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('json-file-input')?.click()}
        >
          <UploadCloud size={48} className="upload-icon" />
          <h3 style={{ marginBottom: '8px', color: 'var(--text-main)' }}>Drag & Drop Project Moonshot Report</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '1.5rem' }}>
            or click to browse your files (JSON format)
          </p>
          <input 
            type="file" 
            id="json-file-input" 
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            If you don't have technical test results, you can safely skip this step.
          </span>
        </div>
      ) : (
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="uploaded-file-card">
            <div className="file-info">
              <CheckCircle size={24} style={{ color: '#10b981' }} />
              <div>
                <div className="file-name">Technical Report Loaded Successfully</div>
                <div className="file-size">Model/Connector: {metadata.connector_name || "Generic Model"}</div>
              </div>
            </div>
            <button className="btn btn-danger" style={{ padding: '8px' }} onClick={handleClear}>
              <Trash2 size={16} />
            </button>
          </div>

          <h3 style={{ marginBottom: '1rem' }}>Test Results Metrics</h3>
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-box">
              <div className="stat-value" style={{ color: 'var(--primary)' }}>{stats.total}</div>
              <div className="stat-label">Total Benchmarks</div>
            </div>
            <div className="stat-box" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <div className="stat-value" style={{ color: '#166534' }}>{stats.passed}</div>
              <div className="stat-label">Passed</div>
            </div>
            <div className="stat-box" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
              <div className="stat-value" style={{ color: '#991b1b' }}>{stats.failed}</div>
              <div className="stat-label">Failed</div>
            </div>
          </div>

          {stats.failed > 0 && (
            <div className="alert alert-warning" style={{ fontSize: '0.85rem' }}>
              <AlertTriangle className="alert-icon" size={18} />
              <div>
                <strong>Adversarial Risks Detected:</strong> There are {stats.failed} failed technical assertions in this evaluation. Please review these risks under the "Report Summary" tab.
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Checklist
        </button>
        
        <button className="btn btn-primary" onClick={onNext}>
          Next: Preview Report <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
