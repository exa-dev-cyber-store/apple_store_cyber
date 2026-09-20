"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { FiZoomIn, FiZoomOut, FiCheck, FiX, FiMove } from "react-icons/fi";

interface AvatarCropModalProps {
  imageSrc: string;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => Promise<void> | void;
  submitting?: boolean;
}

export default function AvatarCropModal({
  imageSrc,
  isOpen,
  onClose,
  onCropComplete,
  submitting = false,
}: AvatarCropModalProps) {
  const [mounted, setMounted] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when crop modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerSize = 300; // Preview viewport size in CSS pixels
  const outputSize = 400; // Final fixed WebP size (400x400)

  // Load image
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      imageRef.current = img;
      // Reset position and calculate initial scale to cover container
      const minScale = Math.max(containerSize / img.width, containerSize / img.height);
      setScale(minScale);
      setPosition({
        x: (containerSize - img.width * minScale) / 2,
        y: (containerSize - img.height * minScale) / 2,
      });
    };
  }, [imageSrc]);

  // Redraw preview canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const img = imageRef.current;
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;

    ctx.drawImage(img, position.x, position.y, drawWidth, drawHeight);
  }, [position, scale]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Handle Mouse Drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Handle Touch Drag
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  // Handle Crop and Export
  const handleSaveCrop = async () => {
    if (!imageRef.current) return;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = outputSize;
    exportCanvas.height = outputSize;
    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) return;

    // Ratio between output size (400) and viewport container (300)
    const ratio = outputSize / containerSize;

    exportCtx.imageSmoothingEnabled = true;
    exportCtx.imageSmoothingQuality = "high";

    const img = imageRef.current;
    exportCtx.drawImage(
      img,
      position.x * ratio,
      position.y * ratio,
      img.width * scale * ratio,
      img.height * scale * ratio
    );

    exportCanvas.toBlob(
      async (blob) => {
        if (blob) {
          await onCropComplete(blob);
        }
      },
      "image/webp",
      0.85
    );
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 top-0 left-0 w-full h-full min-h-screen z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-md overflow-y-auto animate-modal-fade"
      style={{ margin: 0, zIndex: 99999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-neutral-200 space-y-5 animate-modal-scale relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight">
              Adjust Profile Picture
            </h3>
            <p className="text-xs text-neutral-500">
              Drag and scale your photo to fit the circular frame
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center transition-colors"
          >
            <FiX className="text-base" />
          </button>
        </div>

        {/* Viewport with 1:1 overlay */}
        <div className="flex justify-center">
          <div
            className="relative overflow-hidden rounded-2xl bg-neutral-900 cursor-grab active:cursor-grabbing select-none"
            style={{ width: containerSize, height: containerSize }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <canvas
              ref={canvasRef}
              width={containerSize}
              height={containerSize}
              className="w-full h-full"
            />

            {/* Circular cutout guide overlay */}
            <div className="absolute inset-0 pointer-events-none rounded-full border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />

            {/* Hint drag indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white/90 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none">
              <FiMove className="text-[10px]" /> Drag to reposition
            </div>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
            <span className="flex items-center gap-1">
              <FiZoomOut /> Zoom Out
            </span>
            <span>Zoom</span>
            <span className="flex items-center gap-1">
              Zoom In <FiZoomIn />
            </span>
          </div>
          <input
            type="range"
            min={0.2}
            max={3}
            step={0.02}
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-100">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSaveCrop}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 disabled:opacity-50 transition-colors shadow-sm"
          >
            {submitting ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FiCheck className="text-sm" />
            )}
            {submitting ? "Processing..." : "Crop & Save"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
