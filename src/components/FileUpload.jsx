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
    <div className="bg-white rounded-xl border border-neutral-200/50 p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2">
          Upload CSV File
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500">
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
              ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 scale-[1.02] shadow-lg"
              : "border-neutral-300 hover:border-blue-400 hover:bg-neutral-50/50"
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
            <div className={`p-4 rounded-full transition-all duration-300 ${
              isDragOver 
                ? "bg-blue-100 scale-110" 
                : "bg-neutral-100"
            }`}>
              <Upload className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${
                isDragOver ? "text-blue-600" : "text-neutral-400"
              }`} />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-base sm:text-lg text-neutral-900">
                Drag and drop your CSV file
              </p>
              <p className="text-sm sm:text-base text-neutral-600">
                or <span className="text-blue-600 font-medium">click to browse</span>
              </p>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Supports .csv files only
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 sm:p-5 shadow-md">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-green-900 text-sm sm:text-base">
                File uploaded successfully
              </p>
              <p className="text-sm sm:text-base text-green-800 truncate mt-1 font-medium">
                {uploadedFile.name}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-xs sm:text-sm text-green-700">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
                <span className="text-green-400">•</span>
                <p className="text-xs sm:text-sm text-green-700">
                  Ready to process
                </p>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="text-green-600 hover:text-green-700 hover:bg-green-100 rounded-lg p-2 transition-colors flex-shrink-0"
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
