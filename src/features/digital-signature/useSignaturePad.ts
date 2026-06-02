import { useCallback, useEffect, useRef, useState } from 'react';

export function useSignaturePad(disabled = false) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [padLocked, setPadLocked] = useState(false);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(initCanvas, 50);
    window.addEventListener('resize', initCanvas);

    const container = containerRef.current;
    let observer: ResizeObserver | undefined;
    if (container && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => initCanvas());
      observer.observe(container);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', initCanvas);
      observer?.disconnect();
    };
  }, [initCanvas]);

  const getPointerPos = useCallback(
    (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      if ('touches' in e && e.touches.length > 0) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      }
      if ('clientX' in e) {
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
      return { x: 0, y: 0 };
    },
    [],
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled || padLocked) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      isDrawingRef.current = true;
      setHasSignature(true);
      setShowPlaceholder(false);

      const pos = getPointerPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    },
    [disabled, padLocked, getPointerPos],
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawingRef.current || disabled || padLocked) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      const pos = getPointerPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    },
    [disabled, padLocked, getPointerPos],
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.closePath();
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    initCanvas();

    setHasSignature(false);
    setShowPlaceholder(true);
    setPadLocked(false);
  }, [initCanvas]);

  const exportPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    return canvas.toDataURL('image/png');
  }, []);

  const lockAfterCapture = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setPadLocked(true);
    setShowPlaceholder(true);
    setHasSignature(false);
  }, []);

  return {
    canvasRef,
    containerRef,
    hasSignature,
    showPlaceholder,
    padLocked,
    startDrawing,
    draw,
    stopDrawing,
    clear,
    exportPng,
    lockAfterCapture,
    setShowPlaceholder,
  };
}
