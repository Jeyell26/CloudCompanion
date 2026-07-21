import { useState, useEffect } from 'react';
import type { EC2Instance } from '../../types';
import { getEC2Instances, triggerEC2Action } from './api';
import { Server, RefreshCw } from 'lucide-react';
import EC2List from './components/EC2List';
import EC2Inspector from './components/EC2Inspector';
import './ec2.css';

export default function EC2() {
  const [instances, setInstances] = useState<EC2Instance[]>([]);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function fetchInstances() {
    try {
      const data = await getEC2Instances();
      setInstances(data);
    } catch (err) {
      console.error('Failed to load EC2 instances', err);
    }
  }

  useEffect(() => {
    fetchInstances();
    const interval = setInterval(fetchInstances, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: string, action: 'start' | 'stop') => {
    setLoadingMap(prev => ({ ...prev, [id]: true }));
    try {
      await triggerEC2Action(id, action);
      setTimeout(fetchInstances, 500);
    } catch (err) {
      alert('Error triggering EC2 action: ' + (err as Error).message);
    } finally {
      setLoadingMap(prev => ({ ...prev, [id]: false }));
    }
  };

  const manualRefresh = async () => {
    setIsRefreshing(true);
    await fetchInstances();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const selectedInstance = instances.find(i => i.id === selectedId) || instances[0];

  return (
    <div className="ec2-container">
      <div className="card-header margin-bottom-0">
        <div className="card-title">
          <Server size={18} style={{ color: 'var(--accent-purple)' }} />
          <span>Elastic Compute Cloud (EC2) Instances</span>
        </div>
        <button
          onClick={manualRefresh}
          className="btn btn-secondary btn-sm flex-align-center-gap-6"
          disabled={isRefreshing}
        >
          <RefreshCw size={12} className={isRefreshing ? 'spinner' : ''} />
          <span>Sync</span>
        </button>
      </div>

      <div className="ec2-layout-grid">
        <EC2List
          instances={instances}
          selectedId={selectedId}
          onSelect={setSelectedId}
          loadingMap={loadingMap}
          onAction={handleAction}
        />
        <EC2Inspector 
          selectedInstance={selectedInstance} 
        />
      </div>
    </div>
  );
}
