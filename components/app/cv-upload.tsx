'use client';

import { useRef, useState } from 'react';
import { CheckCircle, File, UploadSimple, X } from '@phosphor-icons/react';
import { Button } from '@/components/livekit/button';

interface CVUploadProps {
  onSummaryGenerated: (summary: string) => void;
  roomName?: string; // Optional room name to send summary to
}

export function CVUpload({ onSummaryGenerated }: CVUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Simulate brief validation delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Set success state - no API call needed as CV context is hardcoded in agent
      const placeholder = 'cv_uploaded';
      setSummary(placeholder);
      onSummaryGenerated(placeholder);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process CV');
      console.error('Error uploading CV:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setSummary(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full space-y-3">
      {!summary ? (
        <>
          {/* File input (hidden) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isProcessing}
          />

          {/* Upload area */}
          {!selectedFile ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full border-[#7b2cbf] bg-black/40 text-[#c77dff] hover:bg-[#7b2cbf]/20 hover:text-[#00ff9f]"
            >
              <UploadSimple size={16} weight="bold" className="mr-2" />
              Upload CV
            </Button>
          ) : (
            <div className="space-y-2">
              {/* Selected file display */}
              <div className="flex items-center justify-between rounded border border-[#7b2cbf] bg-black/40 p-2">
                <div className="flex items-center gap-2">
                  <File size={16} weight="bold" className="text-[#00f5ff]" />
                  <span className="text-[10px] text-[#c77dff]">{selectedFile.name}</span>
                </div>
                <button
                  onClick={handleRemove}
                  className="text-[#ff006e] hover:text-[#ff006e]/80"
                  disabled={isProcessing}
                >
                  <X size={16} weight="bold" />
                </button>
              </div>

              {/* Process button */}
              <Button
                variant="primary"
                size="sm"
                onClick={handleUpload}
                disabled={isProcessing}
                className="w-full bg-[#7b2cbf] text-white hover:bg-[#7b2cbf]/80"
              >
                {isProcessing ? 'Processing...' : 'Analyze CV'}
              </Button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="rounded border border-[#ff006e] bg-[#ff006e]/10 p-2">
              <p className="text-[9px] text-[#ff006e]">{error}</p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Success state */}
          <div className="flex items-center gap-2 rounded border border-[#00ff9f] bg-[#00ff9f]/10 p-2">
            <CheckCircle size={16} weight="bold" className="text-[#00ff9f]" />
            <span className="text-[10px] text-[#00ff9f]">
              Perfect! I&apos;ve got your background. Let&apos;s talk!
            </span>
          </div>
        </>
      )}
    </div>
  );
}
