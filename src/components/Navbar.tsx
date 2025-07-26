import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/agent', label: 'Agent' },
    { path: '/settings', label: 'Settings' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Project Cypher
          </Link>
          
          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`transition-colors duration-300 ${
                  location.pathname === item.path
                    ? 'text-blue-400'
                    : 'text-white hover:text-blue-400'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <a 
            href="http://localhost:4444" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-2 rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
          >
            Launch Agent
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
