import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

function TokenUsage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.userId;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (userId) {
      fetchStats();
    }
  }, [userId]);

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/token-usage/stats/${userId}`);
      setStats(response.data);
    } catch (error) {
      toast.error('토큰 사용량을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 숫자 포맷팅
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString();
  };

  // 토큰을 예상 비용(원)으로 변환 (GPT-4o 기준 대략 1000토큰 = 7원)
  const tokenToCost = (tokens) => {
    if (!tokens) return '0';
    const cost = (tokens / 1000) * 7;
    if (cost < 1) return '1원 미만';
    return `약 ${Math.round(cost).toLocaleString()}원`;
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 작업 타입 한글화
  const getOperationLabel = (type) => {
    const labels = {
      'GENERATION': '문서 생성',
      'SUMMARIZATION': '문서 요약'
    };
    return labels[type] || type;
  };

  // 작업 타입 색상
  const getOperationColor = (type) => {
    const colors = {
      'GENERATION': 'bg-green-100 text-green-800',
      'SUMMARIZATION': 'bg-blue-100 text-blue-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">토큰 사용량</h1>
        <p className="text-gray-600">GPT API 토큰 사용 현황을 확인할 수 있습니다.</p>
      </div>

      {loading ? (
        // 로딩 스켈레톤
        <div className="space-y-6 animate-pulse">
          {/* 통계 카드 스켈레톤 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-8 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-10"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>

          {/* 작업 타입별 스켈레톤 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                  <div className="h-5 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>

          {/* 일별 사용량 스켈레톤 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="h-5 bg-gray-200 rounded w-40 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6">
                    <div className="bg-gray-200 h-full rounded-full" style={{ width: `${100 - i * 15}%` }}></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>

          {/* 최근 사용 내역 스켈레톤 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                  <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 ml-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">총 사용량</p>
                  <p className="text-2xl font-bold text-gray-800">{formatNumber(stats.totalTokens)}</p>
                  <p className="text-xs text-indigo-500 mt-1">{tokenToCost(stats.totalTokens)}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">오늘 사용량</p>
                  <p className="text-2xl font-bold text-green-600">{formatNumber(stats.todayTokens)}</p>
                  <p className="text-xs text-green-500 mt-1">{tokenToCost(stats.todayTokens)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">이번 달</p>
                  <p className="text-2xl font-bold text-blue-600">{formatNumber(stats.monthlyTokens)}</p>
                  <p className="text-xs text-blue-500 mt-1">{tokenToCost(stats.monthlyTokens)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">총 작업 수</p>
                  <p className="text-2xl font-bold text-purple-600">{formatNumber(stats.totalOperations)}</p>
                  <p className="text-xs text-gray-400 mt-1">회</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* 작업 타입별 사용량 */}
          {stats.tokensByOperationType && Object.keys(stats.tokensByOperationType).length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">작업 타입별 사용량</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(stats.tokensByOperationType).map(([type, tokens]) => (
                  <div key={type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOperationColor(type)}`}>
                        {getOperationLabel(type)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-semibold text-gray-800">{formatNumber(tokens)}</span>
                      <span className="text-xs text-gray-500 ml-1">토큰</span>
                      <p className="text-xs text-gray-400">{tokenToCost(tokens)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 일별 사용량 차트 (간단한 바 차트) */}
          {stats.dailyUsage && stats.dailyUsage.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">일별 사용량 (최근 7일)</h2>
              <div className="space-y-3">
                {stats.dailyUsage.slice(0, 7).map((day, index) => {
                  const maxTokens = Math.max(...stats.dailyUsage.slice(0, 7).map(d => d.tokens));
                  const percentage = maxTokens > 0 ? (day.tokens / maxTokens) * 100 : 0;
                  return (
                    <div key={index} className="flex items-center gap-4">
                      <span className="w-20 text-sm text-gray-500">{day.date}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-28 text-right">
                        <span className="text-sm font-medium text-gray-700">{formatNumber(day.tokens)}</span>
                        <p className="text-xs text-gray-400">{tokenToCost(day.tokens)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 최근 사용 내역 */}
          {stats.recentUsage && stats.recentUsage.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">최근 사용 내역</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b">
                      <th className="pb-3 font-medium">작업</th>
                      <th className="pb-3 font-medium">프롬프트</th>
                      <th className="pb-3 font-medium">완성</th>
                      <th className="pb-3 font-medium">총 토큰</th>
                      <th className="pb-3 font-medium">예상 비용</th>
                      <th className="pb-3 font-medium">일시</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.recentUsage.map((usage) => (
                      <tr key={usage.id} className="text-sm">
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOperationColor(usage.operationType)}`}>
                            {getOperationLabel(usage.operationType)}
                          </span>
                        </td>
                        <td className="py-3 text-gray-600">{formatNumber(usage.promptTokens)}</td>
                        <td className="py-3 text-gray-600">{formatNumber(usage.completionTokens)}</td>
                        <td className="py-3 font-medium text-gray-800">{formatNumber(usage.totalTokens)}</td>
                        <td className="py-3 text-indigo-600 font-medium">{tokenToCost(usage.totalTokens)}</td>
                        <td className="py-3 text-gray-500">{formatDate(usage.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 빈 상태 */}
          {stats.totalOperations === 0 && (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-600 text-lg mb-2">아직 토큰 사용 기록이 없습니다</p>
              <p className="text-gray-400 text-sm">문서를 생성하거나 요약하면 사용량이 기록됩니다</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-red-500">데이터를 불러올 수 없습니다.</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
}

export default TokenUsage;
