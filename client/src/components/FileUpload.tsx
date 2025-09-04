import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  onClose: () => void;
}

export default function FileUpload({ onUpload, onClose }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onUpload(acceptedFiles);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="file-upload-modal">
      <div className="file-upload-content">
        <div {...getRootProps()} className="dropzone">
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Отпустите файлы здесь...</p>
          ) : (
            <p>Перетащите файлы сюда или кликните для выбора</p>
          )}
        </div>
        <button onClick={onClose} className="btn btn-secondary btn-sm">
          Закрыть
        </button>
      </div>
    </div>
  );
}
