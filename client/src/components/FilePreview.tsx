import { useState, useEffect } from 'react';

interface FilePreviewProps {
  filePath: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function FilePreview({ filePath, fileName, isOpen, onClose }: FilePreviewProps) {
  const [fileType, setFileType] = useState<'image' | 'audio' | 'video' | 'unknown'>('unknown');

  useEffect(() => {
    if (!fileName) return;
    
    const extension = fileName.toLowerCase().split('.').pop();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension || '')) {
      setFileType('image');
    } else if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(extension || '')) {
      setFileType('audio');
    } else if (['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(extension || '')) {
      setFileType('video');
    } else {
      setFileType('unknown');
    }
  }, [fileName]);

  const getFileUrl = (path: string) => {
    return path.startsWith('/uploads/') ? path : `/uploads/${path}`;
  };

  if (!isOpen) return null;

  return (
    <div className="file-preview-overlay" onClick={onClose}>
      <div className="file-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="file-preview-header">
          <h3>{fileName}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="file-preview-content">
          {fileType === 'image' && (
            <img 
              src={getFileUrl(filePath)} 
              alt={fileName}
              className="preview-image"
            />
          )}
          
          {fileType === 'audio' && (
            <div className="audio-preview">
              <div className="audio-icon">🎵</div>
              <audio controls className="audio-player">
                <source src={getFileUrl(filePath)} />
                Ваш браузер не поддерживает воспроизведение аудио.
              </audio>
            </div>
          )}
          
          {fileType === 'video' && (
            <video controls className="preview-video">
              <source src={getFileUrl(filePath)} />
              Ваш браузер не поддерживает воспроизведение видео.
            </video>
          )}
          
          {fileType === 'unknown' && (
            <div className="unknown-file">
              <div className="file-icon">📄</div>
              <p>Предпросмотр недоступен для этого типа файла</p>
              <a 
                href={getFileUrl(filePath)} 
                download={fileName}
                className="download-btn"
              >
                Скачать файл
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
