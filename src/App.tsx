import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import IntroPage from './pages/IntroPage';
import Dashboard from './pages/Dashboard';
import AgentUI from './pages/AgentUI';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <div className="bg-black text-white min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<IntroPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/agent" element={<AgentUI />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
