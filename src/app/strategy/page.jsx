"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TargetMatrixEditor() {
  const [strategyId, setStrategyId] = useState(null);
  const [ageBands, setAgeBands] = useState([]);
  const [ratingBands, setRatingBands] = useState([]);
  const [targetMatrix, setTargetMatrix] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(false);
        setError(null);

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
        setError(err.message || "Failed to load data");
        console.error("Error fetching target matrix:", err);
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
      setError(null);
      setSuccess(null);

      // Validate all fields are filled
      const hasEmptyValues = Object.entries(targetMatrix).some(
        ([_, ratingData]) =>
          Object.values(ratingData).some(
            (val) => val === null || val === undefined || val === "",
          ),
      );

      if (hasEmptyValues) {
        setError("Please fill in all values before saving");
        setSaving(false);
        return;
      }

      // Validate all values are numbers
      const hasInvalidValues = Object.entries(targetMatrix).some(
        ([_, ratingData]) =>
          Object.entries(ratingData).some(([_, val]) => isNaN(parseFloat(val))),
      );

      if (hasInvalidValues) {
        setError("All values must be valid numbers");
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

      if (!result.success) {
        throw new Error(result.error || "Failed to save data");
      }

      setSuccess("Target matrix saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to save data");
      console.error("Error saving target matrix:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Target Matrix Editor</h1>
          <p className="text-muted-foreground">
            Configure target values for each age band and rating band
            combination
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Table Card */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted border-b">
                  <th className="px-4 py-3 text-left font-semibold border-r">
                    Age Band
                  </th>
                  {ratingBands.map((band) => (
                    <th
                      key={band.name || band}
                      className="px-4 py-3 text-center font-semibold border-r last:border-r-0"
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
                    className={
                      index % 2 === 0 ? "bg-background" : "bg-muted/50"
                    }
                  >
                    <td className="px-4 py-3 font-medium border-r bg-muted/30">
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
                          className="px-4 py-3 border-r last:border-r-0"
                        >
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Enter value"
                            value={value}
                            onChange={(e) =>
                              handleInputChange(
                                ageBand,
                                ratingName,
                                e.target.value,
                              )
                            }
                            className={`w-full text-center ${
                              isEmpty
                                ? "border-yellow-300 bg-yellow-50"
                                : "border-input"
                            }`}
                            disabled={saving}
                          />
                          {isEmpty && (
                            <p className="text-xs text-yellow-700 mt-1">
                              Required
                            </p>
                          )}
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
        <div className="mt-6 flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            disabled={saving}
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Info Section */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Information</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Total Age Bands: {ageBands.length}</li>
            <li>Total Rating Bands: {ratingBands.length}</li>
            <li>
              All fields marked with "Required" must be filled before saving
            </li>
            <li>Values must be valid numbers</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
