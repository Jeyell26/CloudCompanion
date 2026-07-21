import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../features/dashboard/dashboard.tsx';
import EC2 from '../features/ec2/ec2.tsx';
import Lambda from '../features/lambda/lambda.tsx';
import CloudWatch from '../features/cloudwatch/cloudwatch.tsx';
import S3 from '../features/s3/s3.tsx';
import Integrations from '../features/integrations/integrations.tsx';
import Secrets from '../features/secrets/Secrets.tsx';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/ec2" element={<EC2 />} />
      <Route path="/lambda" element={<Lambda />} />
      <Route path="/cloudwatch" element={<CloudWatch />} />
      <Route path="/s3" element={<S3 />} />
      <Route path="/integrations" element={<Integrations />} />
      <Route path="/secrets" element={<Secrets />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
