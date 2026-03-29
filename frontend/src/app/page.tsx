"use client";

import { useState } from "react";
import UploadZone from "@/components/UploadZone";

export default function Home() {
  const [step, setStep] = useState<"upload" | "analyzing" | "editor" | "generating_base" | "base_ready" | "generating_alts" | "alts_ready">("upload");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fabricId, setFabricId] = useState("");
  
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [editedPrompt, setEditedPrompt] = useState("");
  const [userInstructions, setUserInstructions] = useState("");
  
  const [baseImage, setBaseImage] = useState("");
  const [alts, setAlts] = useState<any[]>([]);

  // Base64 helper
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleUpload = async (file: File) => {
    setUploadedFile(file);
    setStep("analyzing");
    
    try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("http://localhost:8000/api/generate-prompt", { method: "POST", body: formData });
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || "API Error");
        }
        const data = await res.json();
        setOriginalPrompt(data.suggested_prompt);
        setEditedPrompt(data.suggested_prompt);
        setFabricId(data.fabric_id);
        setStep("editor");
    } catch (e: any) {
        alert("Real API Fabric Analysis Failed:\n" + e.message);
        setStep("upload");
    }
  };

  const handleGenerateBase = async () => {
    if (!uploadedFile) return;
    setStep("generating_base");
    try {
        const base64Data = await fileToBase64(uploadedFile);
        const res = await fetch("http://localhost:8000/api/generate-final-image", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: editedPrompt, fabric_base64: base64Data })
        });
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || "API Error");
        }
        const data = await res.json();
        setBaseImage(data.image_url);
        setStep("base_ready");
    } catch (e: any) {
        alert("Real Generation Failed:\n" + e.message);
        setStep("editor"); // Fallback to editor so they don't lose prompt
    }
  };

  const handleSaveAndGenerateAlts = async () => {
    if (!uploadedFile) return;
    setStep("generating_alts");
    
    try {
      await fetch("http://localhost:8000/api/learn-prompt", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           fabric_id: fabricId,
           original_prompt: originalPrompt,
           edited_prompt: editedPrompt,
           user_instructions: userInstructions,
           fabric_features: "Extracted from fabric logic"
        })
      });
    } catch (e) {
      console.error("Failed to learn prompt.", e);
    }

    try {
        const base64Data = await fileToBase64(uploadedFile);
        const res = await fetch("http://localhost:8000/api/generate-alternates", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: editedPrompt, fabric_base64: base64Data })
        });
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || "API Error");
        }
        const data = await res.json();
        setAlts(data.styles);
        setStep("alts_ready");
    } catch (e: any) {
        alert("Real Alternate Generations Failed:\n" + e.message);
        setStep("base_ready");
    }
  };

  const handleDownload4K = async (src: string, filename: string) => {
    try {
        const response = await fetch(src);
        const blob = await response.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_4K.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        alert("Failed to download image from External API CORS/URL Error.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[85vh] py-10 relative">
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-rose-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse-slow"></div>
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-float"></div>

      {step === "upload" && (
        <>
          <div className="text-center mb-16 relative z-10 max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
              AI Fabric to <span className="text-gradient">Runway</span>
            </h1>
            <p className="text-xl text-neutral-400 font-light mx-auto leading-relaxed">
              Upload your raw fabric and let Gemini 3.1 Pro analyze its texture. Then generate REAL 4K fashion outputs instantly!
            </p>
          </div>
          <div className="z-10 w-full"><UploadZone onUpload={handleUpload} /></div>
        </>
      )}

      {step === "analyzing" && (
        <div className="z-10 flex flex-col items-center gap-6 animate-in fade-in">
           <div className="w-20 h-20 rounded-full border-t-2 border-rose-500 animate-spin"></div>
           <h2 className="text-2xl font-bold text-white">Gemini 3.1 Pro is Analyzing Fabric...</h2>
        </div>
      )}

      {step === "editor" && uploadedFile && (
        <div className="z-10 w-full max-w-5xl glass-panel p-8 animate-in fade-in slide-in-from-bottom-8">
            <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4">📝 Prompt Editor</h2>
            <div className="flex gap-8 flex-col md:flex-row">
               <div className="w-full md:w-1/3">
                   <p className="text-sm text-neutral-400 mb-2">Uploaded Texture</p>
                   <img src={URL.createObjectURL(uploadedFile)} className="w-full aspect-square object-cover rounded-2xl border border-white/10 shadow-lg" />
               </div>
               <div className="w-full md:w-2/3 flex flex-col gap-4">
                   <div className="flex flex-col flex-1">
                     <p className="text-sm text-neutral-400 mb-2">Gemini Generated Prompt (Editable)</p>
                     <textarea 
                       className="w-full flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-md font-mono focus:outline-none focus:border-rose-500/50 resize-none shadow-inner"
                       value={editedPrompt}
                       onChange={(e) => setEditedPrompt(e.target.value)}
                     />
                   </div>
                   <div className="flex flex-col">
                     <p className="text-sm text-neutral-400 mb-2">Additional Instructions (Optional for AI Learning)</p>
                     <input 
                       type="text"
                       placeholder="e.g. Ensure the stitching is explicitly visible"
                       className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-violet-500/50 font-mono text-sm"
                       value={userInstructions}
                       onChange={(e) => setUserInstructions(e.target.value)}
                     />
                   </div>
                   <div className="mt-2 flex justify-end gap-4">
                      <button onClick={handleGenerateBase} className="px-8 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-violet-600 text-white font-bold tracking-wide shadow-lg shadow-rose-500/20 hover:scale-105 transition-all">✨ Generate Actual 4K Base Image</button>
                   </div>
               </div>
            </div>
        </div>
      )}

      {step === "generating_base" && (
        <div className="z-10 flex flex-col items-center gap-6 animate-in fade-in">
           <div className="w-20 h-20 rounded-full border-t-2 border-violet-500 animate-spin"></div>
           <h2 className="text-2xl font-bold text-white mb-2">Nano Banana 3 Processing API Request...</h2>
           <p className="text-neutral-400 text-sm max-w-md text-center">Rendering real base 4K garment with SDK texture mapping. This may take a minute...</p>
        </div>
      )}

      {(step === "base_ready" || step === "generating_alts" || step === "alts_ready") && (
        <div className="z-10 w-full max-w-6xl glass-panel p-8 animate-in zoom-in duration-500">
           <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
              <h2 className="text-3xl font-extrabold group">Core Collection Output <span className="opacity-0 group-hover:opacity-100 text-rose-400 transition-all text-sm ml-2 tracking-widest font-mono">SDXL 4K LIVE</span></h2>
              <button onClick={() => { setStep("upload"); setBaseImage(""); setAlts([]); }} className="px-5 py-2 rounded-xl bg-white/10 text-sm font-medium hover:bg-white/20">Start New Batch</button>
           </div>
           
           <div className="flex flex-col lg:flex-row gap-10">
              {/* Massive 4K Base Slot */}
              <div className="w-full lg:w-5/12 flex flex-col gap-4">
                 <p className="text-lg font-bold text-neutral-300">Master Base Output</p>
                 <div className="w-full aspect-[3/4] rounded-3xl overflow-hidden relative border-2 border-rose-500/30 shadow-[0_0_50px_rgba(225,29,72,0.1)] group bg-black">
                    {baseImage ? (
                        <>
                            <img src={baseImage} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center p-6 backdrop-blur-sm z-20">
                                <button onClick={() => handleDownload4K(baseImage, "Base_Output")} className="px-6 py-3 bg-blue-500/40 border border-blue-400 rounded-xl text-white font-bold font-mono text-sm shadow-xl relative z-30 cursor-pointer">↓ Download 4K Original</button>
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center absolute inset-0 text-white/20 font-mono text-sm">AWAITING REAL API...</div>
                    )}
                 </div>
                 
                 {step === "base_ready" && (
                    <button onClick={handleSaveAndGenerateAlts} className="w-full py-4 mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl text-white font-bold tracking-wide hover:shadow-[0_0_30px_rgba(124,58,237,0.3)] hover:-translate-y-1 transition-all z-30 cursor-pointer relative">
                       💾 Save Output & Generate 6 Live Styles
                    </button>
                 )}
                 {step === "generating_alts" && (
                    <div className="w-full py-4 mt-2 border border-white/20 rounded-2xl flex justify-center items-center text-neutral-400 font-mono text-sm gap-3">
                        <span className="w-4 h-4 border-t-2 border-indigo-500 rounded-full animate-spin"></span> Awaiting Real API Variations...
                    </div>
                 )}
              </div>

              {/* 6 Variations Grid */}
              <div className="w-full lg:w-7/12 flex flex-col gap-4">
                 <p className="text-lg font-bold text-neutral-300">Live Fabric Variations (Upscaled)</p>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {step === "alts_ready" ? alts.map((alt, idx) => (
                       <div key={idx} className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 relative group bg-neutral-900 shadow-xl">
                          {alt.image_url ? <img src={alt.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">NO IMG</div>}
                          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded-md border border-white/10 text-[10px] text-white/90 font-mono font-bold z-10">{alt.item.toUpperCase()}</div>
                          
                          {alt.image_url && (
                              <>
                                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-10 backdrop-blur-[2px] pointer-events-none"></div>
                                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                                     <button onClick={() => handleDownload4K(alt.image_url, alt.item)} className="px-4 py-2 bg-blue-500/30 border border-blue-400/50 rounded-lg text-white font-medium text-xs shadow-xl min-w-[120px] pointer-events-auto cursor-pointer">↓ Save 4K PNG</button>
                                  </div>
                              </>
                          )}
                          <div className="absolute bottom-2 left-2 right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-auto">
                             <button className="flex-1 py-1.5 bg-green-500/30 hover:bg-green-500/50 border border-green-400/50 rounded text-xs transition-colors cursor-pointer">✅</button>
                             <button className="flex-1 py-1.5 bg-red-500/30 hover:bg-red-500/50 border border-red-400/50 rounded text-xs transition-colors cursor-pointer">❌</button>
                          </div>
                       </div>
                    )) : (
                       Array(6).fill(0).map((_, i) => (
                          <div key={i} className="aspect-[3/4] rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-center flex-col gap-2 relative">
                             {step === "generating_alts" ? <div className="w-6 h-6 border-t-2 border-rose-500 rounded-full animate-spin" /> : <div className="text-white/20 font-mono text-[10px] break-words text-center">BLANK<br/>SLOT {i+1}</div>}
                          </div>
                       ))
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
