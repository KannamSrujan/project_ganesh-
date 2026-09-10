import { useState, useRef, useEffect, ChangeEvent } from 'react';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

interface ImageUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  error?: string | null;
}

export function ImageUpload({ file, onFileChange, error }: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const validateAndSetFile = (selectedFile: File | null) => {
    setValidationError(null);

    // Clean up previous preview URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (!selectedFile) {
      setPreviewUrl(null);
      onFileChange(null);
      return;
    }

    // Check size
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setValidationError('Image exceeds 5 MB. Please select a smaller photo.');
      setPreviewUrl(null);
      onFileChange(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(selectedFile.type)) {
      setValidationError(
        'Invalid image format. Only JPEG, PNG, and WebP images are allowed.',
      );
      setPreviewUrl(null);
      onFileChange(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Check file extension
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      setValidationError(
        'Invalid file extension. Allowed: .jpg, .jpeg, .png, .webp',
      );
      setPreviewUrl(null);
      onFileChange(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const newUrl = URL.createObjectURL(selectedFile);
    objectUrlRef.current = newUrl;
    setPreviewUrl(newUrl);
    onFileChange(selectedFile);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    validateAndSetFile(selected);
  };

  const handleRemove = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPreviewUrl(null);
    onFileChange(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayError = validationError || error;

  return (
    <div className="image-upload-wrapper">
      <input
        ref={fileInputRef}
        type="file"
        id="mandapam-photo"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="sr-only"
        aria-label="Upload mandapam photo"
      />

      {!previewUrl ? (
        <label
          htmlFor="mandapam-photo"
          className="image-dropzone"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <span className="image-dropzone-icon" aria-hidden="true">
            📷
          </span>
          <span className="image-dropzone-title">Click to upload photo</span>
          <span className="image-dropzone-sub">
            JPEG, PNG, or WebP • Max 5 MB
          </span>
        </label>
      ) : (
        <div className="image-preview-card">
          <img
            src={previewUrl}
            alt="Selected mandapam preview"
            className="image-preview-thumb"
          />
          <div className="image-preview-info">
            <span className="image-preview-name">{file?.name}</span>
            <span className="image-preview-size">
              {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : ''}
            </span>
            <div className="image-preview-actions">
              <label
                htmlFor="mandapam-photo"
                className="btn btn-secondary btn-sm"
              >
                Change Photo
              </label>
              <button
                type="button"
                onClick={handleRemove}
                className="btn btn-ghost btn-sm text-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {displayError && (
        <p className="form-error" role="alert">
          {displayError}
        </p>
      )}
    </div>
  );
}
