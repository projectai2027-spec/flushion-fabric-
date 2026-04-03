"use client";

import { useState } from "react";
import UploadZone from "@/components/UploadZone";

// --- DYNAMIC API URL CONFIGURATION ---
// Ye line check karegi ki Vercel environment variable hai ya nahi, 
// warna default Render ki link use karega.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://flushion-fabric.onrender.com";

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

      // FIXED: Using Dynamic API_URL
      const res = await fetch(`${API_URL}/api/generate-prompt`, { method: "POST", body: formData });

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
      alert("Fabric Analysis Failed:\n" + e.message);
      setStep("upload");
    }
  };

  const handleGenerateBase = async () => {
    if (!uploadedFile) return;
    setStep("generating_base");
    try {
      const base64Data = await fileToBase64(uploadedFile);

      // FIXED: Using Dynamic API_URL
      const res = await fetch(`${API_URL}/api/generate-final-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      alert("Generation Failed:\n" + e.message);
      setStep("editor");
    }
  };

  const handleSaveAndGenerateAlts = async () => {
    if (!uploadedFile) return;
    setStep("generating_alts");

    try {
      // FIXED: Using Dynamic API_URL
      await fetch(`${API_URL}/api/learn-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      // FIXED: Using Dynamic API_URL
      const res = await fetch(`${API_URL}/api/generate-alternates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      alert("Alternate Generations Failed:\n" + e.message);
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
      alert("Download Failed: External API CORS error.");
    }
  };

  // ... (Baaki UI code waisa hi rahega)
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[85vh] py-10 relative">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-rose-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse-slow"></div>
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-float"></div>

      {step === "upload" && (
        <>
          <div className="text-center mb-16 relative z-10 max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
              AI Fabric to <span className="text-gradient">Runway</span>
            </h1>
            <p className="text-xl text-neutral-400 font-light mx-auto leading-relaxed">
              Upload your raw fabric and let Gemini Analyze its texture. Generate REAL 4K fashion outputs instantly!
            </p>
          </div>
          <div className="z-10 w-full"><UploadZone onUpload={handleUpload} /></div>
        </>
      )}

      {step === "analyzing" && (
        <div className="z-10 flex flex-col items-center gap-6 animate-in fade-in">
          <div className="w-20 h-20 rounded-full border-t-2 border-rose-500 animate-spin"></div>
          <h2 className="text-2xl font-bold text-white">Gemini is Analyzing Fabric...</h2>
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
                <p className="text-sm text-neutral-400 mb-2">Generated Prompt (Editable)</p>
                <textarea
                  className="w-full flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-md font-mono focus:outline-none focus:border-rose-500/50 resize-none shadow-inner"
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <p className="text-sm text-neutral-400 mb-2">Additional Instructions</p>
                <input
                  type="text"
                  placeholder="e.g. Ensure the stitching is explicitly visible"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-violet-500/50 font-mono text-sm"
                  value={userInstructions}
                  onChange={(e) => setUserInstructions(e.target.value)}
                />
              </div>
              <div className="mt-2 flex justify-end gap-4">
                <button onClick={handleGenerateBase} className="px-8 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-violet-600 text-white font-bold tracking-wide shadow-lg shadow-rose-500/20 hover:scale-105 transition-all">✨ Generate 4K Base Image</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === "generating_base" && (
        <div className="z-10 flex flex-col items-center gap-6 animate-in fade-in">
          <div className="w-20 h-20 rounded-full border-t-2 border-violet-500 animate-spin"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Processing API Request...</h2>
          <p className="text-neutral-400 text-sm max-w-md text-center"></p>
        </div>
      )}

      {step === "generated_base" && generatedBaseImage && (
        <div className="z-10 w-full max-w-5xl glass-panel p-8 animate-in fade-in slide-in-from-bottom-8">
          <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4">🎉 Generated 4K Base Image</h2>
          <img src={generatedBaseImage} className="w-full aspect-square object-cover rounded-2xl border border-white/10 shadow-lg" />
        </div>
      )}

      {step === "alts_ready" && (
        <div className="z-10 w-full max-w-5xl glass-panel p-8 animate-in fade-in slide-in-from-bottom-8">
          <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4">🎉 Generated Alternate Images</h2>
          <div className="flex flex-col gap-4">
            {generatedAlts.map((alt, index) => (
              <img key={index} src={alt} className="w-full aspect-square object-cover rounded-2xl border border-white/10 shadow-lg" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
