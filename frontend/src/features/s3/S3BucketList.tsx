import { Folder } from 'lucide-react';
import './s3.css';

interface S3BucketListProps {
  buckets: string[];
  selectedBucket: string;
  onSelect: (bucket: string) => void;
}

export default function S3BucketList({ buckets, selectedBucket, onSelect }: S3BucketListProps) {
  return (
    <div className="glass-card s3-bucket-list-card">
      <h3 className="s3-bucket-list-title">Storage Buckets</h3>
      <div className="s3-bucket-list-items">
        {buckets.map(b => (
          <div
            key={b}
            className={`s3-bucket-item ${selectedBucket === b ? 'selected' : ''}`}
            onClick={() => onSelect(b)}
          >
            <Folder size={16} style={{ color: selectedBucket === b ? 'var(--accent-purple)' : 'var(--text-muted)', flexShrink: 0 }} />
            <span className="s3-bucket-item-name">{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
