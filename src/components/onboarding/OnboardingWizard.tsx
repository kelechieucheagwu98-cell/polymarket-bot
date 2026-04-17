import React, { useState } from 'react';

interface OnboardingWizardProps {
  onComplete: (data: { geminiKey: string; privateKey: string }) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [geminiKey, setGeminiKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = () => {
    if (geminiKey && privateKey) {
      onComplete({ geminiKey, privateKey });
    } else {
      alert('Please fill in all fields.');
    }
  };

  return (
    <div className="glass fade-in" style={{ maxWidth: '500px', margin: '100px auto' }}>
      {step === 1 && (
        <div>
          <h2>Step 1: Welcome</h2>
          <p>Welcome to the Polymarket AI Agent. This tool uses Gemini AI to analyze markets and execute trades on your behalf.</p>
          <p><strong>Note:</strong> Your credentials are stored only in your browser session for security.</p>
          <button className="primary" onClick={nextStep}>Get Started</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Step 2: API Keys</h2>
          <label>Google Gemini API Key</label>
          <input 
            type="password" 
            placeholder="Enter Gemini API Key" 
            value={geminiKey} 
            onChange={(e) => setGeminiKey(e.target.value)}
          />
          <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Get your key from Google AI Studio.</p>
          
          <label>Polygon Private Key</label>
          <input 
            type="password" 
            placeholder="Enter Private Key (0x...)" 
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
          />
          <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>We recommend using a burner wallet for safety.</p>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={prevStep}>Back</button>
            <button className="primary" onClick={nextStep}>Next</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2>Step 3: Tutorial</h2>
          <p><strong>Straight Reasoning:</strong> The AI will explain its logic in the "Brain Feed" during every operation.</p>
          <p><strong>Tuning:</strong> Use the "Aggressiveness" slider to control how frequent and large the trades are.</p>
          <p><strong>Panic:</strong> If things look wrong, use the red "Panic" button to kill all open orders.</p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={prevStep}>Back</button>
            <button className="primary" onClick={handleSubmit}>Finish & Start Trading</button>
          </div>
        </div>
      )}
    </div>
  );
};
