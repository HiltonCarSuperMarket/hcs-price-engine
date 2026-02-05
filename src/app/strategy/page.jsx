"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toastUtils } from "@/lib/utils";
import { TableSkeleton } from "@/components/SkeletonLoader";

export default function TargetMatrixEditor() {
  const [strategyId, setStrategyId] = useState(null);
  const [ageBands, setAgeBands] = useState([]);
  const [ratingBands, setRatingBands] = useState([]);
  const [targetMatrix, setTargetMatrix] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get strategy ID from URL or use default
        const params = new URLSearchParams(window.location.search);
        const id = params.get("id") || "default";
        setStrategyId(id);

        // Fetch target matrix data
        const response = await fetch(`/api/target-matrix?strategyId=${id}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to fetch data");
        }

        const {
          ageBands: bands,
          ratingBands: ratings,
          targetMatrix: matrix,
        } = result.data;

        setAgeBands(bands);
        setRatingBands(ratings);

        // Initialize matrix with existing values and empty rows for missing bands
        const initialMatrix = {};
        bands.forEach((band) => {
          initialMatrix[band] = {};
          ratings.forEach((rating) => {
            const ratingName = rating.name || rating;
            initialMatrix[band][ratingName] = matrix[band]?.[ratingName] ?? "";
          });
        });

        setTargetMatrix(initialMatrix);
      } catch (err) {
        console.error("Error fetching target matrix:", err);
        toastUtils.error(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle input change
  const handleInputChange = (ageBand, ratingBand, value) => {
    setTargetMatrix((prev) => ({
      ...prev,
      [ageBand]: {
        ...prev[ageBand],
        [ratingBand]: value,
      },
    }));
  };

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate all fields are filled
      const hasEmptyValues = Object.entries(targetMatrix).some(
        ([_, ratingData]) =>
          Object.values(ratingData).some(
            (val) => val === null || val === undefined || val === "",
          ),
      );

      if (hasEmptyValues) {
        toastUtils.error("Please fill in all values before saving");
        setSaving(false);
        return;
      }

      // Validate all values are numbers
      const hasInvalidValues = Object.entries(targetMatrix).some(
        ([_, ratingData]) =>
          Object.entries(ratingData).some(([_, val]) => isNaN(parseFloat(val))),
      );

      if (hasInvalidValues) {
        toastUtils.error("All values must be valid numbers");
        setSaving(false);
        return;
      }

      // Convert string values to numbers
      const matrixToSave = {};
      Object.entries(targetMatrix).forEach(([ageBand, ratingData]) => {
        matrixToSave[ageBand] = {};
        Object.entries(ratingData).forEach(([ratingBand, value]) => {
          matrixToSave[ageBand][ratingBand] = parseFloat(value);
        });
      });

      const loadingToast = toastUtils.loading("Saving target matrix...");

      const response = await fetch("/api/target-matrix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          strategyId,
          targetMatrix: matrixToSave,
        }),
      });

      const result = await response.json();

      toastUtils.dismiss(loadingToast);

      if (!result.success) {
        throw new Error(result.error || "Failed to save data");
      }

      toastUtils.success("Target matrix saved successfully!");
    } catch (err) {
      console.error("Error saving target matrix:", err);
      toastUtils.error(err.message || "Failed to save data");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50/30 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 space-y-3">
            <div className="h-10 w-64 bg-muted animate-pulse rounded-lg" />
            <div className="h-6 w-96 max-w-full bg-muted animate-pulse rounded-lg" />
          </div>
          <TableSkeleton rows={8} cols={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-neutral-900 to-blue-800 bg-clip-text text-transparent">
            Target Matrix Editor
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Configure target values for each age band and rating band
            combination
          </p>
        </div>

        {/* Table Card */}
        <Card className="overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gradient-to-r from-muted to-muted/80 border-b-2 border-neutral-200">
                  <th className="px-3 sm:px-4 py-3 text-left font-semibold text-sm sm:text-base border-r sticky left-0 bg-gradient-to-r from-muted to-muted/80 z-10">
                    Age Band
                  </th>
                  {ratingBands.map((band) => (
                    <th
                      key={band.name || band}
                      className="px-3 sm:px-4 py-3 text-center font-semibold text-xs sm:text-sm border-r last:border-r-0 whitespace-nowrap"
                    >
                      {band.name || band}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ageBands.map((ageBand, index) => (
                  <tr
                    key={ageBand}
                    className={`transition-colors ${
                      index % 2 === 0 
                        ? "bg-background hover:bg-neutral-50/50" 
                        : "bg-muted/30 hover:bg-muted/50"
                    }`}
                  >
                    <td className="px-3 sm:px-4 py-3 font-semibold text-sm sm:text-base border-r sticky left-0 bg-inherit z-10 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                      {ageBand}
                    </td>
                    {ratingBands.map((ratingBand) => {
                      const ratingName = ratingBand.name || ratingBand;
                      const value = targetMatrix[ageBand]?.[ratingName] ?? "";
                      const isEmpty =
                        value === null || value === undefined || value === "";

                      return (
                        <td
                          key={`${ageBand}-${ratingName}`}
                          className="px-2 sm:px-3 py-3 border-r last:border-r-0"
                        >
                          <div className="space-y-1">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={value}
                              onChange={(e) =>
                                handleInputChange(
                                  ageBand,
                                  ratingName,
                                  e.target.value,
                                )
                              }
                              className={`w-full text-center text-sm sm:text-base transition-all ${
                                isEmpty
                                  ? "border-yellow-400 bg-yellow-50/50 focus:border-yellow-500 focus:ring-yellow-200"
                                  : "border-input focus:border-blue-500 focus:ring-blue-200"
                              }`}
                              disabled={saving}
                            />
                            {isEmpty && (
                              <p className="text-xs text-yellow-600 font-medium text-center">
                                Required
                              </p>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>

        {/* Info Section */}
        <Card className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-br from-muted/50 to-muted/30 border-neutral-200">
          <h3 className="font-semibold mb-3 text-base sm:text-lg">Information</h3>
          <ul className="text-xs sm:text-sm text-muted-foreground space-y-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              Total Age Bands: <strong className="text-foreground">{ageBands.length}</strong>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              Total Rating Bands: <strong className="text-foreground">{ratingBands.length}</strong>
            </li>
            <li className="flex items-start gap-2 sm:col-span-2">
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0" />
              All fields marked with "Required" must be filled before saving
            </li>
            <li className="flex items-center gap-2 sm:col-span-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              Values must be valid numbers
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
