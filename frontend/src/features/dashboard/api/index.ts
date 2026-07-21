// Dashboard feature API — aggregates data from EC2, Lambda, and Integrations.
// Re-exports from each feature's own API to avoid duplicating logic.

export { getEC2Instances } from '../ec2/api';
export { getLambdas } from '../lambda/api';
export { getIntegrationStatus } from '../integrations/api';
