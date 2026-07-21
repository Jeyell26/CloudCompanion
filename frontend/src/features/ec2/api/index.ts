// EC2 feature API — instance listing and start/stop actions.

import type { EC2Instance } from '../../../types';
import { request } from '../../../api/client';
import { mockStore } from '../../../api/mock-store';

export async function getEC2Instances(): Promise<EC2Instance[]> {
  try {
    return await request<EC2Instance[]>('/aws/ec2');
  } catch {
    // Simulate minor CPU fluctuation for running instances
    mockStore.ec2 = mockStore.ec2.map(inst => {
      if (inst.status === 'running') {
        const delta = (Math.random() - 0.5) * 4;
        const newCpu = Math.max(1, Math.min(99, Number((inst.cpu + delta).toFixed(1))));
        return { ...inst, cpu: newCpu };
      }
      return inst;
    });
    return [...mockStore.ec2];
  }
}

export async function triggerEC2Action(
  instanceId: string,
  action: 'start' | 'stop'
): Promise<{ success: boolean; status: string }> {
  try {
    return await request<{ success: boolean; status: string }>('/aws/ec2/action', {
      method: 'POST',
      body: JSON.stringify({ instanceId, action })
    });
  } catch {
    const target = mockStore.ec2.find(i => i.id === instanceId);
    if (!target) throw new Error('Instance not found');

    if (action === 'start') {
      target.status = 'pending';
      setTimeout(() => {
        if (target.status === 'pending') {
          target.status = 'running';
          target.cpu = 5.0;
        }
      }, 4000);
    } else {
      target.status = 'stopping';
      setTimeout(() => {
        if (target.status === 'stopping') {
          target.status = 'stopped';
          target.cpu = 0;
        }
      }, 4000);
    }
    return { success: true, status: target.status };
  }
}
