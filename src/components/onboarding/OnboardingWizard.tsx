import React, { useState } from 'react';

interface OnboardingWizardProps {
  onComplete: (data: { geminiKey: string; privateKey: string; claudeKey?: string; xaiKey?: string; openAiKey?: string; openRouterKey?: string }) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [geminiKey, setGeminiKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [xaiKey, setXaiKey] = useState('');
  const [openAiKey, setOpenAiKey] = useState('');
  const [openRouterKey, setOpenRouterKey] = useState('');

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = () => {
    if (geminiKey && privateKey) {
      onComplete({ geminiKey, privateKey, claudeKey, xaiKey, openAiKey, openRouterKey });
    } else {
      alert('Please fill in the required fields (Gemini Key and Private Key).');
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
        <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '1rem' }}>
          <h2>Step 2: Required Keys</h2>
          <label>Google Gemini API Key (Required)</label>
          <input 
            type="password" 
            placeholder="Enter Gemini API Key" 
            value={geminiKey} 
            onChange={(e) => setGeminiKey(e.target.value)}
          />
          <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '1rem' }}>Get your key from Google AI Studio.</p>
          
          <label>Polygon Private Key (Required)</label>
          <input 
            type="password" 
            placeholder="Enter Private Key (0x...)" 
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
          />
          <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '1rem' }}>We recommend using a burner wallet for safety.</p>

          <h2>Optional API Keys</h2>
          <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Add keys for other providers to use their models in the Tuning panel.</p>

          <label>Anthropic API Key (Optional)</label>
          <input type="password" placeholder="sk-ant-..." value={claudeKey} onChange={e => setClaudeKey(e.target.value)} />

          <label>OpenAI API Key (Optional)</label>
          <input type="password" placeholder="sk-proj-..." value={openAiKey} onChange={e => setOpenAiKey(e.target.value)} />

          <label>xAI (Grok) API Key (Optional)</label>
          <input type="password" placeholder="xai-..." value={xaiKey} onChange={e => setXaiKey(e.target.value)} />

          <label>OpenRouter API Key (Optional)</label>
          <input type="password" placeholder="sk-or-v1-..." value={openRouterKey} onChange={e => setOpenRouterKey(e.target.value)} />
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
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
