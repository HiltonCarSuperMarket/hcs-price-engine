"use client";

function getCellValue(cell) {
  if (cell && typeof cell === "object" && !Array.isArray(cell)) {
    return cell.value ?? "";
  }
  return cell ?? "";
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
    newMatrix[ageBand][ratingBand] = parseFloat(value) || 0;
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
          rating bands. Live Market is set per age row and AT Rating column on
          the Strategy page.
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
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
