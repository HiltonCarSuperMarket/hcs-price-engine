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

// Delete existing models to avoid conflicts during development
if (mongoose.models.Strategy) {
  delete mongoose.models.Strategy;
}
if (mongoose.models.Configuration) {
  delete mongoose.models.Configuration;
}

const Strategy = mongoose.model("Strategy", StrategySchema);
const Configuration = mongoose.model("Configuration", ConfigurationSchema);

export { Strategy, Configuration };
