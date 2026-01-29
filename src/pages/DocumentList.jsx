import { useState, useEffect } from 'react';
import api from '../api/axios';

function DocumentList() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docContent, setDocContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState('');
  const userId = 1;

  const documentTypes = ['보고서', '제안서', '이메일', '기획서', '메모'];

  // 문서 목록 불러오기 (검색 포함)
  const fetchDocuments = async (keyword = '', type = '') => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (type) params.append('type', type);

      const url = params.toString()
        ? `/mysql/documents/user/${userId}/search?${params.toString()}`
        : `/mysql/documents/user/${userId}`;

      const response = await api.get(url);
      setDocuments(response.data);
    } catch (err) {
      setError('문서 목록을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 검색 실행
  const handleSearch = () => {
    fetchDocuments(searchKeyword, filterType);
  };

  // 필터 초기화
  const handleReset = () => {
    setSearchKeyword('');
    setFilterType('');
    fetchDocuments();
  };

  // 문서 상세 내용 불러오기
  const fetchDocumentContent = async (documentId) => {
    setContentLoading(true);
    try {
      const response = await api.get(`/integrated/documents/${documentId}`);
      setDocContent(response.data);
    } catch (err) {
      console.error('문서 내용 불러오기 실패:', err);
      setDocContent({ error: '문서 내용을 불러오는데 실패했습니다.' });
    } finally {
      setContentLoading(false);
    }
  };

  // 문서 삭제
  const deleteDocument = async (documentId) => {
    if (!confirm('정말 이 문서를 삭제하시겠습니까?')) return;

    try {
      await api.delete(`/mysql/documents/${documentId}`);
      setDocuments(documents.filter(doc => doc.documentId !== documentId));
      if (selectedDoc?.documentId === documentId) {
        setSelectedDoc(null);
        setDocContent(null);
      }
      alert('문서가 삭제되었습니다.');
    } catch (err) {
      alert('문서 삭제에 실패했습니다.');
      console.error(err);
    }
  };

  // 문서 선택
  const handleSelectDoc = (doc) => {
    setSelectedDoc(doc);
    fetchDocumentContent(doc.documentId);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 문서 타입 배지 색상
  const getTypeBadgeColor = (type) => {
    const colors = {
      '보고서': 'bg-blue-100 text-blue-800',
      '제안서': 'bg-green-100 text-green-800',
      '이메일': 'bg-yellow-100 text-yellow-800',
      '기획서': 'bg-purple-100 text-purple-800',
      '메모': 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">문서 관리</h1>
        <p className="text-gray-600">업로드한 문서를 조회하고 관리할 수 있습니다.</p>
      </div>

      <div className="flex gap-6">
        {/* 문서 목록 */}
        <div className="w-1/2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                문서 목록 ({documents.length}개)
              </h2>
              <button
                onClick={() => fetchDocuments(searchKeyword, filterType)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                새로고침
              </button>
            </div>

            {/* 검색 및 필터 */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="제목 검색..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">전체 타입</option>
                {documentTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
              >
                검색
              </button>
              {(searchKeyword || filterType) && (
                <button
                  onClick={handleReset}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                >
                  초기화
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">불러오는 중...</p>
              </div>
            ) : error ? (
              <div className="text-center py-10 text-red-500">{error}</div>
            ) : documents.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <p>업로드된 문서가 없습니다.</p>
                <a href="/" className="text-indigo-600 hover:underline mt-2 inline-block">
                  문서 업로드하기
                </a>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {documents.map((doc) => (
                  <div
                    key={doc.documentId}
                    onClick={() => handleSelectDoc(doc)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedDoc?.documentId === doc.documentId
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800 truncate">
                          {doc.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getTypeBadgeColor(doc.documentType)}`}>
                            {doc.documentType || '기타'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(doc.uploadDate)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDocument(doc.documentId);
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 문서 상세 */}
        <div className="w-1/2">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">문서 상세</h2>

            {!selectedDoc ? (
              <div className="text-center py-20 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>왼쪽에서 문서를 선택하세요</p>
              </div>
            ) : contentLoading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">내용 불러오는 중...</p>
              </div>
            ) : (
              <div>
                {/* 문서 정보 */}
                <div className="mb-6 pb-4 border-b">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">{selectedDoc.title}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">타입:</span>{' '}
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getTypeBadgeColor(selectedDoc.documentType)}`}>
                        {selectedDoc.documentType || '기타'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">상태:</span>{' '}
                      <span className="text-green-600">{selectedDoc.status}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">업로드:</span>{' '}
                      {formatDate(selectedDoc.uploadDate)}
                    </div>
                    <div>
                      <span className="text-gray-500">ID:</span> {selectedDoc.documentId}
                    </div>
                  </div>
                </div>

                {/* 요약 */}
                {docContent?.summary && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-2">요약</h4>
                    <div className="bg-indigo-50 rounded-lg p-4 text-sm text-gray-700">
                      {docContent.summary.summaryText}
                    </div>
                    {docContent.summary.tags && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {JSON.parse(docContent.summary.tags || '[]').map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 본문 내용 */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">본문 내용</h4>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                    {docContent?.content || docContent?.error || '내용을 불러올 수 없습니다.'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentList;
