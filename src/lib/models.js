import mongoose from "mongoose";

// Strategy Schema - Flexible to support dynamic band configurations
const StrategySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: String,
    reference_column: String,
    tolerance_type: String,
    tolerance_value: Number,
    stale_days: Number,
    nudge_type: String,
    nudge_value: Number,
    rounding_mode: String,
    weekend_hold: Boolean,
    phase_bands: mongoose.Schema.Types.Mixed,
    age_bands: mongoose.Schema.Types.Mixed, // Flexible array of band objects
    rating_bands: mongoose.Schema.Types.Mixed, // Flexible array of band objects
    target_matrix: mongoose.Schema.Types.Mixed, // Dynamic matrix based on bands
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Configuration Schema - For storing global settings like tolerance_type, nudge_value, etc.
const ConfigurationSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: mongoose.Schema.Types.Mixed,
    description: String,
    category: String, // e.g., 'tolerance', 'nudge', 'system'
  },
  { timestamps: true },
);

const DailySummaryLogSchema = new mongoose.Schema(
  {
    dateStr: { type: String, required: true },
    dateIso: { type: String, required: true, unique: true },
    savedAt: { type: Date, required: true },
    units: { type: Number, required: true },
    noChange: { type: Number, required: true },
    pcUp: { type: Number, required: true },
    pcDown: { type: Number, required: true },
    prUp: { type: Number, required: true },
    prDown: { type: Number, required: true },
    issues: { type: Number, default: 0 },
    drop: { type: Number, required: true },
    increase: { type: Number, required: true },
    net: { type: Number, required: true },
  },
  { timestamps: true },
);

// Delete existing models to avoid conflicts during development
if (mongoose.models.Strategy) {
  delete mongoose.models.Strategy;
}
if (mongoose.models.Configuration) {
  delete mongoose.models.Configuration;
}
if (mongoose.models.DailySummaryLog) {
  delete mongoose.models.DailySummaryLog;
}

const Strategy = mongoose.model("Strategy", StrategySchema);
const Configuration = mongoose.model("Configuration", ConfigurationSchema);
const DailySummaryLog = mongoose.model("DailySummaryLog", DailySummaryLogSchema);

export { Strategy, Configuration, DailySummaryLog };
