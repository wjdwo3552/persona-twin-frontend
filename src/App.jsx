import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import StyleLearning from './pages/StyleLearning';
import DocumentGeneration from './pages/DocumentGeneration';

function Navigation() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-indigo-600">Persona Twin</span>
          </Link>

          {/* 메뉴 */}
          <div className="flex space-x-1">
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
              to="/learn"
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                isActive('/learn')
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              문체 학습
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
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/learn" element={<StyleLearning />} />
          <Route path="/generate" element={<DocumentGeneration />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
