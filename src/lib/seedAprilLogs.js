/**
 * Daily summary logs extracted from SS/ dashboard screenshots
 * (30 Mar + April 2026). Financial totals from OCR; PC/PR counts
 * reconciled so units === noChange + pcUp + pcDown + prUp + prDown + issues.
 */
export const APRIL_SEED_LOGS = [
  { dateStr: "30th March (Monday)", dateIso: "2026-03-30", units: 440, noChange: 224, pcUp: 15, pcDown: 121, prUp: 8, prDown: 72, issues: 0, drop: -19602, increase: 1654, net: -17948 },
  { dateStr: "1st April (Wednesday)", dateIso: "2026-04-01", units: 437, noChange: 399, pcUp: 9, pcDown: 17, prUp: 0, prDown: 12, issues: 0, drop: -2664, increase: 1276, net: -1388 },
  { dateStr: "2nd April (Thursday)", dateIso: "2026-04-02", units: 443, noChange: 296, pcUp: 21, pcDown: 60, prUp: 6, prDown: 60, issues: 0, drop: -11405, increase: 2224, net: -9181 },
  { dateStr: "3rd April (Friday)", dateIso: "2026-04-03", units: 442, noChange: 327, pcUp: 19, pcDown: 45, prUp: 8, prDown: 43, issues: 0, drop: -8456, increase: 2354, net: -6102 },
  { dateStr: "5th April (Sunday)", dateIso: "2026-04-05", units: 446, noChange: 329, pcUp: 23, pcDown: 80, prUp: 0, prDown: 14, issues: 0, drop: -13320, increase: 2730, net: -10590 },
  { dateStr: "6th April (Monday)", dateIso: "2026-04-06", units: 445, noChange: 330, pcUp: 10, pcDown: 36, prUp: 9, prDown: 60, issues: 0, drop: -5936, increase: 1226, net: -4710 },
  { dateStr: "7th April (Tuesday)", dateIso: "2026-04-07", units: 445, noChange: 339, pcUp: 15, pcDown: 45, prUp: 3, prDown: 43, issues: 0, drop: -7816, increase: 2052, net: -5764 },
  { dateStr: "8th April (Wednesday)", dateIso: "2026-04-08", units: 446, noChange: 385, pcUp: 15, pcDown: 32, prUp: 1, prDown: 13, issues: 0, drop: -4526, increase: 1800, net: -2726 },
  { dateStr: "9th April (Thursday)", dateIso: "2026-04-09", units: 438, noChange: 324, pcUp: 15, pcDown: 42, prUp: 6, prDown: 50, issues: 1, drop: -8248, increase: 1998, net: -6250 },
  { dateStr: "10th April (Friday)", dateIso: "2026-04-10", units: 447, noChange: 344, pcUp: 10, pcDown: 52, prUp: 3, prDown: 38, issues: 0, drop: -7396, increase: 1230, net: -6166 },
  { dateStr: "12th April (Sunday)", dateIso: "2026-04-12", units: 428, noChange: 296, pcUp: 15, pcDown: 77, prUp: 2, prDown: 38, issues: 0, drop: -11618, increase: 1628, net: -9990 },
  { dateStr: "13th April (Monday)", dateIso: "2026-04-13", units: 438, noChange: 339, pcUp: 10, pcDown: 38, prUp: 4, prDown: 47, issues: 0, drop: -8232, increase: 1272, net: -6960 },
  { dateStr: "14th April (Tuesday)", dateIso: "2026-04-14", units: 453, noChange: 349, pcUp: 24, pcDown: 33, prUp: 2, prDown: 45, issues: 0, drop: -5480, increase: 2650, net: -2830 },
  { dateStr: "15th April (Wednesday)", dateIso: "2026-04-15", units: 450, noChange: 359, pcUp: 12, pcDown: 57, prUp: 2, prDown: 20, issues: 0, drop: -9836, increase: 1550, net: -8286 },
  { dateStr: "16th April (Thursday)", dateIso: "2026-04-16", units: 456, noChange: 356, pcUp: 14, pcDown: 54, prUp: 2, prDown: 30, issues: 0, drop: -6396, increase: 1954, net: -4442 },
  { dateStr: "17th April (Friday)", dateIso: "2026-04-17", units: 456, noChange: 328, pcUp: 13, pcDown: 62, prUp: 3, prDown: 50, issues: 0, drop: -9989, increase: 1798, net: -8191 },
  { dateStr: "19th April (Sunday)", dateIso: "2026-04-19", units: 458, noChange: 284, pcUp: 14, pcDown: 123, prUp: 5, prDown: 32, issues: 0, drop: -19358, increase: 1778, net: -17580 },
  { dateStr: "20th April (Monday)", dateIso: "2026-04-20", units: 464, noChange: 365, pcUp: 10, pcDown: 39, prUp: 5, prDown: 45, issues: 0, drop: -6012, increase: 1122, net: -4890 },
  { dateStr: "22nd April (Wednesday)", dateIso: "2026-04-22", units: 450, noChange: 284, pcUp: 25, pcDown: 85, prUp: 1, prDown: 55, issues: 0, drop: -18862, increase: 3004, net: -15858 },
  { dateStr: "23rd April (Thursday)", dateIso: "2026-04-23", units: 458, noChange: 335, pcUp: 24, pcDown: 71, prUp: 2, prDown: 26, issues: 0, drop: -9644, increase: 2852, net: -6792 },
  { dateStr: "24th April (Friday)", dateIso: "2026-04-24", units: 458, noChange: 343, pcUp: 10, pcDown: 70, prUp: 2, prDown: 33, issues: 0, drop: -10094, increase: 872, net: -9222 },
  { dateStr: "26th April (Sunday)", dateIso: "2026-04-26", units: 463, noChange: 279, pcUp: 21, pcDown: 112, prUp: 2, prDown: 49, issues: 0, drop: -19836, increase: 2528, net: -17308 },
  { dateStr: "27th April (Monday)", dateIso: "2026-04-27", units: 468, noChange: 364, pcUp: 14, pcDown: 53, prUp: 3, prDown: 34, issues: 0, drop: -7428, increase: 1826, net: -5602 },
  { dateStr: "28th April (Tuesday)", dateIso: "2026-04-28", units: 545, noChange: 412, pcUp: 23, pcDown: 98, prUp: 0, prDown: 12, issues: 0, drop: -17172, increase: 3080, net: -14092 },
  { dateStr: "29th April (Wednesday)", dateIso: "2026-04-29", units: 535, noChange: 396, pcUp: 11, pcDown: 31, prUp: 4, prDown: 93, issues: 0, drop: -7060, increase: 3636, net: -3424 },
  { dateStr: "30th April (Thursday)", dateIso: "2026-04-30", units: 548, noChange: 427, pcUp: 17, pcDown: 67, prUp: 1, prDown: 36, issues: 0, drop: -9136, increase: 2052, net: -7084 },
];
