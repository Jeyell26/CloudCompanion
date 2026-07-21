// Lambda feature API — function listing and invocation.

import type { LambdaFunction } from '../../../types';
import { request } from '../../../api/client';
import { mockStore } from '../../../api/mock-store';

export async function getLambdas(): Promise<LambdaFunction[]> {
  try {
    return await request<LambdaFunction[]>('/aws/lambda');
  } catch {
    return [...mockStore.lambda];
  }
}

export async function invokeLambda(
  functionName: string,
  payload: unknown
): Promise<{ success: boolean; logs: string; payload: unknown }> {
  try {
    return await request<{ success: boolean; logs: string; payload: unknown }>('/aws/lambda/invoke', {
      method: 'POST',
      body: JSON.stringify({ functionName, payload })
    });
  } catch {
    const func = mockStore.lambda.find(f => f.name === functionName);
    if (func) {
      func.invocations += 1;
      if (Math.random() < 0.05) func.errors += 1;
    }

    const reqId = 'req-' + Math.random().toString(36).substr(2, 9) + '-' + Math.random().toString(36).substr(2, 4);
    const start = Date.now();
    const mockLogs = `START RequestId: ${reqId} Version: $LATEST
2026-07-10T10:52:00Z\t${reqId}\tINFO\tExecuting function handler for ${functionName}...
2026-07-10T10:52:01Z\t${reqId}\tINFO\tParsing event payload: ${JSON.stringify(payload)}
2026-07-10T10:52:01Z\t${reqId}\tINFO\tDatabase connection established successfully.
2026-07-10T10:52:02Z\t${reqId}\tINFO\tOperation completed, payload processed.
END RequestId: ${reqId}
REPORT RequestId: ${reqId}\tDuration: ${func ? func.duration : 120} ms\tBilled Duration: ${Math.ceil((func ? func.duration : 120) / 100) * 100} ms\tMemory Size: ${func ? func.memory : 256} MB\tMax Memory Used: 74 MB`;

    return {
      success: true,
      logs: mockLogs,
      payload: {
        statusCode: 200,
        body: JSON.stringify({ message: `Function ${functionName} executed successfully`, timestamp: start })
      }
    };
  }
}
