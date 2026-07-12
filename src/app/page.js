"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Settings as SettingsIcon } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import ProcessingResults from "@/components/ProcessingResults";
import ProcessOptionsModal from "@/components/ProcessOptionsModal";
import {
  HcsBrandNavbar,
  navActionClass,
  navActionPrimaryClass,
} from "@/components/hcs-brand-navbar";
import { toastUtils } from "@/lib/utils";
import { PageSkeleton } from "@/components/SkeletonLoader";

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [config, setConfig] = useState(null);
  const [results, setResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [showProcessModal, setShowProcessModal] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoadingConfig(true);
      const response = await fetch("/api/config?type=strategy");
      const data = await response.json();
      if (data.success) {
        const strategies = data.data || [];
        const defaultStrategy =
          strategies.find((s) => s.name === "Default Strategy") ||
          strategies[0] ||
          null;
        setConfig(defaultStrategy);
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

  const handleProcessClick = () => {
    if (!uploadedFile || !config) {
      toastUtils.error("Please upload a CSV file and configure settings");
      return;
    }
    setShowProcessModal(true);
  };

  const handleProcess = async (processOptions) => {
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
      formData.append("options", JSON.stringify(processOptions));

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
      setShowProcessModal(false);
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
      const opts = results.processOptions;
      const suffix =
        opts && !opts.includePriceUp
          ? "price_down"
          : opts && !opts.includePriceDown
            ? "price_up"
            : "all";
      link.download = `pricing_results_${suffix}.csv`;
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
    <main className="min-h-screen bg-slate-950 text-slate-50 pb-12">
      <HcsBrandNavbar
        title="Pricing Engine"
        subtitle="HCS Pricing Hub"
        homeHref="/"
        right={
          <>
            <Link href="/dashboard" className={navActionPrimaryClass}>
              <span>Dashboard</span>
            </Link>
            <Link href="/settings" className={navActionClass}>
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Configuration</span>
              <span className="sm:hidden">Config</span>
            </Link>
          </>
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
                  onClick={handleProcessClick}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-[#00dbcc] text-slate-900 font-semibold rounded-lg hover:bg-teal-400 disabled:bg-teal-800/50 disabled:text-slate-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:shadow-md text-sm sm:text-base"
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
                  <div className="flex items-center justify-center gap-2 text-[#00dbcc] bg-slate-800 rounded-lg px-4 py-3 border border-[#00dbcc]/30">
                    <div className="w-4 h-4 border-2 border-[#00dbcc] border-t-transparent rounded-full animate-spin" />
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

      <ProcessOptionsModal
        open={showProcessModal}
        onOpenChange={setShowProcessModal}
        onConfirm={handleProcess}
        isProcessing={isProcessing}
      />
    </main>
  );
}
