import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

function DocumentGeneration() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.userId;
  const [formData, setFormData] = useState({
    topic: '',
    documentType: '보고서',
    keywords: '',
    length: 'medium',
    additionalInstructions: '',
    referenceDocumentId: ''
  });
  const [generating, setGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const toast = useToast();

  // 컴포넌트 마운트 시 문서 목록 조회
  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 사용자 문서 목록 조회
  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const response = await api.get(`/mysql/documents/user/${userId}`);
      setDocuments(response.data);
    } catch (error) {
      console.error('문서 목록 조회 실패:', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 문서 생성 요청
  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!formData.topic.trim()) {
      toast.warning('주제를 입력해주세요.');
      return;
    }

    if (!formData.referenceDocumentId) {
      toast.warning('참조 문서를 선택해주세요.');
      return;
    }

    setGenerating(true);
    setGeneratedDocument(null);

    try {
      // 키워드를 배열로 변환
      const keywordsArray = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const requestData = {
        userId: userId,
        documentType: formData.documentType,
        topic: formData.topic,
        keywords: keywordsArray,
        length: formData.length,
        additionalInstructions: formData.additionalInstructions || null,
        referenceDocumentId: formData.referenceDocumentId ? parseInt(formData.referenceDocumentId) : null
      };

      console.log('Generation request:', requestData);

      const response = await api.post('/documents/generate', requestData);
      setGeneratedDocument(response.data);
      toast.success('문서 생성 완료!');
      console.log('Generated document:', response.data);
    } catch (error) {
      if (error.response && error.response.data) {
        toast.error('문서 생성 실패: ' + error.response.data);
      } else {
        toast.error('문서 생성 실패: ' + error.message);
      }
      console.error('Generation error:', error);
    } finally {
      setGenerating(false);
    }
  };

  // 문서 다운로드
  const handleDownload = async (format = 'txt') => {
    if (!generatedDocument || !generatedDocument.documentId) return;

    try {
      const response = await api.get(
        `/integrated/documents/${generatedDocument.documentId}/download?format=${format}`,
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${formData.topic}_${new Date().getTime()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('다운로드 실패:', error);
      toast.error('다운로드에 실패했습니다.');
    }
  };

  // 새 문서 생성
  const handleReset = () => {
    setFormData({
      topic: '',
      documentType: '보고서',
      keywords: '',
      length: 'medium',
      additionalInstructions: '',
      referenceDocumentId: ''
    });
    setGeneratedDocument(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-800 mb-4">
            문서 자동 생성
          </h1>
          <p className="text-base sm:text-xl text-gray-600">
            참조 문서의 문체를 따라 새로운 문서를 자동으로 생성합니다
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* 입력 폼 */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              문서 생성 설정
            </h2>

            <form onSubmit={handleGenerate} className="space-y-6">
              {/* 주제 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  주제 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  placeholder="예: 2024년 4분기 실적 분석"
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                  required
                />
              </div>

              {/* 문서 타입 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  문서 타입 <span className="text-red-500">*</span>
                </label>
                <select
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleChange}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                >
                  <option value="보고서">보고서</option>
                  <option value="제안서">제안서</option>
                  <option value="이메일">이메일</option>
                  <option value="기획서">기획서</option>
                  <option value="메모">메모</option>
                </select>
              </div>

              {/* 키워드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  핵심 키워드 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleChange}
                  placeholder="예: 매출, 성장, 전략"
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  키워드를 쉼표(,)로 구분하여 입력하세요
                </p>
              </div>

              {/* 문서 길이 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  문서 길이
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, length: 'short' }))}
                    className={`py-2 px-4 rounded-lg font-semibold transition-all ${
                      formData.length === 'short'
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    짧게
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, length: 'medium' }))}
                    className={`py-2 px-4 rounded-lg font-semibold transition-all ${
                      formData.length === 'medium'
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    보통
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, length: 'long' }))}
                    className={`py-2 px-4 rounded-lg font-semibold transition-all ${
                      formData.length === 'long'
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    길게
                  </button>
                </div>
              </div>

              {/* 참조 문서 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  참조 문서 <span className="text-red-500">*</span>
                </label>
                <select
                  name="referenceDocumentId"
                  value={formData.referenceDocumentId}
                  onChange={handleChange}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                  disabled={loadingDocs}
                >
                  <option value="">-- 문서를 선택하세요 --</option>
                  {documents.map(doc => (
                    <option key={doc.documentId} value={doc.documentId}>
                      {doc.title} - {doc.documentType}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  선택한 문서의 문체를 따라 새 문서를 생성합니다
                </p>
              </div>

              {/* 추가 요구사항 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  추가 요구사항 (선택)
                </label>
                <textarea
                  name="additionalInstructions"
                  value={formData.additionalInstructions}
                  onChange={handleChange}
                  placeholder="예: 긍정적인 어조로 작성해주세요"
                  rows="3"
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none resize-none"
                />
              </div>

              {/* 생성 버튼 */}
              <button
                type="submit"
                disabled={generating}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
                  generating
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {generating ? '생성 중... (1-2분 소요)' : '문서 생성하기'}
              </button>
            </form>
          </div>

          {/* 생성된 문서 미리보기 */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                생성된 문서
              </h2>
              {generatedDocument && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleDownload('txt')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                  >
                    TXT
                  </button>
                  <button
                    onClick={() => handleDownload('docx')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all"
                  >
                    DOCX
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all"
                  >
                    새로 만들기
                  </button>
                </div>
              )}
            </div>

            {generatedDocument ? (
              <div className="space-y-4">
                {/* 문서 정보 */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-semibold">문서 ID:</span> {generatedDocument.documentId}
                    </div>
                    <div>
                      <span className="font-semibold">타입:</span> {generatedDocument.documentType}
                    </div>
                    <div>
                      <span className="font-semibold">처리 시간:</span> {generatedDocument.processingTime}ms
                    </div>
                    <div>
                      <span className="font-semibold">상태:</span> {generatedDocument.status}
                    </div>
                  </div>
                </div>

                {/* 문서 내용 */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 max-h-[600px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                    {generatedDocument.content}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <svg
                    className="mx-auto h-24 w-24 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-lg">생성된 문서가 여기에 표시됩니다</p>
                  <p className="text-sm mt-2">왼쪽 폼을 작성하고 생성하기 버튼을 눌러주세요</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentGeneration;
