'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';

interface DropZoneProps {
  onFileAccepted: (file: File) => void;
  className?: string;
}

export function DropZone({ onFileAccepted, className }: DropZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileAccepted(acceptedFiles[0]);
      }
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer',
        isDragActive
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
          : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600',
        className
      )}
    >
      <input {...getInputProps()} />

      {isDragActive ? (
        <>
          <svg
            className="w-16 h-16 mb-6 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-blue-500 font-medium text-lg">Drop the image here</p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Stained Glass Generator
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-md mb-8">
            Transform your images into beautiful stained glass designs
          </p>

          <svg
            className="w-16 h-16 mb-6 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>

          <p className="text-neutral-600 dark:text-neutral-400 font-medium">
            Drop an image here
          </p>
          <p className="text-neutral-500 dark:text-neutral-500 text-sm mt-1">
            or click to select a file
          </p>
          <p className="text-neutral-400 dark:text-neutral-600 text-xs mt-3">
            Supports JPG, PNG, WebP
          </p>
        </>
      )}
    </div>
  );
}
