import type { S3Object } from '../../types';
import { File } from 'lucide-react';
import './s3.css';

interface S3ObjectsTableProps {
  objects: S3Object[];
  totalSize: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function S3ObjectsTable({ objects, totalSize }: S3ObjectsTableProps) {
  return (
    <div className="glass-card s3-objects-card">
      <div className="s3-objects-card-header">
        <span className="s3-objects-card-title">Objects in bucket</span>
        <span className="s3-objects-card-summary">
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
              <th className="align-right">Class</th>
            </tr>
          </thead>
          <tbody>
            {objects.length === 0 ? (
              <tr>
                <td colSpan={4} className="s3-empty-state">
                  This S3 bucket is empty. Upload a file above.
                </td>
              </tr>
            ) : (
              objects.map(obj => (
                <tr key={obj.key}>
                  <td>
                    <div className="s3-file-name-cell">
                      <File size={16} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                      <span className="s3-file-name-text">{obj.key}</span>
                    </div>
                  </td>
                  <td>{formatBytes(obj.size)}</td>
                  <td>
                    <span className="s3-date-cell">
                      {new Date(obj.lastModified).toLocaleString()}
                    </span>
                  </td>
                  <td className="align-right">
                    <span className="badge running s3-storage-class-badge">STANDARD</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
