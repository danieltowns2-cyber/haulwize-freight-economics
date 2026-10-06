import type { CostBasisData, ShipmentSnapshot } from "@workspace/db";
import { HttpError } from "./freight-auth";

export function defaultCostBasis(): CostBasisData {
  const fixed = ["Truck/trailer/reefer lease or payment", "Insurance", "Permits & licenses", "ELD/telematics", "Accounting/software", "Phone/communications", "Parking"];
  const variable: Array<[string, number]> = [["Fuel", 0], ["DEF", 0.03], ["Tires", 0.05], ["Repair & Maintenance", 0.22], ["Tolls", 0.043], ["Driver Wages", 0.65], ["Driver Benefits", 0.12]];
  return {
    expectedMonthlyMiles: 10000,
    fixedLines: fixed.map((name, position) => ({ id: `fixed-${position}`, name, monthlyAmount: 0, note: null, position })),
    variableLines: variable.map(([name, amountPerMile], position) => ({ id: `variable-${position}`, name, amountPerMile, isFuel: position === 0, position })),
    fuelPriceMode: "manual", manualFuelPrice: 5.967, dieselPrice: 5.967, dieselWeek: null,
    averageMpg: 6.5, factoringPercent: 3, dispatchPercent: 0, targetMarginPercent: 20,
  };
}

export function normalizeCostBasis(input: CostBasisData, dieselPrice: number, dieselWeek: string | null): CostBasisData {
  if (input.variableLines.filter((line) => line.isFuel).length > 1) throw new HttpError(400, "Only one fuel line is allowed.");
  if (input.factoringPercent + input.dispatchPercent + input.targetMarginPercent >= 100) {
    throw new HttpError(400, "Factoring, dispatch and target margin must total less than 100%.");
  }
  for (const lines of [input.fixedLines, input.variableLines]) {
    if (new Set(lines.map((line) => line.id)).size !== lines.length) throw new HttpError(400, "Each cost line must have a unique ID.");
    if (lines.some((line) => !line.name.trim())) throw new HttpError(400, "Name every cost line.");
  }
  return {
    ...input, dieselPrice, dieselWeek,
    fixedLines: input.fixedLines.map((line, position) => ({ ...line, name: line.name.trim(), position })),
    variableLines: input.variableLines.map((line, position) => ({ ...line, name: line.name.trim(), position, amountPerMile: line.isFuel ? dieselPrice / input.averageMpg : line.amountPerMile })),
  };
}

export function snapshotOf(config: CostBasisData): ShipmentSnapshot {
  const fixedMonthly = config.fixedLines.reduce((sum, line) => sum + line.monthlyAmount, 0);
  const fixedPerMile = fixedMonthly / config.expectedMonthlyMiles;
  const variablePerMile = config.variableLines.reduce((sum, line) => sum + line.amountPerMile, 0);
  const fuelPerMile = config.variableLines.filter((line) => line.isFuel).reduce((sum, line) => sum + line.amountPerMile, 0);
  return {
    capturedAt: new Date().toISOString(), costBasis: structuredClone(config), fixedMonthly,
    fixedPerMile, variablePerMile, fuelPerMile, operatingCostPerMile: fixedPerMile + variablePerMile,
    feesPercent: config.factoringPercent + config.dispatchPercent,
    variableLines: structuredClone(config.variableLines),
  };
}

type EstimateInputs = {
  loadedMiles: number; deadheadMiles: number; reeferPerDay: number; reeferDays: number;
  extrasCost: number; brokerOffer?: number | null; targetMarginPercent: number;
};

export function estimateMath(input: EstimateInputs, snapshot: ShipmentSnapshot, marketRatePerMile?: number) {
  const totalMiles = input.loadedMiles + input.deadheadMiles;
  if (totalMiles <= 0) throw new HttpError(400, "Enter at least one mile for the shipment.");
  const fees = snapshot.feesPercent / 100;
  const margin = input.targetMarginPercent / 100;
  if (fees + margin >= 1) throw new HttpError(400, "Fees plus target margin must total less than 100%.");
  const baseCost = snapshot.operatingCostPerMile * totalMiles + input.reeferPerDay * input.reeferDays + input.extrasCost;
  const breakEven = baseCost / (1 - fees);
  const targetRate = baseCost / (1 - fees - margin);
  const offer = input.brokerOffer;
  const brokerProfit = offer == null ? null : offer - offer * fees - baseCost;
  return {
    totalMiles, baseCost, feesPercent: snapshot.feesPercent, breakEven, targetRate,
    targetPerTotalMile: targetRate / totalMiles,
    targetPerLoadedMile: input.loadedMiles > 0 ? targetRate / input.loadedMiles : null,
    brokerProfit, brokerMarginPercent: offer && brokerProfit != null ? brokerProfit / offer * 100 : offer === 0 ? 0 : null,
    brokerPerTotalMile: offer == null ? null : offer / totalMiles,
    brokerPerLoadedMile: offer == null || input.loadedMiles <= 0 ? null : offer / input.loadedMiles,
    verdict: offer == null ? null : offer >= targetRate ? "accept" : offer >= breakEven ? "negotiate" : "decline",
    marketRatePerMile: marketRatePerMile ?? null,
    marketNote: "Reference only. Check lane-specific rates; benchmarks are not a guaranteed quote.",
  };
}

export function actualMath(
  input: { revenue: number; totalMiles: number; extraCosts: number; variableLines: Array<{ id: string; name: string; amount: number }> },
  snapshot: ShipmentSnapshot,
  estimate: Record<string, unknown>,
  targetMarginPercent: number,
) {
  if (input.totalMiles <= 0) throw new HttpError(400, "Actual miles must be greater than zero.");
  if (input.revenue <= 0) throw new HttpError(400, "Actual revenue must be greater than zero.");
  const expected = snapshot.variableLines.map((line) => line.id).sort();
  const entered = input.variableLines.map((line) => line.id).sort();
  if (JSON.stringify(expected) !== JSON.stringify(entered)) throw new HttpError(400, "Actual variable costs must match the saved cost snapshot.");
  const cost = (snapshot.operatingCostPerMile - snapshot.variablePerMile) * input.totalMiles +
    input.variableLines.reduce((sum, line) => sum + line.amount, 0) + input.extraCosts;
  const fees = input.revenue * snapshot.feesPercent / 100;
  const profit = input.revenue - fees - cost;
  const marginPercent = profit / input.revenue * 100;
  return {
    ...input, cost, actualCost: cost, fees, profit, marginPercent, revenuePerMile: input.revenue / input.totalMiles,
    fuelGallons: input.totalMiles / snapshot.costBasis.averageMpg,
    rateVariance: input.revenue - Number(estimate.targetRate),
    costVariance: cost - Number(estimate.baseCost),
    marginVariance: marginPercent - targetMarginPercent,
    milesVariance: input.totalMiles - Number(estimate.totalMiles),
    recordedAt: new Date().toISOString(),
  };
}
