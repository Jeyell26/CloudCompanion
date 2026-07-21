import { BrowserRouter } from 'react-router-dom';
import DashboardLayout from './features/dashboard/dashboard.tsx';

function App() {
  return (
    <BrowserRouter>
      <DashboardLayout />
    </BrowserRouter>
  );
}

export default App;
