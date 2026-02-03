import { useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

function Home() {
  const [file, setFile] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.userId;
  const [uploading, setUploading] = useState(false);
  const [summarize, setSummarize] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  const allowedTypes = ['.txt', '.docx', '.pdf'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const validateFile = (file) => {
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(extension)) {
      toast.error('지원하지 않는 파일 형식입니다. (.txt, .docx, .pdf만 가능)');
      return false;
    }
    if (file.size > maxFileSize) {
      toast.error('파일 크기는 10MB를 초과할 수 없습니다.');
      return false;
    }
    return true;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!file) {
      toast.warning('파일을 선택해주세요');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('summarize', summarize);

      await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('업로드 성공!');
      setFile(null);
    } catch (error) {
      toast.error('업로드 실패: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-800 mb-4">
            Persona Twin
          </h1>
          <p className="text-base sm:text-xl text-gray-600">
            AI가 당신의 문체를 학습해서 문서를 작성합니다
          </p>
        </div>

        {/* 업로드 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
            문서 업로드
          </h2>

          <div className="space-y-6">
            {/* 드래그앤드롭 영역 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                문서 파일 선택 (.txt, .docx, .pdf, 최대 10MB)
              </label>
              <div
                onClick={handleDropZoneClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50'
                    : file
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".txt,.docx,.pdf"
                  className="hidden"
                />

                {file ? (
                  <div className="space-y-2">
                    <svg className="w-12 h-12 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-green-700 font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">클릭하여 다른 파일 선택</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-600 font-medium">
                      {isDragging ? '여기에 놓으세요!' : '파일을 끌어다 놓거나 클릭하세요'}
                    </p>
                    <p className="text-sm text-gray-400">.txt, .docx, .pdf 지원 (최대 10MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* 자동 요약 옵션 */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="summarize"
                checked={summarize}
                onChange={(e) => setSummarize(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="summarize" className="ml-2 text-sm text-gray-700">
                자동 요약 (GPT 토큰 사용)
              </label>
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
              {uploading ? '업로드 중...' : '업로드'}
            </button>

          </div>
        </div>

        {/* 안내 */}
        <div className="mt-6 sm:mt-8 bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
            사용 방법
          </h3>
          <ol className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="font-bold text-indigo-600 mr-2">1.</span>
              <span>참조할 문서를 업로드하세요</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-indigo-600 mr-2">2.</span>
              <span>"문서 생성" 메뉴에서 참조 문서를 선택하세요</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-indigo-600 mr-2">3.</span>
              <span>주제와 키워드를 입력하면 참조 문서의 문체로 새 문서가 생성됩니다</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default Home;