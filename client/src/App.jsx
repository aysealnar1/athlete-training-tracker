import { createBrowserRouter, createRoutesFromElements, RouterProvider, Outlet, Route } from 'react-router-dom';
import RequireAuth from './components/RequireAuth';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import AthleteDetail from './pages/AthleteDetail';
import Training from './pages/Training';

const router = createBrowserRouter(createRoutesFromElements(
  <Route element={<div className="app"><Outlet /></div>}>
    <Route path="/" element={<Welcome />} />
    <Route element={<RequireAuth />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/athlete/:id" element={<AthleteDetail />} />
      <Route path="/athlete/:athleteId/training/new" element={<Training />} />
      <Route path="/athlete/:athleteId/training/:trainingId" element={<Training />} />
    </Route>
  </Route>
));

export default function App() {
  return <RouterProvider router={router} />;
}
