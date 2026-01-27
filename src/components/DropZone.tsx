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
        'flex flex-col items-center justify-center p-12 transition-all cursor-pointer',
        'bg-card border border-border rounded-md',
        isDragActive
          ? 'border-accent bg-accent/5'
          : 'hover:border-muted-foreground',
        className
      )}
    >
      <input {...getInputProps()} />

      {isDragActive ? (
        <p className="text-lg text-accent">
          Drop the image here
        </p>
      ) : (
        <>
          <h1 className="text-3xl tracking-[0.2em] text-foreground mb-2">
            VITRUM
          </h1>

          <p className="text-muted-foreground text-center max-w-md mb-10 italic">
            Transform your images into beautiful stained glass designs
          </p>

          <div className="w-24 h-px bg-border mb-10" />

          <p className="text-foreground text-lg">
            Drop an image here
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            or click to select a file
          </p>
          <p className="text-muted-foreground/60 text-xs mt-6">
            Supports JPG, PNG, WebP
          </p>
        </>
      )}
    </div>
  );
}
