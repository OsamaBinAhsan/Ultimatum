'use client';

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  RefObject,
} from 'react';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export type CanvasFitMode = 'contain' | 'cover' | 'fill' | 'exact';

export interface UseResponsiveCanvasOptions {
  /** Sizing fit strategy inside the parent container. Defaults to 'contain'. */
  fit?: CanvasFitMode;
  /** Maximum CSS display scale multiplier (e.g., 2.0 to prevent pixelation on ultra-wide screens). */
  maxScale?: number;
  /** Minimum CSS display scale multiplier. */
  minScale?: number;
  /** Cap the DPR scale (e.g., 2 or 3) to prevent excessive memory usage on 4K/3x mobile screens. Defaults to 3. */
  dprCap?: number;
  /** Optional callback fired whenever the canvas size or scale recalculates. */
  onResize?: (scaleInfo: CanvasScaleInfo) => void;
}

export interface CanvasScaleInfo {
  /** Logical virtual game width in coordinates (e.g. 800) */
  virtualWidth: number;
  /** Logical virtual game height in coordinates (e.g. 600) */
  virtualHeight: number;
  /** Rendered CSS width in pixels */
  displayWidth: number;
  /** Rendered CSS height in pixels */
  displayHeight: number;
  /** Actual internal backing canvas buffer width (displayWidth * dpr) */
  bufferWidth: number;
  /** Actual internal backing canvas buffer height (displayHeight * dpr) */
  bufferHeight: number;
  /** Current effective Device Pixel Ratio */
  dpr: number;
  /** Scale factor from virtual coordinates to CSS display pixels */
  scaleX: number;
  scaleY: number;
  scale: number;
  /** Letterbox horizontal and vertical offset margins inside container */
  offsetX: number;
  offsetY: number;
}

export interface PointerNormalizedPos {
  /** Logical X position mapped into the virtual coordinate space */
  x: number;
  /** Logical Y position mapped into the virtual coordinate space */
  y: number;
  /** Clamped X position strictly within [0, virtualWidth] */
  clampedX: number;
  /** Clamped Y position strictly within [0, virtualHeight] */
  clampedY: number;
  /** True if the pointer event is physically inside the canvas bounding rect */
  isInside: boolean;
  /** Pointer pressure if supported by device/stylus */
  pressure: number;
  /** Pointer type ('mouse' | 'touch' | 'pen') */
  pointerType: string;
}

export type SupportedPointerEvent =
  | MouseEvent
  | TouchEvent
  | PointerEvent
  | React.MouseEvent<HTMLCanvasElement | HTMLElement>
  | React.TouchEvent<HTMLCanvasElement | HTMLElement>
  | React.PointerEvent<HTMLCanvasElement | HTMLElement>;

// ---------------------------------------------------------------------------
// Coordinate Normalization Helper
// ---------------------------------------------------------------------------

/**
 * Universal helper to translate Mouse, Touch, or Pointer events directly
 * into the game's logical virtual coordinate system (e.g. 800x600).
 *
 * Accounts for getBoundingClientRect(), device pixel ratio, CSS scale factor,
 * and any letterbox/pillarbox offset.
 */
