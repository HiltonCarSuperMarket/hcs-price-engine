"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Settings as SettingsIcon, Sparkles } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import ProcessingResults from "@/components/ProcessingResults";
import { toastUtils } from "@/lib/utils";
import { PageSkeleton } from "@/components/SkeletonLoader";
import { HcsBrandNavbar } from "@/components/hcs-brand-navbar";

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [config, setConfig] = useState(null);
  const [results, setResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoadingConfig(true);
      const response = await fetch("/api/config");
      const data = await response.json();
      if (data.success) {
        setConfig(data.data);
      } else {
        toastUtils.error(data.error || "Failed to load configuration");
      }
    } catch (error) {
      console.error("Failed to load configuration:", error);
      toastUtils.error("Failed to load configuration");
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const handleFileUpload = (file) => {
    setUploadedFile(file);
    setResults(null);
    if (file) {
      toastUtils.success(`File "${file.name}" uploaded successfully`);
    }
  };

  const handleProcess = async () => {
    if (!uploadedFile || !config) {
      toastUtils.error("Please upload a CSV file and configure settings");
      return;
    }

    setIsProcessing(true);
    const loadingToast = toastUtils.loading("Processing your file...");

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("config", JSON.stringify(config));

      const response = await fetch("/api/process", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Processing failed");
      }

      const data = await response.json();
      toastUtils.dismiss(loadingToast);
      toastUtils.success("File processed successfully!");
      setResults(data);
    } catch (err) {
      toastUtils.dismiss(loadingToast);
      toastUtils.error(err.message || "An error occurred during processing");
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

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "pricing_results.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toastUtils.success("File downloaded successfully!");
    } catch (err) {
      toastUtils.error(err.message || "Failed to download file");
    }
  };

  if (isLoadingConfig) {
    return <PageSkeleton />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50/30">
      <HcsBrandNavbar
        title="Pricing Engine"
        subtitle="HCS Strategy"
        homeHref="/"
        right={
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/25"
          >
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Configuration</span>
            <span className="sm:hidden">Config</span>
          </Link>
        }
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {!results ? (
          <div className="space-y-6 sm:space-y-8">
            {/* Upload Section */}
            <div className="w-full max-w-3xl mx-auto">
              <FileUpload
                onFileUpload={handleFileUpload}
                uploadedFile={uploadedFile}
              />
            </div>

            {/* Process Button */}
            {uploadedFile && config && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-3xl mx-auto">
                <button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-[#914f9e] from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:shadow-md text-sm sm:text-base"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Process File</span>
                    </>
                  )}
                </button>
                {isProcessing && (
                  <div className="flex items-center justify-center gap-2 text-blue-600 bg-blue-50 rounded-lg px-4 py-3 border border-blue-200">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm sm:text-base">
                      Processing your file...
                    </span>
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
