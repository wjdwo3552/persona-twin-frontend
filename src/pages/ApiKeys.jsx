import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

function ApiKeys() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.userId;
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [expirationDays, setExpirationDays] = useState(90);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const toast = useToast();

  const fetchApiKeys = async () => {
    setLoading(true);
    try {
      const response = await api.get('/keys');
      setApiKeys(response.data.data || []);
    } catch (error) {
      toast.error('API Key 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchApiKeys();
    }
  }, [userId]);

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('API Key 이름을 입력해주세요.');
      return;
    }

    setCreating(true);
    try {
      const response = await api.post('/keys', {
        name: newKeyName,
        expirationDays: expirationDays > 0 ? expirationDays : null
      });

      setNewlyCreatedKey(response.data.data?.keyValue);
      setShowCreateModal(false);
      setNewKeyName('');
      setExpirationDays(90);
      fetchApiKeys();
      toast.success('API Key가 생성되었습니다.');
    } catch (error) {
      const message = error.response?.data?.message || 'API Key 생성에 실패했습니다.';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (keyId) => {
    try {
      await api.delete(`/keys/${keyId}`);
      fetchApiKeys();
      toast.success('API Key가 삭제되었습니다.');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error('API Key 삭제에 실패했습니다.');
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('클립보드에 복사되었습니다.');
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">API Key 관리</h1>
          <p className="text-gray-600">외부 서비스 연동을 위한 API Key를 관리합니다.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 API Key
        </button>
      </div>

      {/* 새로 생성된 키 알림 */}
      {newlyCreatedKey && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-green-800 mb-2">API Key가 생성되었습니다!</p>
              <p className="text-sm text-green-700 mb-3">이 키는 다시 표시되지 않습니다. 안전한 곳에 저장해주세요.</p>
              <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-green-200">
                <code className="flex-1 text-sm font-mono text-gray-800 break-all">{newlyCreatedKey}</code>
                <button
                  onClick={() => copyToClipboard(newlyCreatedKey)}
                  className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors flex-shrink-0"
                  title="복사"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              className="text-green-600 hover:text-green-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* API Key 목록 */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="space-y-3 flex-1">
                  <div className="h-5 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <p className="text-gray-600 text-lg mb-2">아직 API Key가 없습니다</p>
          <p className="text-gray-400 text-sm mb-6">외부 서비스 연동을 위해 API Key를 생성해주세요</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            API Key 생성하기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className={`bg-white rounded-xl shadow-lg p-6 ${
                !key.isActive || isExpired(key.expiresAt) ? 'opacity-60' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-800">{key.name}</h3>
                    {!key.isActive ? (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">비활성</span>
                    ) : isExpired(key.expiresAt) ? (
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">만료됨</span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-600 rounded-full">활성</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 font-mono mb-3">{key.maskedKey}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                    <span>생성: {formatDate(key.createdAt)}</span>
                    {key.expiresAt && <span>만료: {formatDate(key.expiresAt)}</span>}
                    {key.lastUsedAt && <span>마지막 사용: {formatDate(key.lastUsedAt)}</span>}
                  </div>
                </div>
                <button
                  onClick={() => setDeleteConfirm(key.id)}
                  className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 사용 안내 */}
      <div className="mt-8 bg-indigo-50 rounded-xl p-6">
        <h3 className="font-semibold text-indigo-800 mb-3">API Key 사용 방법</h3>
        <div className="space-y-2 text-sm text-indigo-700">
          <p>HTTP 요청 헤더에 다음과 같이 추가하세요:</p>
          <code className="block bg-white p-3 rounded-lg font-mono text-xs">
            X-API-Key: docai_xxxxx...
          </code>
          <p className="mt-3">사용 가능한 엔드포인트:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>POST /api/v1/generate - 문서 생성</li>
            <li>POST /api/v1/upload - 파일 업로드</li>
            <li>POST /api/v1/summarize - 텍스트 요약</li>
          </ul>
        </div>
      </div>

      {/* 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">새 API Key 생성</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="예: n8n 연동용"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  만료 기간
                </label>
                <select
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value={30}>30일</option>
                  <option value={90}>90일</option>
                  <option value={180}>180일</option>
                  <option value={365}>1년</option>
                  <option value={0}>만료 없음</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewKeyName('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreateKey}
                disabled={creating}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {creating ? '생성 중...' : '생성'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">API Key 삭제</h2>
            <p className="text-gray-600 mb-6">이 API Key를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleDeleteKey(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApiKeys;