export function getCanvasPointerPos(
  event: SupportedPointerEvent,
  canvas: HTMLCanvasElement | null,
  virtualWidth: number,
  virtualHeight: number
): PointerNormalizedPos | null {
  if (!canvas) return null;

  let clientX = 0;
  let clientY = 0;
  let pressure = 1.0;
  let pointerType = 'mouse';

  // 1. Extract raw client coordinates from various event structures
  if ('touches' in event && event.touches && event.touches.length > 0) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
    pointerType = 'touch';
  } else if ('changedTouches' in event && event.changedTouches && event.changedTouches.length > 0) {
    clientX = event.changedTouches[0].clientX;
    clientY = event.changedTouches[0].clientY;
    pointerType = 'touch';
  } else if ('clientX' in event) {
    clientX = event.clientX;
    clientY = event.clientY;
    if ('pressure' in event && typeof event.pressure === 'number') {
      pressure = event.pressure;
    }
    if ('pointerType' in event && typeof event.pointerType === 'string') {
      pointerType = event.pointerType;
    }
  } else {
    return null;
  }

  // 2. Measure actual rendered bounds
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  // 3. Compute relative position on the CSS display surface
  const relativeX = clientX - rect.left;
  const relativeY = clientY - rect.top;

  // 4. Translate CSS pixels into the fixed virtual coordinates
  const scaleX = virtualWidth / rect.width;
  const scaleY = virtualHeight / rect.height;

  const x = relativeX * scaleX;
  const y = relativeY * scaleY;

  const isInside = relativeX >= 0 && relativeX <= rect.width && relativeY >= 0 && relativeY <= rect.height;
  const clampedX = Math.max(0, Math.min(virtualWidth, x));
  const clampedY = Math.max(0, Math.min(virtualHeight, y));

  return {
    x,
    y,
    clampedX,
    clampedY,
    isInside,
    pressure,
    pointerType,
  };
}

// ---------------------------------------------------------------------------
// Universal Responsive Canvas Hook
// ---------------------------------------------------------------------------

export interface UseResponsiveCanvasReturn {
  canvasRef: RefObject<HTMLCanvasElement>;
  containerRef: RefObject<HTMLDivElement>;
  scaleInfo: CanvasScaleInfo;
  scale: number;
  dpr: number;
  displayWidth: number;
  displayHeight: number;
  virtualWidth: number;
  virtualHeight: number;
  isTouchDevice: boolean;
  /** Bound coordinate normalization method for this canvas instance */
  getPointerPos: (event: SupportedPointerEvent) => PointerNormalizedPos | null;
  /** Prepares 2D canvas context with DPR scale and crisp rendering properties */
  setupCanvasContext: (ctx: CanvasRenderingContext2D) => void;
  /** Manually trigger a resize recalculation */
  recalculate: () => void;
}

