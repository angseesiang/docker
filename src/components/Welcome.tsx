import React from 'react';
import { ArrowRight, BookOpen, Shield, Award, HelpCircle } from 'lucide-react';

interface WelcomeProps {
  onStart: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onStart }) => {
  const principles = [
    "Transparency",
    "Explainability",
    "Repeatability / Reproducibility",
    "Safety",
    "Security",
    "Robustness",
    "Fairness",
    "Data Governance",
    "Accountability",
    "Human Agency and Oversight",
    "Inclusive Growth, Societal and Environmental Well-being"
  ];

  return (
    <div className="glass-panel" style={{ animation: 'fadeIn 0.5s ease' }}>
      <div className="welcome-grid">
        <div className="welcome-info-section">
          <h1 style={{ marginBottom: '0.5rem' }}>AI Verify Testing Framework</h1>
          <p className="app-subtitle" style={{ fontSize: '1.1rem', marginBottom: '2rem', color: 'var(--primary)' }}>
            Process Checks Tool for Generative AI Applications
          </p>
          
          <p style={{ fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            This tool helps you assess and document the responsible AI practices that you have implemented in deploying your Generative AI application, and generates a business-ready summary report.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="principle-number" style={{ background: '#f3e8ff' }}><Award size={16} /></div>
              <div>
                <strong style={{ color: 'var(--text-main)' }}>Demonstrate Compliance:</strong>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Validate your implementation of responsible AI practices to build trust with customers and stakeholders.</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="principle-number" style={{ background: '#f3e8ff' }}><Shield size={16} /></div>
              <div>
                <strong style={{ color: 'var(--text-main)' }}>Audit Readiness:</strong>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Perfect for application owners, internal compliance teams, and external auditors seeking validation.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="principle-number" style={{ background: '#f3e8ff' }}><BookOpen size={16} /></div>
              <div>
                <strong style={{ color: 'var(--text-main)' }}>Mapped to Global Standards:</strong>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Directly cross-referenced with US NIST AI RMF, ISO/IEC 42001, and the G7 Hiroshima Process Code of Conduct.</p>
              </div>
            </div>
          </div>

          <button className="btn btn-primary" onClick={onStart} style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
            Get Started <ArrowRight size={18} />
          </button>
        </div>

        <div className="welcome-image-container">
          <img 
            src="/assets/images/welcome_image.png" 
            alt="AI Verify Process Checks Welcome" 
            className="welcome-img"
            onError={(e) => {
              // Fallback image source if assets aren't fully loaded
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop";
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: '3.5rem', paddingTop: '2.5rem', borderTop: '1px solid #e5e7eb' }}>
        <h3 style={{ marginBottom: '1.25rem' }}>Responsible AI Principles Covered</h3>
        <div className="principles-list-grid">
          {principles.map((p, idx) => (
            <div key={idx} className="principle-card-mini">
              <span className="principle-number">{idx + 1}</span>
              <span className="sidebar-item-label" title={p}>{p}</span>
            </div>
          ))}
        </div>

        <div className="alert alert-info" style={{ marginTop: '2rem' }}>
          <HelpCircle className="alert-icon" size={20} />
          <div>
            <strong>Mapped Frameworks:</strong> AI Verify processes mapped to international standards are marked with color badges:
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
              <span className="crosswalk-badge blue">US NIST AI RMF</span>
              <span className="crosswalk-badge green">ISO 42001</span>
              <span className="crosswalk-badge violet">Hiroshima Process CoC</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
