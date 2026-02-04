import { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

function DocumentList() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docContent, setDocContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [deleteModal, setDeleteModal] = useState({ show: false, document: null });
  const [deleting, setDeleting] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.userId;
  const toast = useToast();

  const documentTypes = ['보고서', '제안서', '이메일', '기획서', '메모'];

  const sortOptions = [
    { value: 'date-desc', label: '최신순' },
    { value: 'date-asc', label: '오래된순' },
    { value: 'title-asc', label: '제목 (가나다순)' },
    { value: 'title-desc', label: '제목 (역순)' },
    { value: 'type', label: '타입별' },
  ];

  // 정렬된 문서 목록
  const sortedDocuments = useMemo(() => {
    const sorted = [...documents];
    switch (sortBy) {
      case 'date-desc':
        return sorted.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
      case 'date-asc':
        return sorted.sort((a, b) => new Date(a.uploadDate) - new Date(b.uploadDate));
      case 'title-asc':
        return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'ko'));
      case 'title-desc':
        return sorted.sort((a, b) => (b.title || '').localeCompare(a.title || '', 'ko'));
      case 'type':
        return sorted.sort((a, b) => (a.documentType || '').localeCompare(b.documentType || '', 'ko'));
      default:
        return sorted;
    }
  }, [documents, sortBy]);

  // 검색어 디바운스 (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchKeyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // 디바운스된 검색어 또는 필터 변경 시 자동 검색
  useEffect(() => {
    if (userId) {
      fetchDocuments(debouncedKeyword, filterType);
    }
  }, [debouncedKeyword, filterType, userId]);

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

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
    } catch {
      setError('문서 목록을 불러오는데 실패했습니다.');
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
    } catch {
      setDocContent({ error: '문서 내용을 불러오는데 실패했습니다.' });
    } finally {
      setContentLoading(false);
    }
  };

  // 삭제 모달 열기
  const openDeleteModal = (doc) => {
    setDeleteModal({ show: true, document: doc });
  };

  // 삭제 모달 닫기
  const closeDeleteModal = () => {
    setDeleteModal({ show: false, document: null });
  };

  // 문서 삭제 실행
  const confirmDelete = async () => {
    if (!deleteModal.document) return;

    const documentId = deleteModal.document.documentId;
    setDeleting(true);

    try {
      await api.delete(`/mysql/documents/${documentId}`);
      setDocuments(documents.filter(doc => doc.documentId !== documentId));
      if (selectedDoc?.documentId === documentId) {
        setSelectedDoc(null);
        setDocContent(null);
      }
      toast.success('문서가 삭제되었습니다.');
      closeDeleteModal();
    } catch {
      toast.error('문서 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  // 문서 선택
  const handleSelectDoc = (doc) => {
    setSelectedDoc(doc);
    fetchDocumentContent(doc.documentId);
  };

  // 문서 다운로드
  const handleDownload = async (documentId, title, format = 'txt') => {
    try {
      const response = await api.get(
        `/integrated/documents/${documentId}/download?format=${format}`,
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeTitle = title ? title.replace(/[^a-zA-Z0-9가-힣]/g, '_') : 'document';
      link.download = `${safeTitle}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      toast.error('다운로드에 실패했습니다.');
    }
  };

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

      <div className="flex flex-col lg:flex-row gap-6">
        {/* 문서 목록 */}
        <div className="w-full lg:w-1/2">
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
            <div className="space-y-2 mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="제목 검색..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                />
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
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">전체 타입</option>
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4 rounded-lg border border-gray-200 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="flex items-center gap-2">
                      <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-10 text-red-500">{error}</div>
            ) : documents.length === 0 ? (
              <div className="text-center py-16">
                {searchKeyword || filterType ? (
                  // 검색 결과 없음
                  <>
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-gray-500 text-lg mb-2">검색 결과가 없습니다</p>
                    <p className="text-gray-400 text-sm mb-4">다른 검색어나 필터를 시도해보세요</p>
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      필터 초기화
                    </button>
                  </>
                ) : (
                  // 문서가 아예 없음
                  <>
                    <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600 text-lg font-medium mb-2">아직 업로드된 문서가 없습니다</p>
                    <p className="text-gray-400 text-sm mb-6">첫 번째 문서를 업로드하여 시작하세요</p>
                    <a
                      href="/"
                      className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      문서 업로드하기
                    </a>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {sortedDocuments.map((doc) => (
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
                          openDeleteModal(doc);
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
        <div className="w-full lg:w-1/2">
          <div className="bg-white rounded-xl shadow-lg p-6 lg:sticky lg:top-24">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold text-gray-800">문서 상세</h2>
              {selectedDoc && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleDownload(selectedDoc.documentId, selectedDoc.title, 'txt')}
                    className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    TXT
                  </button>
                  <button
                    onClick={() => handleDownload(selectedDoc.documentId, selectedDoc.title, 'docx')}
                    className="px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                  >
                    DOCX
                  </button>
                  {docContent?.summary && (
                    <button
                      onClick={() => handleDownload(selectedDoc.documentId, selectedDoc.title, 'summary')}
                      className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      요약
                    </button>
                  )}
                </div>
              )}
            </div>

            {!selectedDoc ? (
              <div className="text-center py-20 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>왼쪽에서 문서를 선택하세요</p>
              </div>
            ) : contentLoading ? (
              <div className="animate-pulse">
                <div className="mb-6 pb-4 border-b">
                  <div className="h-6 bg-gray-200 rounded w-2/3 mb-3"></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="h-5 bg-gray-200 rounded w-12 mb-2"></div>
                  <div className="bg-gray-100 rounded-lg p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </div>
                <div>
                  <div className="h-5 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="bg-gray-100 rounded-lg p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
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

      {/* 삭제 확인 모달 */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 배경 오버레이 */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={closeDeleteModal}
          />

          {/* 모달 */}
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              {/* 경고 아이콘 */}
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2">문서 삭제</h3>
              <p className="text-gray-600 mb-2">정말 이 문서를 삭제하시겠습니까?</p>
              <p className="text-sm text-gray-500 bg-gray-100 rounded-lg px-3 py-2 mb-6 truncate">
                {deleteModal.document?.title}
              </p>

              {/* 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={closeDeleteModal}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-red-400"
                >
                  {deleting ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentList;
