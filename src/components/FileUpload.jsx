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
    <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-neutral-900 mb-4">
        Upload CSV File
      </h2>

      {!uploadedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragOver
              ? "border-blue-500 bg-blue-50"
              : "border-neutral-300 hover:border-neutral-400"
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
            className="flex flex-col items-center gap-3"
          >
            <Upload className="w-8 h-8 text-neutral-400" />
            <div>
              <p className="font-medium text-neutral-900">
                Drag and drop your CSV file
              </p>
              <p className="text-sm text-neutral-600 mt-1">
                or click to browse
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-green-900">File uploaded</p>
              <p className="text-sm text-green-700 truncate mt-1">
                {uploadedFile.name}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {(uploadedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={handleClear}
              className="text-green-600 hover:text-green-700 flex-shrink-0 mt-0.5"
              aria-label="Remove file"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-neutral-500 mt-4">
        Expected columns: stock_id, current_price, age_days, rating_band,
        days_since_last_change, benchmark_price
      </p>
    </div>
  );
}
