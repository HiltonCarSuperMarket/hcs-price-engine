"use client";

import { useState, useRef } from "react";
import { Upload, X, CheckCircle } from "lucide-react";

export default function FileUpload({ onFileUpload, uploadedFile }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        onFileUpload(file);
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleClear = () => {
    onFileUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-slate-800 border border-white/5 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl hover:border-teal-400/20 transition-all duration-300">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-50 mb-2">
          Upload CSV File
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Expected columns: stock_id, current_price, age_days, rating_band,
          days_since_last_change, benchmark_price
        </p>
      </div>

      {!uploadedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 sm:p-8 lg:p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragOver
              ? "border-[#00dbcc] bg-teal-950/30 scale-[1.02] shadow-lg"
              : "border-white/10 hover:border-[#00dbcc]/50 hover:bg-slate-900/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-4"
          >
            <div
              className={`p-4 rounded-full transition-all duration-300 ${
                isDragOver ? "bg-teal-900/50 scale-110" : "bg-slate-900"
              }`}
            >
              <Upload
                className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${
                  isDragOver ? "text-[#00dbcc]" : "text-slate-500"
                }`}
              />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-base sm:text-lg text-slate-50">
                Drag and drop your CSV file
              </p>
              <p className="text-sm sm:text-base text-slate-400">
                or{" "}
                <span className="text-[#00dbcc] font-medium">click to browse</span>
              </p>
            </div>
            <p className="text-xs text-slate-500 mt-2">Supports .csv files only</p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950/40 border-2 border-emerald-500/30 rounded-xl p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 bg-emerald-900/50 rounded-full flex-shrink-0">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-emerald-300 text-sm sm:text-base">
                File uploaded successfully
              </p>
              <p className="text-sm sm:text-base text-emerald-200 truncate mt-1 font-medium">
                {uploadedFile.name}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-xs sm:text-sm text-emerald-400/80">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
                <span className="text-emerald-600">•</span>
                <p className="text-xs sm:text-sm text-emerald-400/80">
                  Ready to process
                </p>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30 rounded-lg p-2 transition-colors flex-shrink-0"
              aria-label="Remove file"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
