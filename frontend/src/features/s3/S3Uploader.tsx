import { useRef } from 'react';
import { Upload, CheckCircle2 } from 'lucide-react';
import './s3.css';

interface S3UploaderProps {
  selectedBucket: string;
  isUploading: boolean;
  uploadProgress: number;
  uploadSuccess: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function S3Uploader({
  selectedBucket,
  isUploading,
  uploadProgress,
  uploadSuccess,
  onFileChange
}: S3UploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="glass-card s3-upload-card">
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        style={{ display: 'none' }}
        disabled={isUploading}
      />

      {!isUploading && !uploadSuccess && (
        <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
          <Upload size={32} style={{ color: 'var(--accent-purple)' }} />
          <div>
            <p style={{ fontWeight: 600, fontSize: '14px' }}>Upload Simulation Portal</p>
            <p className="upload-zone-text">
              Click to select files to store in <code>s3://{selectedBucket}</code>
            </p>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="s3-uploading-wrapper">
          <span className="spinner" style={{ width: '28px', height: '28px', borderWidth: '3px' }} />
          <span className="s3-uploading-text">Syncing multipart object: {uploadProgress}%</span>
          <div className="s3-upload-progress-bg">
            <div className="s3-upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {uploadSuccess && (
        <div className="s3-upload-success-wrapper">
          <CheckCircle2 size={32} />
          <span className="s3-upload-success-text">File S3 upload simulated successfully!</span>
        </div>
      )}
    </div>
  );
}
