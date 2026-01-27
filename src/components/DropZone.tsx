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
        'bg-card border border-border',
        isDragActive
          ? 'border-primary bg-primary/5 shadow-[inset_0_0_20px_rgba(139,69,80,0.1)]'
          : 'hover:border-accent hover:shadow-[inset_0_0_30px_rgba(180,140,60,0.08)]',
        className
      )}
    >
      <input {...getInputProps()} />

      {isDragActive ? (
        <p className="text-lg text-primary">
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

          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-px bg-border" />
            <span className="text-accent text-sm">✦</span>
            <div className="w-8 h-px bg-border" />
          </div>

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
