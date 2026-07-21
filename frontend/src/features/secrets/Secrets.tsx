import { useState, useEffect } from 'react';
import type { SecretMetadata } from '../../types';
import { getSecretsMetadata, getSecretValue } from '../../api';
import { Shield, Eye, EyeOff, Loader2, Copy, Check, Lock } from 'lucide-react';

function SecretsPanel() {
  const [secrets, setSecrets] = useState<SecretMetadata[]>([]);
  const [revealedSecretName, setRevealedSecretName] = useState<string | null>(null);
  const [secretValue, setSecretValue] = useState<string>('');
  const [isLoadingValue, setIsLoadingValue] = useState(false);
  const [copiedName, setCopiedName] = useState<string | null>(null);

  useEffect(() => {
    async function loadSecrets() {
      try {
        const metadata = await getSecretsMetadata();
        setSecrets(metadata);
      } catch (err) {
        console.error('Failed to load secrets metadata', err);
      }
    }
    loadSecrets();
  }, []);

  const handleReveal = async (name: string) => {
    if (revealedSecretName === name) {
      // Toggle close
      setRevealedSecretName(null);
      setSecretValue('');
      return;
    }

    setIsLoadingValue(true);
    setRevealedSecretName(name);
    setSecretValue('');

    try {
      // Simulate KMS key decryption time
      const val = await getSecretValue(name);
      setTimeout(() => {
        setSecretValue(val);
        setIsLoadingValue(false);
      }, 800);
    } catch (err) {
      setSecretValue('Decryption failed: ' + (err as Error).message);
      setIsLoadingValue(false);
    }
  };

  const handleCopy = (text: string, name: string) => {
    navigator.clipboard.writeText(text);
    setCopiedName(name);
    setTimeout(() => setCopiedName(null), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card-header" style={{ marginBottom: 0 }}>
        <div className="card-title">
          <Shield size={18} style={{ color: 'var(--accent-purple)' }} />
          <span>AWS Secrets Manager Portal</span>
        </div>
      </div>

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={16} style={{ color: 'var(--color-warning)' }} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Decryption Key: KMS Master Key (Default)</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {secrets.map(sec => {
            const isRevealed = revealedSecretName === sec.name;
            const isCopied = copiedName === sec.name;
            return (
              <div key={sec.name} className="secret-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div className="secret-info">
                    <span className="secret-name">{sec.name}</span>
                    <span className="secret-desc">{sec.description}</span>
                  </div>

                  <button
                    onClick={() => handleReveal(sec.name)}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '130px', justifyContent: 'center' }}
                  >
                    {isRevealed ? (
                      <>
                        <EyeOff size={13} />
                        <span>Hide Secret</span>
                      </>
                    ) : (
                      <>
                        <Eye size={13} />
                        <span>Reveal Value</span>
                      </>
                    )}
                  </button>
                </div>

                {isRevealed && (
                  <div style={{ marginTop: '12px' }}>
                    {isLoadingValue ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <Loader2 size={14} className="spinner" />
                        <span>Contacting KMS KMS_KEY_ID: decrypting ciphertext blob...</span>
                      </div>
                    ) : (
                      <div className="secret-value-box">
                        <span style={{ flexGrow: 1, paddingRight: '12px' }}>{secretValue}</span>
                        <button
                          onClick={() => handleCopy(secretValue, sec.name)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', minWidth: 'auto' }}
                          title="Copy to clipboard"
                        >
                          {isCopied ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', background: 'rgba(245, 158, 11, 0.05)', border: '1px dashed rgba(245,158,11,0.2)', borderRadius: '8px', padding: '16px', fontSize: '13px', color: 'var(--color-warning)' }}>
        <Shield size={24} style={{ flexShrink: 0 }} />
        <div>
          <p style={{ fontWeight: 600, marginBottom: '2px' }}>Audit log active for KMS Decrypt actions</p>
          <p>Every single retrieval or decryption API query made to Secrets Manager is logged permanently under CloudTrail for administrative security compliance audits.</p>
        </div>
      </div>
    </div>
  );
}

export default SecretsPanel;
