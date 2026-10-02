import { createBrowserRouter, createRoutesFromElements, RouterProvider, Outlet, Route } from 'react-router-dom';
import RequireAuth from './components/RequireAuth';
import Welcome from './pages/Welcome';
const loadDashboard = async () => ({ Component: (await import('./pages/Dashboard')).default });
const loadAthleteDetail = async () => ({ Component: (await import('./pages/AthleteDetail')).default });
const loadTraining = async () => ({ Component: (await import('./pages/Training')).default });

const router = createBrowserRouter(createRoutesFromElements(
  <Route element={<div className="app"><Outlet /></div>}>
    <Route path="/" element={<Welcome />} />
    <Route element={<RequireAuth />}>
      <Route path="/dashboard" lazy={loadDashboard} />
      <Route path="/athlete/:id" lazy={loadAthleteDetail} />
      <Route path="/athlete/:athleteId/training/new" lazy={loadTraining} />
      <Route path="/athlete/:athleteId/training/:trainingId" lazy={loadTraining} />
    </Route>
  </Route>
));

export default function App() {
  return <RouterProvider router={router} />;
}
