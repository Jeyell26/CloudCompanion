import { useState, useEffect, useRef } from 'react';
import type { S3Object } from '../types';
import { getS3Buckets, getS3Objects, uploadS3ObjectSimulate } from '../api';
import { Folder, File, Upload, HardDrive, CheckCircle2 } from 'lucide-react';

export default function S3Panel() {
  const [buckets, setBuckets] = useState<string[]>([]);
  const [selectedBucket, setSelectedBucket] = useState('');
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadBuckets() {
      try {
        const list = await getS3Buckets();
        setBuckets(list);
        if (list.length > 0) {
          setSelectedBucket(list[0]);
        }
      } catch (err) {
        console.error('Failed to load S3 buckets', err);
      }
    }
    loadBuckets();
  }, []);

  async function loadObjects() {
    if (!selectedBucket) return;
    try {
      const list = await getS3Objects(selectedBucket);
      // Sort by modified date descending
      list.sort((a,b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
      setObjects(list);
    } catch (err) {
      console.error('Failed to load S3 objects', err);
    }
  }

  useEffect(() => {
    loadObjects();
  }, [selectedBucket]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBucket) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);

    // Simulate progress ticks
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 20;
      });
    }, 200);

    // Add to state
    await uploadS3ObjectSimulate(selectedBucket, file.name, file.size);
    
    setTimeout(async () => {
      clearInterval(interval);
      setUploadProgress(100);
      setIsUploading(false);
      setUploadSuccess(true);
      await loadObjects();
      setTimeout(() => setUploadSuccess(false), 3000);
    }, 1200);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Helper for human-readable file sizes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalSize = objects.reduce((sum, obj) => sum + obj.size, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card-header" style={{ marginBottom: 0 }}>
        <div className="card-title">
          <HardDrive size={18} style={{ color: 'var(--accent-purple)' }} />
          <span>Simple Storage Service (S3) Browser</span>
        </div>
      </div>

      <div className="grid-cols-2" style={{ gridTemplateColumns: '1fr 3fr' }}>
        {/* Bucket Select List */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Storage Buckets</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {buckets.map(b => {
              const isSelected = selectedBucket === b;
              return (
                <div
                  key={b}
                  onClick={() => setSelectedBucket(b)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                    border: '1px solid',
                    borderColor: isSelected ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    transition: 'all 0.2s'
                  }}
                >
                  <Folder size={16} style={{ color: isSelected ? 'var(--accent-purple)' : 'var(--text-muted)' }} />
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{b}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bucket Content View */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Uploader Zone */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={isUploading}
            />

            {!isUploading && !uploadSuccess && (
              <div className="upload-zone" onClick={triggerFileSelect}>
                <Upload size={32} style={{ color: 'var(--accent-purple)' }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: '14px' }}>Upload Simulation Portal</p>
                  <p className="upload-zone-text">Click to select files to store in <code>s3://{selectedBucket}</code></p>
                </div>
              </div>
            )}

            {isUploading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', padding: '16px' }}>
                <span className="spinner" style={{ width: '28px', height: '28px', borderWidth: '3px' }} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Syncing multipart object: {uploadProgress}%</span>
                <div style={{ width: '100%', maxWidth: '300px', height: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: 'var(--accent-purple)', width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}

            {uploadSuccess && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', color: 'var(--color-success)', padding: '16px' }}>
                <CheckCircle2 size={32} />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>File S3 upload simulated successfully!</span>
              </div>
            )}
          </div>

          {/* Files List Table */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Objects in bucket</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Total Size: <b>{formatBytes(totalSize)}</b> ({objects.length} files)
              </span>
            </div>

            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Key / Filename</th>
                    <th>Size</th>
                    <th>Last Modified</th>
                    <th style={{ textAlign: 'right' }}>Class</th>
                  </tr>
                </thead>
                <tbody>
                  {objects.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                        This S3 bucket is empty. Upload a file above.
                      </td>
                    </tr>
                  ) : (
                    objects.map(obj => (
                      <tr key={obj.key}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <File size={16} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                            <span style={{ fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{obj.key}</span>
                          </div>
                        </td>
                        <td>{formatBytes(obj.size)}</td>
                        <td>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {new Date(obj.lastModified).toLocaleString()}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="badge running" style={{ fontSize: '10px', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)' }}>
                            STANDARD
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
