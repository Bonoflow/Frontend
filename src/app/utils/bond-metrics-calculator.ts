import { BondModel } from '../bonds/model/bond.model';
import { CashflowModel } from '../bonds/model/cashflow.model';
import { FinancialMetricModel } from '../bonds/model/finanlcial-metric.model';
import { BondConfig } from './bond-config';

export class BondMetricsCalculator {

  public static calculateFinancialMetrics(
    bond: BondModel,
    cashFlows: CashflowModel[]
  ): FinancialMetricModel {
    const periodicRate = this.convertToPeriodicRate(
      bond.interestRate,
      bond.rateType,
      bond.paymentFrequency,
      bond.compounding
    );

    const totalExpenses = (bond.issuanceExpenses || 0) + (bond.placementExpenses || 0) +
      (bond.structuringExpenses || 0) + (bond.cavaliExpenses || 0);

    const totalExpensesInvestor = (bond.placementExpenses || 0) + (bond.cavaliExpenses || 0);

    const netProceeds = bond.faceValue - totalExpenses;
    const netProceedsInvestor = bond.faceValue - totalExpensesInvestor;
    const periodsPerYear = this.getPeriodsPerYear(bond.paymentFrequency);

    return {
      bondId: bond.id!,
      calculationDate: new Date().toISOString(),
      tcea: this.round(this.calculateEffectiveRate(
        cashFlows,
        netProceeds,
        periodsPerYear,
        bond.compounding
      ) * 100),
      trea: this.round(this.calculateEffectiveRate(
        cashFlows,
        netProceedsInvestor,
        periodsPerYear,
        bond.compounding
      ) * 100),
      duration: this.round(this.calculateDuration(cashFlows, periodicRate, periodsPerYear)),
      modifiedDuration: this.round(this.calculateModifiedDuration(cashFlows, periodicRate, periodsPerYear)),
      convexity: this.round(this.calculateConvexity(cashFlows, periodicRate, periodsPerYear)),
      marketPrice: this.round(this.calculateMarketPrice(bond, cashFlows))
    };
  }

  private static calculateEffectiveRate(
    cashFlows: CashflowModel[],
    initialAmount: number,
    paymentPeriodsPerYear: number,
    compounding?: string
  ): number {
    // 1. Calculate periodic IRR
    const periodicIRR = this.calculatePeriodicIRR(cashFlows, initialAmount);
    console.log("TIR: ",periodicIRR);

    // 2. Get compounding periods
    const compoundingPeriodsPerYear = this.getCompoundingPeriodsPerYear(compounding || 'ANNUAL');

    // 3. Apply annualization formula: (1 + IRR)^(compoundingPeriods/paymentPeriods) - 1
    return Math.pow(1 + periodicIRR, compoundingPeriodsPerYear / paymentPeriodsPerYear) - 1;
  }

  private static calculatePeriodicIRR(
    cashFlows: CashflowModel[],
    initialAmount: number
  ): number {
    let rate = 0.1;
    const maxIterations = BondConfig.DEFAULT_CONFIG.maxIterations;
    const tolerance = BondConfig.DEFAULT_CONFIG.tolerance;

    console.log("Initial Amount: ", initialAmount);
    console.log("Cash Flows: ", cashFlows);

    for (let i = 0; i < maxIterations; i++) {
      let npv = -initialAmount;
      let npvDerivative = 0;

      cashFlows.forEach((cf, index) => {
        const period = index + 1;
        const discountFactor = Math.pow(1 + rate, period);
        npv += cf.fixedInstallment / discountFactor;
        npvDerivative -= (period * cf.fixedInstallment) / Math.pow(1 + rate, period + 1);
      });

      if (Math.abs(npv) < tolerance) break;
      rate = rate - npv / npvDerivative;
    }
    return rate;
  }

  private static calculateDuration(cashFlows: CashflowModel[], periodicRate: number, periodsPerYear: number): number {
    let weightedTime = 0
    let presentValue = 0

    // Excluir período 0
    const operationalCashFlows = cashFlows.filter((cf) => cf.period > 0)

    operationalCashFlows.forEach((cf, index) => {
      const period = index + 1
      const timeInYears = period / periodsPerYear
      const pv = cf.installment / Math.pow(1 + periodicRate, period)
      weightedTime += timeInYears * pv
      presentValue += pv
    })

    return presentValue > 0 ? weightedTime / presentValue : 0
  }

  private static calculateModifiedDuration(
    cashFlows: CashflowModel[],
    periodicRate: number,
    periodsPerYear: number
  ): number {
    const duration = this.calculateDuration(cashFlows, periodicRate, periodsPerYear);
    return duration / (1 + periodicRate);
  }

  private static calculateConvexity(cashFlows: CashflowModel[], periodicRate: number, periodsPerYear: number): number {
    let weightedTime = 0
    let presentValue = 0

    // Excluir período 0
    const operationalCashFlows = cashFlows.filter((cf) => cf.period > 0)

    operationalCashFlows.forEach((cf, index) => {
      const period = index + 1
      const timeInYears = period / periodsPerYear
      const pv = cf.installment / Math.pow(1 + periodicRate, period)
      weightedTime += timeInYears * (timeInYears + 1 / periodsPerYear) * pv
      presentValue += pv
    })

    return presentValue > 0 ? weightedTime / (presentValue * Math.pow(1 + periodicRate, 2)) : 0
  }

  private static calculateMarketPrice(
    bond: BondModel,
    cashFlows: CashflowModel[]
  ): number {
    const marketPeriodicRate = this.convertToPeriodicRate(
      bond.marketRate,
      bond.rateType,
      bond.paymentFrequency,
      bond.compounding
    );

    return cashFlows.reduce(
      (pv, cf, index) => pv + cf.installment / Math.pow(1 + marketPeriodicRate, index + 1),
      0
    );
  }

