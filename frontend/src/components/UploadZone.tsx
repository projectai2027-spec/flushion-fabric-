"use client";

import { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon } from "lucide-react";

export default function UploadZone({ onUpload }: { onUpload: (file: File) => void }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className={`relative group w-full max-w-3xl mx-auto rounded-[2.5rem] p-[2px] overflow-hidden transition-all duration-500 ease-out`}>
      <div className={`absolute inset-0 bg-gradient-to-br from-rose-500/50 via-violet-600/50 to-fuchsia-500/50 opacity-40 group-hover:opacity-100 transition-opacity duration-700 ${isDragActive ? 'opacity-100 animate-pulse' : ''}`} />
      <div 
        className={`relative z-10 glass-panel h-80 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 w-full ${isDragActive ? 'bg-white/[0.04] border-white/30 scale-[0.98]' : 'hover:bg-white/[0.03]'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleChange} accept="image/*" />
        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 shadow-xl transition-transform duration-500">
          <UploadCloud className={`w-8 h-8 ${isDragActive ? 'text-rose-400 animate-bounce' : 'text-neutral-300'}`} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Drop your fabric</h2>
        <p className="text-neutral-400 text-center max-w-sm mb-6 pb-2 text-md">
          Upload <span className="text-rose-400 font-medium">high-res</span> fabric image for Gemini 3.1 Pro pattern analysis.
        </p>
        <div className="px-6 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold hover:bg-white/20 transition-all flex items-center gap-3">
            <ImageIcon className="w-4 h-4" /> Browse
        </div>
      </div>
    </div>
  );
}
