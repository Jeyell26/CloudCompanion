import { useState, useEffect } from 'react';
import type { S3Object } from '../../types';
import { getS3Buckets, getS3Objects, uploadS3ObjectSimulate } from './api';
import { HardDrive } from 'lucide-react';
import S3BucketList from './components/S3BucketList';
import S3Uploader from './components/S3Uploader';
import S3ObjectsTable from './components/S3ObjectsTable';
import './s3.css';

export default function S3() {
  const [buckets, setBuckets] = useState<string[]>([]);
  const [selectedBucket, setSelectedBucket] = useState('');
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    async function loadBuckets() {
      try {
        const list = await getS3Buckets();
        setBuckets(list);
        if (list.length > 0) setSelectedBucket(list[0]);
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
      list.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
      setObjects(list);
    } catch (err) {
      console.error('Failed to load S3 objects', err);
    }
  }

  useEffect(() => { loadObjects(); }, [selectedBucket]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBucket) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + 20;
      });
    }, 200);

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

  const totalSize = objects.reduce((sum, obj) => sum + obj.size, 0);

  return (
    <div className="s3-container">
      <div className="card-header margin-bottom-0">
        <div className="card-title">
          <HardDrive size={18} style={{ color: 'var(--accent-purple)' }} />
          <span>Simple Storage Service (S3) Browser</span>
        </div>
      </div>

      <div className="s3-layout-grid">
        <S3BucketList
          buckets={buckets}
          selectedBucket={selectedBucket}
          onSelect={setSelectedBucket}
        />

        <div className="s3-content-area">
          <S3Uploader
            selectedBucket={selectedBucket}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            uploadSuccess={uploadSuccess}
            onFileChange={handleFileUpload}
          />
          <S3ObjectsTable objects={objects} totalSize={totalSize} />
        </div>
      </div>
    </div>
  );
}
