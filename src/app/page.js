"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Settings as SettingsIcon } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import ProcessingResults from "@/components/ProcessingResults";

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [config, setConfig] = useState(null);
  const [results, setResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/config");
      const data = await response.json();
      if (data.success) {
        setConfig(data.data);
      }
    } catch (error) {
      console.error("Failed to load configuration:", error);
    }
  };

  const handleFileUpload = (file) => {
    setUploadedFile(file);
    setError(null);
    setResults(null);
  };

  const handleProcess = async () => {
    if (!uploadedFile || !config) {
      setError("Please upload a CSV file and configure settings");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("config", JSON.stringify(config));

      const response = await fetch("/api/process", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Processing failed");
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message || "An error occurred during processing");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!results) return;

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(results.csv),
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "pricing_results.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download file");
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-neutral-900">
                Pricing Engine
              </h1>
              <p className="text-neutral-600 mt-1">
                Upload your stock CSV file and process it with intelligent
                pricing strategy
              </p>
            </div>
            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
            >
              <SettingsIcon className="w-4 h-4" />
              Configuration
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {!results ? (
          <div className="space-y-8">
            {/* Upload Section */}
            <div className="max-w-2xl">
              <FileUpload
                onFileUpload={handleFileUpload}
                uploadedFile={uploadedFile}
              />
            </div>

            {/* Process Button */}
            {uploadedFile && config && (
              <div className="flex items-center gap-4">
                <button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition"
                >
                  <Play className="w-5 h-5" />
                  {isProcessing ? "Processing..." : "Process File"}
                </button>
                {isProcessing && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Processing your file...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <ProcessingResults
            results={results}
            onDownload={handleDownload}
            onReset={() => setResults(null)}
          />
        )}
      </div>
    </main>
  );
}