  static calculateTotalPeriodsFromDates(
    issueDate: string,
    maturityDate: string,
    frequency: string
  ): number {
    const issue = new Date(issueDate);
    const maturity = new Date(maturityDate);

    if (isNaN(issue.getTime()) || isNaN(maturity.getTime())) {
      throw new Error('Fechas inválidas');
    }
    if (issue >= maturity) {
      throw new Error('La fecha de vencimiento debe ser posterior a la fecha de emisión');
    }

    const diffMs = maturity.getTime() - issue.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const diffMonths = diffDays / 30;

    let k: number;
    switch (frequency) {
      case 'MONTHLY': k = 1; break;
      case 'BIMONTHLY': k = 2; break;
      case 'QUARTERLY': k = 3; break;
      case 'SEMIANNUAL': k = 6; break;
      case 'ANNUAL': k = 12; break;
      default: throw new Error(`Frecuencia no válida: ${frequency}`);
    }

    return Math.max(1, Math.floor(diffMonths / k));
  }

  static calculateFixedInstallment(
    faceValue: number,
    periodicRate: number,
    amortizationPeriods: number
  ): number {
    if (amortizationPeriods <= 0) return 0;
    if (periodicRate > 0) {
      const factor = Math.pow(1 + periodicRate, amortizationPeriods);
      return (faceValue * (periodicRate * factor)) / (factor - 1);
    }
    return faceValue / amortizationPeriods;
  }

  static calculatePeriodAmounts(
    periodType: string,
    interest: number,
    fixedInstallment: number,
    amortizationPeriods: number,
    currentBalance: number
  ): { amortization: number; installment: number } {
    let amortization = 0;
    let installment = 0;

    switch (periodType) {
      case 'GRACE_TOTAL':
        break;
      case 'GRACE_PARTIAL':
        installment = interest;
        break;
      case 'AMORTIZATION':
        amortization = fixedInstallment > 0
          ? fixedInstallment - interest
          : currentBalance / Math.max(1, amortizationPeriods);
        installment = interest + amortization;
        break;
      default:
        throw new Error(`Tipo de período no reconocido: ${periodType}`);
    }

    return { amortization, installment };
  }

  static addPeriods(
    startDate: string,
    periods: number,
    frequency: string
  ): string {
    const date = new Date(startDate);
    switch (frequency) {
      case 'MONTHLY': date.setMonth(date.getMonth() + periods); break;
      case 'BIMONTHLY': date.setMonth(date.getMonth() + periods * 2); break;
      case 'QUARTERLY': date.setMonth(date.getMonth() + periods * 3); break;
      case 'SEMIANNUAL': date.setMonth(date.getMonth() + periods * 6); break;
      case 'ANNUAL': date.setFullYear(date.getFullYear() + periods); break;
    }
    return date.toISOString().split('T')[0];
  }

  static getPeriodType(
    period: number,
    gracePeriod: number,
    graceType: string
  ): { type: string } {
    if (period <= gracePeriod) {
      return { type: graceType === 'TOTAL' ? 'GRACE_TOTAL' : 'GRACE_PARTIAL' };
    }
    return { type: 'AMORTIZATION' };
  }

  static round(value: number): number {
    const precision = Math.pow(10, BondConfig.DEFAULT_CONFIG.precision);
    return Math.round(value * precision) / precision;
  }

  static getPeriodsPerYear(frequency: string): number {
    const periods = BondConfig.FREQUENCY_PERIODS[frequency];
    if (!periods) throw new Error(`Frecuencia de pago no válida: ${frequency}`);
    return periods;
  }

  static getCompoundingPeriodsPerYear(compounding: string): number {
    const periods = BondConfig.COMPOUNDING_PERIODS[compounding];
    if (!periods) throw new Error(`Capitalización no válida: ${compounding}`);
    return periods;
  }

  static convertToPeriodicRate( // Pendiente
    annualRate: number,
    rateType: string,
    paymentFrequency: string,
    compounding?: string
  ): number {
    const periodsPerYear = this.getPeriodsPerYear(paymentFrequency);

    if (rateType === 'EFFECTIVE') {
      return Math.pow(1 + annualRate / 100, 1 / periodsPerYear) - 1;
    }

    if (!compounding) throw new Error('Se requiere capitalización para tasa nominal');

    const compoundingPeriods = this.getCompoundingPeriodsPerYear(compounding);
    const nominalRate = annualRate / 100;
    const effectiveAnnualRate = Math.pow(1 + nominalRate / compoundingPeriods, compoundingPeriods) - 1;

    return Math.pow(1 + effectiveAnnualRate, 1 / periodsPerYear) - 1;
  }

  static calculatePeriodicCok(
    annualCokRate: number,
    rateType: string,
    paymentFrequency: string,
    compounding?: string
  ): number {
    const periodsPerYear = this.getPeriodsPerYear(paymentFrequency);

    if (rateType === 'EFFECTIVE') {
      return Math.pow(1 + annualCokRate / 100, 1 / periodsPerYear) - 1;
    }

    if (!compounding) {
      throw new Error('Se requiere capitalización para tasa nominal');
    }

    const compoundingPeriods = this.getCompoundingPeriodsPerYear(compounding);
    const nominalRate = annualCokRate / 100;
    const effectiveAnnualRate = Math.pow(1 + nominalRate / compoundingPeriods, compoundingPeriods) - 1;

    return Math.pow(1 + effectiveAnnualRate, 1 / periodsPerYear) - 1;
  }
}
