// Integrations feature API — API Gateway and IoT broker status.

import type { IntegrationStatus } from '../../../types';
import { request } from '../../../api/client';
import { mockStore } from '../../../api/mock-store';

export async function getIntegrationStatus(): Promise<IntegrationStatus> {
  try {
    return await request<IntegrationStatus>('/aws/integrations/status');
  } catch {
    // Simulate small fluctuations for a dynamic dashboard feel
    const deltaReq = Math.floor(Math.random() * 5) + 1;
    mockStore.integrations.apiGateway.requestCount += deltaReq;
    mockStore.integrations.iot.messagesReceived += Math.floor(Math.random() * 8) + 1;
    if (Math.random() < 0.1) {
      mockStore.integrations.iot.connections = Math.max(
        1,
        mockStore.integrations.iot.connections + (Math.random() > 0.5 ? 1 : -1)
      );
    }
    return { ...mockStore.integrations };
  }
}
