import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, RotateCw, Hand, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  value?: string;
  onChange: (dataUrl: string) => void;
  className?: string;
}

export function SignaturePad({ value, onChange, className }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "black"; // Force black for signatures
    
    // Clear canvas and redraw if value exists
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
      img.src = value;
    }
  };

  useEffect(() => {
    initCanvas();
    window.addEventListener('resize', initCanvas);
    return () => window.removeEventListener('resize', initCanvas);
  }, [isFullscreen, isLandscape]);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      const mouseEvent = e as React.MouseEvent;
      x = mouseEvent.clientX - rect.left;
      y = mouseEvent.clientY - rect.top;
    }

    return { x, y };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    // Prevent scrolling when signing
    if (e.cancelable) e.preventDefault();
    
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();
    
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && hasDrawn) {
      onChange(canvas.toDataURL("image/png"));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onChange("");
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div 
        ref={containerRef}
        className={cn(
          "relative group border border-white/10 rounded-2xl bg-white overflow-hidden transition-all duration-500 shadow-inner",
          isFullscreen ? "fixed inset-0 z-[100] rounded-none bg-white flex flex-col items-center justify-center p-4" : "h-48 w-full"
        )}
      >
        {/* Indicators and Guidelines */}
        {!hasDrawn && !isFullscreen && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20 transition-opacity group-hover:opacity-10">
            <Hand className="w-10 h-10 mb-2 text-black" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black">Sign Here</p>
          </div>
        )}

        {isFullscreen && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none text-center w-full px-10">
            <div className="bg-violet-500/10 text-violet-600 px-4 py-2 rounded-full inline-flex items-center gap-2 border border-violet-500/20 animate-bounce">
              <RotateCw className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Rotate device for larger area</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 font-medium uppercase tracking-widest flex items-center justify-center gap-2">
              <Hand className="w-3 h-3" /> Please sign horizontally in the space below
            </p>
          </div>
        )}

        {/* The Signature Area */}
        <div className={cn(
          "w-full h-full relative",
          isFullscreen ? "max-w-4xl h-[60vh] border-2 border-dashed border-slate-200 rounded-3xl mt-12 bg-slate-50/30" : ""
        )}>
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          
          {/* Baseline Indicator */}
          <div className="absolute bottom-[20%] left-10 right-10 border-b border-slate-200 pointer-events-none" />
        </div>

        {/* Controls */}
        <div className={cn(
          "absolute flex gap-2 transition-all duration-300",
          isFullscreen ? "bottom-8 right-8 left-8" : "bottom-3 right-3 opacity-0 group-hover:opacity-100"
        )}>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={clear}
            className="rounded-xl h-9 px-4 bg-white/90 backdrop-blur border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
          >
            Clear
          </Button>
          <Button 
            type="button" 
            variant={isFullscreen ? "default" : "outline"}
            size="sm" 
            onClick={toggleFullscreen}
            className={cn(
              "rounded-xl h-9 px-4 backdrop-blur shadow-sm",
              isFullscreen ? "bg-violet-600 hover:bg-violet-700 text-white border-none" : "bg-white/90 border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {isFullscreen ? (
              <><Minimize2 className="w-4 h-4 mr-2" /> Done</>
            ) : (
              <><Maximize2 className="w-4 h-4 mr-2" /> Full Screen</>
            )}
          </Button>
        </div>
      </div>
      
      {!isFullscreen && (
        <div className="flex items-center gap-2 px-2">
          <Info className="w-3 h-3 text-slate-400" />
          <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">
            Tap "Full Screen" for a better mobile signing experience
          </p>
        </div>
      )}
    </div>
  );
}