export function useResponsiveCanvas(
  virtualWidth: number = 800,
  virtualHeight: number = 600,
  options: UseResponsiveCanvasOptions = {}
): UseResponsiveCanvasReturn {
  const {
    fit = 'contain',
    maxScale = 3.0,
    minScale = 0.1,
    dprCap = 3.0,
    onResize,
  } = options;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [scaleInfo, setScaleInfo] = useState<CanvasScaleInfo>(() => ({
    virtualWidth,
    virtualHeight,
    displayWidth: virtualWidth,
    displayHeight: virtualHeight,
    bufferWidth: virtualWidth,
    bufferHeight: virtualHeight,
    dpr: 1,
    scaleX: 1,
    scaleY: 1,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  }));

  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  // Detect touch capabilities on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    setIsTouchDevice(hasTouch);
  }, []);

  // Primary resize and aspect ratio calculation routine
  const updateDimensions = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas) return;

    const dprRaw = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const dpr = Math.min(dprCap, Math.max(1, dprRaw));

    // Determine container dimensions
    let containerWidth = virtualWidth;
    let containerHeight = virtualHeight;

    if (container) {
      const rect = container.getBoundingClientRect();
      containerWidth = rect.width || container.clientWidth || virtualWidth;
      const cHeight = rect.height || container.clientHeight;
      containerHeight = cHeight > 50 ? cHeight : (containerWidth * virtualHeight) / virtualWidth;
    } else if (typeof window !== 'undefined') {
      containerWidth = window.innerWidth;
      containerHeight = window.innerHeight;
    }

    const virtualAspect = virtualWidth / virtualHeight;
    const containerAspect = containerWidth / containerHeight;

    let displayWidth = virtualWidth;
    let displayHeight = virtualHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (fit === 'contain') {
      // Letterbox or pillarbox to preserve exact aspect ratio without distortion
      if (containerAspect > virtualAspect) {
        // Pillarbox (black bars on left/right)
        displayHeight = containerHeight;
        displayWidth = containerHeight * virtualAspect;
        offsetX = (containerWidth - displayWidth) / 2;
      } else {
        // Letterbox (black bars on top/bottom)
        displayWidth = containerWidth;
        displayHeight = containerWidth / virtualAspect;
        offsetY = (containerHeight - displayHeight) / 2;
      }
    } else if (fit === 'cover') {
      if (containerAspect > virtualAspect) {
        displayWidth = containerWidth;
        displayHeight = containerWidth / virtualAspect;
      } else {
        displayHeight = containerHeight;
        displayWidth = containerHeight * virtualAspect;
      }
    } else if (fit === 'fill') {
      displayWidth = containerWidth;
      displayHeight = containerHeight;
    } else if (fit === 'exact') {
      displayWidth = virtualWidth;
      displayHeight = virtualHeight;
    }

    // Apply min/max scale constraints
    const rawScale = displayWidth / virtualWidth;
    const clampedScale = Math.max(minScale, Math.min(maxScale, rawScale));
    displayWidth = Math.round(virtualWidth * clampedScale);
    displayHeight = Math.round(virtualHeight * clampedScale);

    const bufferWidth = Math.floor(displayWidth * dpr);
    const bufferHeight = Math.floor(displayHeight * dpr);

    // Apply buffer sizing to the canvas element
    if (canvas.width !== bufferWidth) canvas.width = bufferWidth;
    if (canvas.height !== bufferHeight) canvas.height = bufferHeight;

    // Apply CSS display sizing
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    canvas.style.touchAction = 'none';
    canvas.style.userSelect = 'none';
    (canvas.style as any).webkitUserSelect = 'none';

    const info: CanvasScaleInfo = {
      virtualWidth,
      virtualHeight,
      displayWidth,
      displayHeight,
      bufferWidth,
      bufferHeight,
      dpr,
      scaleX: displayWidth / virtualWidth,
      scaleY: displayHeight / virtualHeight,
      scale: clampedScale,
      offsetX,
      offsetY,
    };

    setScaleInfo(info);
    onResize?.(info);
  }, [virtualWidth, virtualHeight, fit, minScale, maxScale, dprCap, onResize]);

  // Context setup helper: resets transform matrix and applies DPR scaling
  const setupCanvasContext = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const dpr = scaleInfo.dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    },
    [scaleInfo.dpr]
  );

  // Coordinate normalizer bound to this instance
  const getPointerPos = useCallback(
    (event: SupportedPointerEvent) => {
      return getCanvasPointerPos(event, canvasRef.current, virtualWidth, virtualHeight);
    },
    [virtualWidth, virtualHeight]
  );

  // Set up observers and event listeners
  useEffect(() => {
    updateDimensions();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateDimensions();
      });
      resizeObserver.observe(containerRef.current);
    }

    const handleWindowResize = () => updateDimensions();
    const handleOrientationChange = () => {
      setTimeout(updateDimensions, 100);
    };

    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Watch for devicePixelRatio / Retina changes
    let dprMediaQuery: MediaQueryList | null = null;
    const handleDprChange = () => updateDimensions();
    if (typeof window !== 'undefined' && window.matchMedia) {
      dprMediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      try {
        dprMediaQuery.addEventListener('change', handleDprChange);
      } catch {
        dprMediaQuery.addListener?.(handleDprChange);
      }
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (dprMediaQuery) {
        try {
          dprMediaQuery.removeEventListener('change', handleDprChange);
        } catch {
          dprMediaQuery.removeListener?.(handleDprChange);
        }
      }
    };
  }, [updateDimensions]);

  return {
    canvasRef,
    containerRef,
    scaleInfo,
    scale: scaleInfo.scale,
    dpr: scaleInfo.dpr,
    displayWidth: scaleInfo.displayWidth,
    displayHeight: scaleInfo.displayHeight,
    virtualWidth,
    virtualHeight,
    isTouchDevice,
    getPointerPos,
    setupCanvasContext,
    recalculate: updateDimensions,
  };
}
