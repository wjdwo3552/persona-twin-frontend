import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import DocumentList from './pages/DocumentList';
import DocumentGeneration from './pages/DocumentGeneration';
import Login from './pages/Login';
import Register from './pages/Register';
import { ToastProvider } from './context/ToastContext';

function Navigation() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [location]);

  // 페이지 이동 시 모바일 메뉴 닫기
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
            <span className="text-xl sm:text-2xl font-bold text-indigo-600">Persona Twin</span>
          </Link>

          {/* 데스크톱 메뉴 */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                isActive('/')
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              업로드
            </Link>
            <Link
              to="/documents"
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                isActive('/documents')
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              관리
            </Link>
            <Link
              to="/generate"
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                isActive('/generate')
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              생성
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

          {/* 모바일 햄버거 버튼 */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* 모바일 메뉴 */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-2">
              <Link
                to="/"
                className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                  isActive('/')
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                문서 업로드
              </Link>
              <Link
                to="/documents"
                className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                  isActive('/documents')
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                문서 관리
              </Link>
              <Link
                to="/generate"
                className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                  isActive('/generate')
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                문서 생성
              </Link>
              {user && (
                <div className="pt-2 mt-2 border-t border-gray-200 flex items-center justify-between px-4">
                  <span className="text-sm text-gray-600">{user.username}</span>
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
        )}
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
      <ToastProvider>
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
      </ToastProvider>
    </Router>
  );
}

export default App;
