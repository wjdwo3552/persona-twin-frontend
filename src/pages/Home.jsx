import { useState } from 'react';
import api from '../api/axios';

function Home() {
  const [file, setFile] = useState(null);
  const [userId] = useState(1); // 테스트용 고정
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('파일을 선택해주세요');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage('✅ 업로드 성공!');
      setFile(null);
      console.log('Upload response:', response.data);
    } catch (error) {
      setMessage('❌ 업로드 실패: ' + error.message);
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            📝 Persona Twin
          </h1>
          <p className="text-xl text-gray-600">
            AI가 당신의 문체를 학습해서 문서를 작성합니다
          </p>
        </div>

        {/* 업로드 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            📤 문서 업로드
          </h2>

          <div className="space-y-6">
            {/* 파일 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                문서 파일 선택 (.txt, .docx)
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".txt,.docx"
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  선택된 파일: {file.name}
                </p>
              )}
            </div>

            {/* 업로드 버튼 */}
            <button
              onClick={handleUpload}
              disabled={uploading || !file}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
                uploading || !file
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {uploading ? '업로드 중...' : '📤 업로드'}
            </button>

            {/* 메시지 */}
            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.includes('성공')
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {message}
              </div>
            )}
          </div>
        </div>

        {/* 안내 */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            🎯 사용 방법
          </h3>
          <ol className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="font-bold text-indigo-600 mr-2">1.</span>
              <span>문서를 3개 이상 업로드하세요</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-indigo-600 mr-2">2.</span>
              <span>"문체 학습" 메뉴에서 학습을 진행하세요</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-indigo-600 mr-2">3.</span>
              <span>"문서 생성" 메뉴에서 새 문서를 자동 생성하세요</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default Home;