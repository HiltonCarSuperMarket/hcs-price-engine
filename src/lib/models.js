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
    nudge_type: String,
    nudge_value: Number,
    rounding_mode: String,
    weekend_hold: Boolean,
    phase_bands: mongoose.Schema.Types.Mixed,
    age_bands: mongoose.Schema.Types.Mixed,
    rating_bands: mongoose.Schema.Types.Mixed,
    live_market_bands: mongoose.Schema.Types.Mixed,
    live_market_age_bands: mongoose.Schema.Types.Mixed,
    live_market_rating_bands: mongoose.Schema.Types.Mixed,
    target_matrix: mongoose.Schema.Types.Mixed,
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const ConfigurationSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: mongoose.Schema.Types.Mixed,
    description: String,
    category: String,
  },
  { timestamps: true },
);

/** @deprecated Legacy summary-only logs — cut off; kept for historical data only */
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
    blocked: { type: Number, default: 0 },
    drop: { type: Number, required: true },
    increase: { type: Number, required: true },
    net: { type: Number, required: true },
  },
  { timestamps: true },
);

/**
 * Full process log rows (excludes No Change).
 * Dashboard daily stats are derived from these records.
 */
const ProcessLogRecordSchema = new mongoose.Schema(
  {
    dateIso: { type: String, required: true, index: true },
    dateStr: { type: String, required: true },
    savedAt: { type: Date, required: true, index: true },
    category: {
      type: String,
      required: true,
      enum: ["pc_up", "pc_down", "pr_down", "issue", "blocked"],
      index: true,
    },
    stock_id: String,
    current_price: Number,
    reference_price: Number,
    matrix_percent: Number,
    live_market_impact: Number,
    live_market_band: String,
    live_market_condition: mongoose.Schema.Types.Mixed,
    target_percent: Number,
    target_price: Number,
    new_price: Number,
    amount_change: Number,
    age_days: Number,
    at_rating: mongoose.Schema.Types.Mixed,
    days_since_last_change: mongoose.Schema.Types.Mixed,
    reason: String,
    blocked_new_price: Number,
    blocked_amount: Number,
    /** Original CSV row columns */
    input: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

ProcessLogRecordSchema.index({ dateIso: 1, category: 1 });

if (mongoose.models.Strategy) delete mongoose.models.Strategy;
if (mongoose.models.Configuration) delete mongoose.models.Configuration;
if (mongoose.models.DailySummaryLog) delete mongoose.models.DailySummaryLog;
if (mongoose.models.ProcessLogRecord) delete mongoose.models.ProcessLogRecord;

const Strategy = mongoose.model("Strategy", StrategySchema);
const Configuration = mongoose.model("Configuration", ConfigurationSchema);
const DailySummaryLog = mongoose.model("DailySummaryLog", DailySummaryLogSchema);
const ProcessLogRecord = mongoose.model(
  "ProcessLogRecord",
  ProcessLogRecordSchema,
);

export { Strategy, Configuration, DailySummaryLog, ProcessLogRecord };
