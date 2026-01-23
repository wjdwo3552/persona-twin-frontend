import { useState, useEffect } from 'react';
import api from '../api/axios';

function StyleLearning() {
  const [userId] = useState(1); // 테스트용 고정
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [learning, setLearning] = useState(false);
  const [message, setMessage] = useState('');
  const [learningResult, setLearningResult] = useState(null);

  // 컴포넌트 마운트 시 문서 목록 조회
  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 사용자 문서 목록 조회
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/mysql/documents/user/${userId}`);
      setDocuments(response.data);
      console.log('Documents:', response.data);
    } catch (error) {
      console.error('문서 조회 실패:', error);
      setMessage('문서 조회 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 문체 학습 실행
  const handleLearnStyle = async () => {
    if (documents.length < 3) {
      setMessage('문체 학습을 위해서는 최소 3개의 문서가 필요합니다.');
      return;
    }

    setLearning(true);
    setMessage('');
    setLearningResult(null);

    try {
      const response = await api.post(`/style/learn/${userId}`);
      setLearningResult(response.data);
      setMessage('문체 학습 완료!');
      console.log('Learning result:', response.data);
    } catch (error) {
      setMessage('문체 학습 실패: ' + error.message);
      console.error('Learning error:', error);
    } finally {
      setLearning(false);
    }
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR') + ' ' + date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            문체 학습
          </h1>
          <p className="text-xl text-gray-600">
            업로드한 문서를 분석하여 당신의 문체를 학습합니다
          </p>
        </div>

        {/* 문서 목록 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              업로드된 문서 ({documents.length}개)
            </h2>
            <button
              onClick={fetchDocuments}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-gray-700 transition-all disabled:opacity-50"
            >
              {loading ? '새로고침 중...' : '새로고침'}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-600">
              문서 목록 불러오는 중...
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              업로드된 문서가 없습니다. 먼저 문서를 업로드해주세요.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">번호</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">파일명</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">타입</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">크기</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">업로드 날짜</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc, index) => (
                    <tr key={doc.documentId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{index + 1}</td>
                      <td className="py-3 px-4 font-medium">{doc.title}</td>
                      <td className="py-3 px-4">{doc.documentType}</td>
                      <td className="py-3 px-4">{formatFileSize(doc.fileSize)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(doc.uploadDate)}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                          {doc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 학습 버튼 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            문체 학습 시작
          </h2>

          <div className="space-y-6">
            {/* 안내 메시지 */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-blue-700">
                최소 3개 이상의 문서가 필요합니다. 더 많은 문서를 업로드할수록 정확한 학습이 가능합니다.
              </p>
            </div>

            {/* 학습 버튼 */}
            <button
              onClick={handleLearnStyle}
              disabled={learning || documents.length < 3}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all ${
                learning || documents.length < 3
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {learning ? '학습 중... (최대 2분 소요)' : '문체 학습 시작'}
            </button>

            {/* 메시지 */}
            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.includes('실패')
                    ? 'bg-red-50 text-red-700'
                    : message.includes('완료')
                    ? 'bg-green-50 text-green-700'
                    : 'bg-yellow-50 text-yellow-700'
                }`}
              >
                {message}
              </div>
            )}

            {/* 학습 결과 */}
            {learningResult && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">학습 결과</h3>
                <div className="space-y-2 text-gray-700">
                  <p><strong>분석된 문서 수:</strong> {learningResult.documentCount || 'N/A'}</p>
                  <p><strong>학습 상태:</strong> {learningResult.status || '완료'}</p>
                  {learningResult.message && (
                    <p className="mt-4 text-sm bg-white p-3 rounded">
                      {learningResult.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 다음 단계 안내 */}
        {learningResult && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              다음 단계
            </h3>
            <p className="text-gray-700 mb-4">
              문체 학습이 완료되었습니다! 이제 "문서 생성" 메뉴에서 당신의 문체로 새로운 문서를 자동 생성할 수 있습니다.
            </p>
            <a
              href="/generate"
              className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all"
            >
              문서 생성하러 가기
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default StyleLearning;
