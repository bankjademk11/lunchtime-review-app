import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import MealDisplay from './components/MealDisplay';
import AddMealForm from './components/AddMealForm';
import MenuRequestForm from './components/MenuRequestForm';
import MenuRequestList from './components/MenuRequestList';
import MealList from './components/MealList';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
// import './App.css';

// แดชบอร์ดผู้ดูแล
const AdminDashboard: React.FC<{ 
  refreshTrigger: number;
  menuRequestRefreshTrigger: number;
  handleMealAdded: () => void;
  handleMenuRequestSubmitted: () => void;
  handleMealDeleted: () => void;
  userId: string | null;
}> = ({ refreshTrigger, menuRequestRefreshTrigger, handleMealAdded, handleMenuRequestSubmitted, handleMealDeleted, userId }) => {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-10 bg-white rounded-lg shadow-xl mt-8">
      <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-800 mb-8 sm:mb-10 text-center tracking-tight">Admin Dashboard</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-1 space-y-8 sm:space-y-10 p-6 bg-gray-50 rounded-lg shadow-inner">
          <AddMealForm onMealAdded={handleMealAdded} />
          <MenuRequestForm onMenuRequestSubmitted={handleMenuRequestSubmitted} />
        </div>
        <div className="lg:col-span-2 space-y-8 sm:space-y-10 p-6 bg-gray-50 rounded-lg shadow-inner">
          <MealList refreshTrigger={refreshTrigger} onMealDeleted={handleMealDeleted} />
          <MenuRequestList refreshTrigger={menuRequestRefreshTrigger} />
        </div>
      </div>
    </div>
  );
};

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [menuRequestRefreshTrigger, setMenuRequestRefreshTrigger] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [userId, _setUserId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    if (storedToken) {
      setToken(storedToken);
    }
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  const handleLogin = (newToken: string, newUserId: string) => {
    setToken(newToken);
    setUserId(newUserId);
    localStorage.setItem('token', newToken);
    localStorage.setItem('userId', newUserId);
  };

  const handleLogout = () => {
    setToken(null);
    setUserId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
  };

  const handleMealAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleMealDeleted = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleMenuRequestSubmitted = () => {
    setMenuRequestRefreshTrigger(prev => prev + 1);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 font-lao antialiased text-gray-800">
        <nav className="bg-white shadow-md sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold text-primary tracking-tight">
              Lunchtime Review
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 text-lg font-medium">
                Employee View
              </Link>
              {token ? (
                <>
                  <Link to="/admin" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 text-lg font-medium">
                    Admin View
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-5 rounded-lg transition-colors duration-300 shadow-md"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/register" className="text-blue-600 hover:text-blue-700 transition-colors duration-300 text-lg font-medium">
                    Register
                  </Link>
                  <Link
                    to="/login"
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-5 rounded-lg transition-colors duration-300 shadow-md"
                  >
                    Login
                  </Link>
                </>
              )}
            </div>
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 hover:text-blue-600 focus:outline-none focus:text-blue-600">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white py-4 shadow-inner">
              <div className="flex flex-col items-center space-y-4">
                <Link to="/" className="block text-gray-700 hover:text-blue-600 transition-colors duration-300 text-lg font-medium py-2" onClick={() => setIsMobileMenuOpen(false)}>
                  Employee View
                </Link>
                {token ? (
                  <>
                    <Link to="/admin" className="block text-gray-700 hover:text-blue-600 transition-colors duration-300 text-lg font-medium py-2" onClick={() => setIsMobileMenuOpen(false)}>
                      Admin View
                    </Link>
                    <button
                      onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                      className="w-full max-w-xs bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-5 rounded-lg transition-colors duration-300 shadow-md"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/register" className="block text-blue-600 hover:text-blue-700 transition-colors duration-300 text-lg font-medium py-2" onClick={() => setIsMobileMenuOpen(false)}>
                      Register
                    </Link>
                    <Link
                      to="/login"
                      className="w-full max-w-xs bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-5 rounded-lg transition-colors duration-300 shadow-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>

        <main className="container mx-auto px-4 py-8 md:py-12">
          <Routes>
            <Route
              path="/" 
              element={
                token ? <MealDisplay refreshTrigger={refreshTrigger} userId={userId} /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/admin"
              element={
                token ? (
                  <AdminDashboard
                    refreshTrigger={refreshTrigger}
                    menuRequestRefreshTrigger={menuRequestRefreshTrigger}
                    handleMealAdded={handleMealAdded}
                    handleMenuRequestSubmitted={handleMenuRequestSubmitted}
                    handleMealDeleted={handleMealDeleted}
                    userId={userId}
                  />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route path="/register" element={<RegisterForm onRegisterSuccess={handleLogin} />} />
            <Route path="/login" element={<LoginForm onLoginSuccess={handleLogin} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
