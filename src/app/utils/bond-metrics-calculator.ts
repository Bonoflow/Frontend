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
      tcea: this.round(this.calculateTIR(
        cashFlows,
        netProceeds,
        periodsPerYear,
        "EMISOR"
      ) * 100),
      trea: this.round(this.calculateTIR(
        cashFlows,
        netProceedsInvestor,
        periodsPerYear,
        "INVERSIONISTA"
      ) * 100),
      duration: this.round(this.calculateDuration(cashFlows, periodicRate, periodsPerYear)),
      modifiedDuration: this.round(this.calculateModifiedDuration(cashFlows, periodicRate, periodsPerYear)),
      convexity: this.round(this.calculateConvexity(cashFlows, periodicRate, periodsPerYear)),
      marketPrice: this.round(this.calculateMarketPrice(bond, cashFlows))
    };
  }

  private static calculateTIR(
    cashFlows: CashflowModel[],
    initialInvestment: number,
    periodsPerYear: number,
    type: "EMISOR" | "INVERSIONISTA",
  ): number {
    console.log("--- INICIO CÁLCULO TIR ---")
    console.log(`Parámetros iniciales:`)
    console.log(`- Inversión inicial (D₀): ${initialInvestment}`)
    console.log(`- Períodos por año: ${periodsPerYear}`)
    console.log(`- Tipo: ${type}`)

    const futureCashFlows = cashFlows.filter((cf) => cf.period > 0)
    console.log(
      `Flujos futuros filtrados (${futureCashFlows.length} períodos > 0):`,
      futureCashFlows.map((cf) => cf.installment),
    )

    // CORRECCIÓN 1: r debe ser la tasa periódica, no anual
    let r = 0.01 // Empezar con 1% periódico
    const maxIterations = BondConfig.DEFAULT_CONFIG.maxIterations
    const tolerance = BondConfig.DEFAULT_CONFIG.tolerance

    console.log(`Configuración iterativa: maxIterations=${maxIterations}, tolerance=${tolerance}`)

    for (let i = 0; i < maxIterations; i++) {
      console.log(`\n--- Iteración ${i + 1} ---`)
      console.log(`Tasa periódica actual (r): ${r} (${(r * 100).toFixed(6)}%)`)

      let van = 0
      let vanDerivative = 0

      // CORRECCIÓN 2: Para el emisor, la inversión inicial es positiva (recibe dinero)
      // Para el inversionista, la inversión inicial es negativa (paga dinero)
      if (type === "EMISOR") {
        van = initialInvestment // El emisor recibe el dinero
      } else {
        van = -initialInvestment // El inversionista paga el dinero
      }

      futureCashFlows.forEach((cf) => {
        const n = cf.period
        const cfValue = cf.installment
        const discountFactor = Math.pow(1 + r, n)
        const presentValue = cfValue / discountFactor

        // CORRECCIÓN 3: Para el emisor, los pagos son negativos (sale dinero)
        // Para el inversionista, los pagos son positivos (entra dinero)
        if (type === "EMISOR") {
          van -= presentValue // El emisor paga las cuotas
          vanDerivative += (n * cfValue) / Math.pow(1 + r, n + 1) // Derivada positiva
        } else {
          van += presentValue // El inversionista recibe las cuotas
          vanDerivative -= (n * cfValue) / Math.pow(1 + r, n + 1) // Derivada negativa
        }

        console.log(`  Período ${n}:`)
        console.log(`  - Flujo: ${cfValue}`)
        console.log(`  - Factor descuento: ${discountFactor.toFixed(8)}`)
        console.log(`  - VP: ${presentValue.toFixed(8)}`)
      })

      console.log(`VAN total: ${van.toFixed(8)}`)
      console.log(`VAN Derivada: ${vanDerivative.toFixed(8)}`)

      if (Math.abs(van) < tolerance) {
        console.log(`CONVERGENCIA ALCANZADA. VAN < tolerancia (${Math.abs(van)} < ${tolerance})`)
        break
      }

      if (Math.abs(vanDerivative) < tolerance) {
        console.warn(`ADVERTENCIA: Derivada cercana a cero (${vanDerivative}). Abortando iteración.`)
        break
      }

      const newRate = r - van / vanDerivative
      const rateChange = newRate - r

      console.log(`Nueva tasa calculada: ${newRate.toFixed(8)} (Cambio: ${rateChange.toFixed(8)})`)

      // Control de cambios drásticos
      if (Math.abs(rateChange) > 0.1) {
        const adjustedChange = Math.sign(rateChange) * 0.01
        r += adjustedChange
        console.warn(`AJUSTE: Cambio drástico detectado. Ajustando tasa en ${adjustedChange} a ${r}`)
      } else {
        r = newRate
      }

      // Limitar rango de tasas periódicas
      if (r < -0.99) {
        console.warn(`AJUSTE: Tasa mínima alcanzada. Limitando a -0.99`)
        r = -0.99
      }
      if (r > 1) {
        console.warn(`AJUSTE: Tasa máxima alcanzada. Limitando a 1`)
        r = 1
      }

      console.log(`Tasa actualizada para próxima iteración: ${r.toFixed(8)}`)
    }

    // CORRECCIÓN 4: Convertir tasa periódica a tasa efectiva anual
    const effectiveAnnualRate = Math.pow(1 + r, periodsPerYear) - 1

    console.log("--- FIN CÁLCULO TIR ---")
    console.log(`TIR periódica calculada: ${r.toFixed(8)} (${(r * 100).toFixed(6)}%)`)
    console.log(`TIR efectiva anual: ${effectiveAnnualRate.toFixed(8)} (${(effectiveAnnualRate * 100).toFixed(6)}%)`)

    return effectiveAnnualRate
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

}
