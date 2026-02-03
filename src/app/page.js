"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import ConfigPanel from "@/components/ConfigPanel";
import ProcessingResults from "@/components/ProcessingResults";

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [config, setConfig] = useState(null);
  const [results, setResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [strategies, setStrategies] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [loadingStrategies, setLoadingStrategies] = useState(false);

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      setLoadingStrategies(true);
      const response = await fetch("/api/config");
      const data = await response.json();
      if (data.success) {
        setStrategies(data.data);
        // Auto-select the first strategy
        if (data.data.length > 0) {
          selectStrategy(data.data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load strategies:", error);
    } finally {
      setLoadingStrategies(false);
    }
  };

  const selectStrategy = (strategy) => {
    setSelectedStrategy(strategy);
    setConfig(strategy);
  };

  const handleFileUpload = (file) => {
    setUploadedFile(file);
    setError(null);
    setResults(null);
  };

  const handleConfigSave = (newConfig) => {
    setConfig(newConfig);
    setError(null);
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
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">
                Pricing Engine
              </h1>
              <p className="text-neutral-600 mt-1">
                Upload CSV files and process with your pricing strategies
              </p>
            </div>
            <Link
              href="/strategy"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Settings className="w-4 h-4" />
              Manage Strategies
            </Link>
          </div>

          {/* Strategy Selector */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-neutral-700">
              Select Strategy:
            </label>
            <select
              value={selectedStrategy?.name || ""}
              onChange={(e) => {
                const strategy = strategies.find(
                  (s) => s.name === e.target.value,
                );
                if (strategy) selectStrategy(strategy);
              }}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loadingStrategies}
            >
              {strategies.map((strategy) => (
                <option key={strategy.name} value={strategy.name}>
                  {strategy.name}
                </option>
              ))}
            </select>
            {selectedStrategy && (
              <p className="text-sm text-neutral-600">
                {selectedStrategy.description}
              </p>
            )}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Section */}
            <div className="lg:col-span-1">
              <FileUpload
                onFileUpload={handleFileUpload}
                uploadedFile={uploadedFile}
              />
            </div>

            {/* Config Section */}
            <div className="lg:col-span-2">
              <ConfigPanel
                onConfigSave={handleConfigSave}
                onProcess={handleProcess}
                isProcessing={isProcessing}
                readyToProcess={uploadedFile && config}
              />
            </div>
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
