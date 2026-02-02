import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import DocumentList from './pages/DocumentList';
import DocumentGeneration from './pages/DocumentGeneration';
import Login from './pages/Login';
import Register from './pages/Register';

function Navigation() {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [location]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // 로그인/회원가입 페이지에서는 네비게이션 숨김
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-indigo-600">Persona Twin</span>
          </Link>

          {/* 메뉴 */}
          <div className="flex items-center space-x-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                isActive('/')
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              문서 업로드
            </Link>
            <Link
              to="/documents"
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                isActive('/documents')
                  ? 'bg-cyan-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              문서 관리
            </Link>
            <Link
              to="/generate"
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                isActive('/generate')
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              문서 생성
            </Link>

            {/* 사용자 정보 & 로그아웃 */}
            {user && (
              <div className="flex items-center ml-4 pl-4 border-l border-gray-300">
                <span className="text-sm text-gray-600 mr-3">{user.username}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-all"
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// 인증 필요한 라우트 래퍼
function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/documents" element={<PrivateRoute><DocumentList /></PrivateRoute>} />
          <Route path="/generate" element={<PrivateRoute><DocumentGeneration /></PrivateRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
