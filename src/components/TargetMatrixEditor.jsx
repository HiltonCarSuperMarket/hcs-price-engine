"use client";

function getCellValue(cell) {
  if (cell && typeof cell === "object" && !Array.isArray(cell)) {
    return cell.value ?? "";
  }
  return cell ?? "";
}

function getCellApplyLiveMarket(cell) {
  if (cell && typeof cell === "object" && !Array.isArray(cell)) {
    return !!cell.applyLiveMarket;
  }
  return false;
}

export default function TargetMatrixEditor({
  matrix,
  ageBands,
  ratingBands,
  onChange,
}) {
  const handleCellChange = (ageBand, ratingBand, value) => {
    const newMatrix = { ...matrix };
    if (!newMatrix[ageBand]) {
      newMatrix[ageBand] = {};
    }
    newMatrix[ageBand][ratingBand] = {
      value: parseFloat(value) || 0,
      applyLiveMarket: getCellApplyLiveMarket(matrix[ageBand]?.[ratingBand]),
    };
    onChange(newMatrix);
  };

  const handleLiveMarketToggle = (ageBand, ratingBand, checked) => {
    const newMatrix = { ...matrix };
    if (!newMatrix[ageBand]) {
      newMatrix[ageBand] = {};
    }
    newMatrix[ageBand][ratingBand] = {
      value: parseFloat(getCellValue(matrix[ageBand]?.[ratingBand])) || 0,
      applyLiveMarket: checked,
    };
    onChange(newMatrix);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Target Price Matrix
        </h3>
        <p className="text-sm text-neutral-600 mb-4">
          Define target prices (as percentages) for each combination of age and
          rating bands. Tick Live Market to add Live Market impact to that cell.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="bg-neutral-100 border border-neutral-300 px-4 py-3 text-left text-sm font-semibold text-neutral-900 min-w-24">
                Age Band
              </th>
              {ratingBands.map((band) => (
                <th
                  key={band.name}
                  className="bg-neutral-100 border border-neutral-300 px-4 py-3 text-center text-sm font-semibold text-neutral-900 min-w-24"
                >
                  {band.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ageBands.map((ageBand) => (
              <tr key={ageBand}>
                <td className="bg-neutral-50 border border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-900">
                  {ageBand}
                </td>
                {ratingBands.map((ratingBand) => (
                  <td
                    key={`${ageBand}-${ratingBand.name}`}
                    className="border border-neutral-300 px-4 py-3"
                  >
                    <div className="space-y-2">
                      <input
                        type="number"
                        step="0.01"
                        value={getCellValue(matrix[ageBand]?.[ratingBand.name])}
                        onChange={(e) =>
                          handleCellChange(
                            ageBand,
                            ratingBand.name,
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                      <label className="flex items-center justify-center gap-1.5 text-xs text-neutral-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={getCellApplyLiveMarket(
                            matrix[ageBand]?.[ratingBand.name],
                          )}
                          onChange={(e) =>
                            handleLiveMarketToggle(
                              ageBand,
                              ratingBand.name,
                              e.target.checked,
                            )
                          }
                          className="h-3.5 w-3.5"
                        />
                        Live Market
                      </label>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          Enter the target price percentage for each age/rating combination. For
          example, 97.78 means the target price should be 97.78% of the
          reference price. Tick Live Market to add Live Market impact to that
          cell.
        </p>
      </div>
    </div>
  );
}
