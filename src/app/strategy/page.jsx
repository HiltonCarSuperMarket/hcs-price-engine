"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Plus, Trash2, Save } from "lucide-react";
import StrategyConfigurator from "@/components/StrategyConfigurator";
import StrategyList from "@/components/StrategyList";

export default function StrategyPage() {
  const [strategies, setStrategies] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("list");
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/config");
      const data = await response.json();

      if (data.success) {
        setStrategies(data.data);
        if (data.data.length > 0) {
          setSelectedStrategy(data.data[0]);
        }
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load strategies" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStrategy = async (strategy) => {
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          config: strategy,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: data.message || "Strategy saved successfully" });
        setTimeout(() => setMessage(null), 4000);
        loadStrategies();
        setActiveTab("list");
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to save strategy",
        });
        setTimeout(() => setMessage(null), 4000);
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error saving strategy" });
      setTimeout(() => setMessage(null), 4000);
      console.error("Save strategy error:", error);
    }
  };

  const handleDeleteStrategy = async (strategyId) => {
    const strategy = strategies.find(s => s._id === strategyId);
    
    if (strategy?.name === "Default Strategy") {
      setMessage({ type: "error", text: "Cannot delete default strategy" });
      setTimeout(() => setMessage(null), 4000);
      return;
    }

    if (!confirm("Are you sure you want to delete this strategy?")) return;

    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          id: strategyId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: data.message || "Strategy deleted successfully" });
        setTimeout(() => setMessage(null), 4000);
        loadStrategies();
        setSelectedStrategy(null);
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to delete strategy",
        });
        setTimeout(() => setMessage(null), 4000);
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error deleting strategy" });
      setTimeout(() => setMessage(null), 4000);
      console.error("Delete strategy error:", error);
    }
  };

  const handleNewStrategy = () => {
    setSelectedStrategy(null);
    setActiveTab("edit");
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">
              Strategy Configuration
            </h1>
            <p className="text-neutral-600 mt-1">
              Manage pricing strategies and bands
            </p>
          </div>
          <button
            onClick={handleNewStrategy}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            New Strategy
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mx-6 mt-4 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12 text-neutral-600">
            Loading strategies...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar - Strategy List */}
            <div className="lg:col-span-1">
              <StrategyList
                strategies={strategies}
                selectedStrategy={selectedStrategy}
                onSelect={(strategy) => {
                  setSelectedStrategy(strategy);
                  setActiveTab("edit");
                }}
                onDelete={handleDeleteStrategy}
              />
            </div>

            {/* Main Content - Strategy Editor */}
            <div className="lg:col-span-2">
              {activeTab === "edit" && selectedStrategy ? (
                <StrategyConfigurator
                  strategy={selectedStrategy}
                  onSave={handleSaveStrategy}
                  onCancel={() => {
                    setActiveTab("list");
                    setSelectedStrategy(null);
                  }}
                />
              ) : activeTab === "edit" ? (
                <StrategyConfigurator
                  strategy={null}
                  onSave={handleSaveStrategy}
                  onCancel={() => {
                    setActiveTab("list");
                    setSelectedStrategy(null);
                  }}
                />
              ) : (
                <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
                  <p className="text-neutral-600">
                    Select a strategy to edit or create a new one
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
