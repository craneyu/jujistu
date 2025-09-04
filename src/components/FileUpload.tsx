'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Camera, Image, X } from 'lucide-react';

interface Props {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  label: string;
  description?: string;
  allowCamera?: boolean;
}

export default function FileUpload({ 
  onFileSelect, 
  accept = 'image/*', 
  maxSize = 10 * 1024 * 1024, // 10MB
  label,
  description,
  allowCamera = true
}: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      onFileSelect(file);
      setFileName(file.name);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: accept.split(',').reduce((acc, type) => ({ ...acc, [type.trim()]: [] }), {}),
    maxSize,
    multiple: false, // 限制只能選擇1個檔案
    maxFiles: 1 // 確保最多只能有1個檔案
  });

  const handleCameraClick = () => {
    if (allowCamera && 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'camera';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          onDrop([file]);
        }
      };
      input.click();
    }
  };

  const clearFile = () => {
    setPreview(null);
    setFileName(null);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <Upload className="inline h-4 w-4 mr-1" />
        {label}
      </label>
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="預覽"
              className="mx-auto max-h-32 rounded-lg"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="h-3 w-3" />
            </button>
            <p className="mt-2 text-sm text-gray-800 font-semibold">{fileName}</p>
          </div>
        ) : fileName ? (
          <div className="relative">
            <div className="flex items-center justify-center">
              <Image className="h-8 w-8 text-gray-400" />
            </div>
            <p className="mt-2 text-sm text-gray-800 font-semibold">{fileName}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div>
            <div className="flex justify-center items-center space-x-2 mb-2">
              <Upload className="h-8 w-8 text-gray-400" />
              {allowCamera && (
                <>
                  <span className="text-gray-400">或</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCameraClick();
                    }}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                  >
                    <Camera className="h-8 w-8" />
                  </button>
                </>
              )}
            </div>
            
            {isDragActive ? (
              <p className="text-blue-600 font-semibold">拖放文件到這裡...</p>
            ) : (
              <div>
                <p className="text-gray-800 font-semibold">
                  點擊選擇文件或拖放到這裡
                </p>
                {allowCamera && (
                  <p className="text-gray-700 text-sm mt-1 font-medium">
                    也可以點擊相機圖示拍照上傳
                  </p>
                )}
              </div>
            )}
            
            {description && (
              <p className="mt-2 text-xs text-gray-700 font-medium">{description}</p>
            )}
          </div>
        )}
      </div>

      {fileRejections.length > 0 && (
        <div className="mt-2">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="text-sm text-red-700 font-medium">
              {errors.map(e => (
                <p key={e.code}>
                  {e.code === 'file-too-large' ? `文件大小超過限制 (最大 ${Math.round(maxSize / (1024 * 1024))}MB)` :
                   e.code === 'file-invalid-type' ? '文件格式不支援' :
                   e.code === 'too-many-files' ? '只能上傳1個檔案' : e.message}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}