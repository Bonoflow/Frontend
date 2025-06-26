import { Injectable } from '@angular/core';
import { BondModel } from '../bonds/model/bond.model';
import { CashflowModel } from '../bonds/model/cashflow.model';
import { FinancialMetricModel } from '../bonds/model/finanlcial-metric.model';

@Injectable({
  providedIn: 'root'
})
export class BondCalculatorService {
  private readonly FREQUENCY_PERIODS: Record<string, number> = {
    MONTHLY: 12,
    BIMONTHLY: 6,
    QUARTERLY: 4,
    SEMIANNUAL: 2,
    ANNUAL: 1,
  };

  private readonly COMPOUNDING_PERIODS: Record<string, number> = {
    MONTHLY: 12,
    QUARTERLY: 4,
    SEMIANNUAL: 2,
    ANNUAL: 1,
    DAILY: 365,
  };

  private readonly DEFAULT_CONFIG = {
    precision: 2,
    tolerance: 1e-6,
    maxIterations: 100,
    marketSpread: 0.01, // 1%
  };

  // ========================================================================
  // MÉTODOS PÚBLICOS PRINCIPALES
  // ========================================================================

  public calculateCashFlowsOnly(bond: BondModel): CashflowModel[] {
    this.validateBond(bond);
    return this.calculateFrenchMethodCashFlow(bond);
  }

  public calculateMetricsOnly(
    bond: BondModel,
    cashFlows: CashflowModel[]
  ): FinancialMetricModel {
    this.validateBond(bond);
    return this.calculateFinancialMetrics(bond, cashFlows);
  }

  // ========================================================================
  // CÁLCULO DE FLUJO DE CAJA (MODIFICADO PARA USAR FECHAS)
  // ========================================================================

  public calculateFrenchMethodCashFlow(bond: BondModel): CashflowModel[] {
    console.log(`🚀 INICIANDO CÁLCULO DE FLUJO DE CAJA - MÉTODO FRANCÉS`);

    const periodicRate = this.convertToPeriodicRate(
      bond.interestRate,
      bond.rateType,
      bond.paymentFrequency,
      bond.compounding
    );

    // Calcular total de períodos basado en fechas
    const totalPeriods = this.calculateTotalPeriodsFromDates(
      bond.issueDate,
      bond.maturityDate,
      bond.paymentFrequency
    );

    const amortizationPeriods = totalPeriods - bond.gracePeriod;
    const fixedInstallment = this.calculateFixedInstallment(
      bond.faceValue,
      periodicRate,
      amortizationPeriods
    );

    return this.generateCashFlowSchedule(
      bond,
      periodicRate,
      totalPeriods,
      amortizationPeriods,
      fixedInstallment
    );
  }

  // Nuevo método para calcular períodos basado en fechas
  private calculateTotalPeriodsFromDates(
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

    let monthsDiff = (maturity.getFullYear() - issue.getFullYear()) * 12;
    monthsDiff += maturity.getMonth() - issue.getMonth();

    // Ajustar por días si es necesario
    if (maturity.getDate() < issue.getDate()) {
      monthsDiff--;
    }

    switch (frequency) {
      case 'MONTHLY': return monthsDiff;
      case 'BIMONTHLY': return Math.floor(monthsDiff / 2);
      case 'QUARTERLY': return Math.floor(monthsDiff / 3);
      case 'SEMIANNUAL': return Math.floor(monthsDiff / 6);
      case 'ANNUAL': return Math.floor(monthsDiff / 12);
      default: throw new Error('Frecuencia de pago no válida');
    }
  }

  private calculateFixedInstallment(
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

  private calculatePeriodAmounts(
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
        // En gracia total no se paga nada
        installment = 0;
        amortization = 0;
        break;

      case 'GRACE_PARTIAL':
        // En gracia parcial solo se pagan intereses
        installment = interest;
        amortization = 0;
        break;

      case 'AMORTIZATION':
        // En período de amortización se paga capital + intereses
        if (fixedInstallment > 0) {
          amortization = fixedInstallment - interest;
        } else {
          // Para tasa 0% o casos especiales
          amortization = currentBalance / Math.max(1, amortizationPeriods);
        }
        installment = interest + amortization;
        break;

      default:
        throw new Error(`Tipo de período no reconocido: ${periodType}`);
    }

    return { amortization, installment };
  }

  private generateCashFlowSchedule(
    bond: BondModel,
    periodicRate: number,
    totalPeriods: number,
    amortizationPeriods: number,
    fixedInstallment: number
  ): CashflowModel[] {
    const cashFlows: CashflowModel[] = [];
    let currentBalance = bond.faceValue;

    for (let period = 1; period <= totalPeriods; period++) {
      const periodInfo = this.getPeriodType(period, bond.gracePeriod, bond.graceType);
      const date = this.addPeriods(bond.issueDate, period, bond.paymentFrequency);
      const initialBalance = currentBalance;
      const interest = initialBalance * periodicRate;

      const { amortization, installment } = this.calculatePeriodAmounts(
        periodInfo.type,
        interest,
        fixedInstallment,
        amortizationPeriods,
        currentBalance
      );

      currentBalance -= amortization;

      // Ajuste para el último período por redondeo
      if (period === totalPeriods && currentBalance > 0 && currentBalance < 1) {
        currentBalance = 0;
      }

      cashFlows.push({
        bondId: bond.id!,
        period,
        date,
        initialBalance: this.round(initialBalance),
        interest: this.round(interest),
        amortization: this.round(amortization),
        installment: this.round(installment),
        finalBalance: this.round(currentBalance),
        fixedInstallment: this.round(fixedInstallment)
      });
    }

    return cashFlows;
  }

  // Resto de los métodos permanecen iguales...
  // ========================================================================
  // CÁLCULO DE MÉTRICAS FINANCIERAS (SIN CAMBIOS)
  // ========================================================================

  public calculateFinancialMetrics(
    bond: BondModel,
    cashFlows: CashflowModel[]
  ): FinancialMetricModel {
    const periodicRate = this.convertToPeriodicRate(
      bond.interestRate,
      bond.rateType,
      bond.paymentFrequency,
      bond.compounding
    );

    const totalExpenses =
      (bond.issuanceExpenses || 0) +
      (bond.placementExpenses || 0) +
      (bond.structuringExpenses || 0) +
      (bond.cavaliExpenses || 0);

    const netProceeds = bond.faceValue - totalExpenses;
    const periodsPerYear = this.getPeriodsPerYear(bond.paymentFrequency);

    return {
      bondId: bond.id!,
      calculationDate: new Date().toISOString(),
      tcea: this.round(
        this.calculateEffectiveRate(cashFlows, netProceeds, periodsPerYear) * 100
      ),
      trea: this.round(
        this.calculateEffectiveRate(cashFlows, bond.faceValue, periodsPerYear) * 100
      ),
      duration: this.round(
        this.calculateDuration(cashFlows, periodicRate, periodsPerYear)
      ),
      modifiedDuration: this.round(
        this.calculateModifiedDuration(cashFlows, periodicRate, periodsPerYear)
      ),
      convexity: this.round(
        this.calculateConvexity(cashFlows, periodicRate, periodsPerYear)
      ),
      marketPrice: this.round(
        this.calculateMarketPrice(cashFlows, periodicRate)
      ),
    };
  }

  // ========================================================================
  // FUNCIONES DE UTILIDAD (SIN CAMBIOS)
  // ========================================================================

  private getPeriodsPerYear(frequency: string): number {
    const periods = this.FREQUENCY_PERIODS[frequency];
    if (!periods) throw new Error(`Frecuencia de pago no válida: ${frequency}`);
    return periods;
  }

  private getCompoundingPeriodsPerYear(compounding: string): number {
    const periods = this.COMPOUNDING_PERIODS[compounding];
    if (!periods) throw new Error(`Capitalización no válida: ${compounding}`);
    return periods;
  }

  private convertToPeriodicRate(
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

  private addPeriods(startDate: string, periods: number, frequency: string): string {
    const date = new Date(startDate);

    switch (frequency) {
      case 'MONTHLY':
        date.setMonth(date.getMonth() + periods);
        break;
      case 'BIMONTHLY':
        date.setMonth(date.getMonth() + periods * 2);
        break;
      case 'QUARTERLY':
        date.setMonth(date.getMonth() + periods * 3);
        break;
      case 'SEMIANNUAL':
        date.setMonth(date.getMonth() + periods * 6);
        break;
      case 'ANNUAL':
        date.setFullYear(date.getFullYear() + periods);
        break;
    }

    return date.toISOString().split('T')[0];
  }

  private getPeriodType(
    period: number,
    gracePeriod: number,
    graceType: string
  ): { type: string } {
    if (period <= gracePeriod) {
      return { type: graceType === 'TOTAL' ? 'GRACE_TOTAL' : 'GRACE_PARTIAL' };
    }
    return { type: 'AMORTIZATION' };
  }

  private round(value: number): number {
    const precision = Math.pow(10, this.DEFAULT_CONFIG.precision);
    return Math.round(value * precision) / precision;
  }

  // ========================================================================
  // VALIDACIÓN (MODIFICADA PARA FECHAS)
  // ========================================================================

  public validateBond(bond: BondModel): void {
    const errors: string[] = [];

    if (!bond.name || bond.name.trim().length === 0) {
      errors.push('El nombre del bono es requerido');
    }

    if (bond.faceValue <= 0) {
      errors.push('El valor nominal debe ser mayor a cero');
    }

    if (bond.interestRate < 0) {
      errors.push('La tasa de interés no puede ser negativa');
    }

    // Validación de fechas
    try {
      const totalPeriods = this.calculateTotalPeriodsFromDates(
        bond.issueDate,
        bond.maturityDate,
        bond.paymentFrequency
      );

      console.log(bond.issueDate);
      console.log(bond.maturityDate);
      console.log(bond.paymentFrequency);


      if (bond.gracePeriod < 0) {
        errors.push('El período de gracia no puede ser negativo');
      }

      if (bond.gracePeriod >= totalPeriods) {
        errors.push('El período de gracia no puede ser mayor o igual al plazo total');
      }
    } catch (e) {
      console.error('Error al calcular períodos desde fechas:', e);
      errors.push(`Error en fechas: ${e instanceof Error ? e.message : 'Error desconocido'}`);
    }

    if (bond.rateType === 'NOMINAL' && !bond.compounding) {
      errors.push('Se requiere especificar la capitalización para tasa nominal');
    }

    if (errors.length > 0) {
      throw new Error(`Errores de validación:\n${errors.join('\n')}`);
    }
  }

  // ========================================================================
  // MÉTODOS AUXILIARES PARA MÉTRICAS (SIN CAMBIOS)
  // ========================================================================

  private calculateEffectiveRate(
    cashFlows: CashflowModel[],
    initialAmount: number,
    periodsPerYear: number
  ): number {
    let rate = 0.1; // Tasa inicial del 10%

    for (let i = 0; i < this.DEFAULT_CONFIG.maxIterations; i++) {
      let npv = -initialAmount;
      let npvDerivative = 0;

      cashFlows.forEach((cf, index) => {
        const period = index + 1;
        const discountFactor = Math.pow(1 + rate / periodsPerYear, period);
        npv += cf.installment / discountFactor;
        npvDerivative -= (period * cf.installment) / (periodsPerYear * Math.pow(discountFactor, 2));
      });

      if (Math.abs(npv) < this.DEFAULT_CONFIG.tolerance) break;
      rate = rate - npv / npvDerivative;
    }

    return rate;
  }

  private calculateDuration(
    cashFlows: CashflowModel[],
    periodicRate: number,
    periodsPerYear: number
  ): number {
    let weightedTime = 0;
    let presentValue = 0;

    cashFlows.forEach((cf, index) => {
      const period = index + 1;
      const timeInYears = period / periodsPerYear;
      const pv = cf.installment / Math.pow(1 + periodicRate, period);

      weightedTime += timeInYears * pv;
      presentValue += pv;
    });

    return weightedTime / presentValue;
  }

  private calculateModifiedDuration(
    cashFlows: CashflowModel[],
    periodicRate: number,
    periodsPerYear: number
  ): number {
    const duration = this.calculateDuration(cashFlows, periodicRate, periodsPerYear);
    return duration / (1 + periodicRate);
  }

  private calculateConvexity(
    cashFlows: CashflowModel[],
    periodicRate: number,
    periodsPerYear: number
  ): number {
    let weightedTime = 0;
    let presentValue = 0;

    cashFlows.forEach((cf, index) => {
      const period = index + 1;
      const timeInYears = period / periodsPerYear;
      const pv = cf.installment / Math.pow(1 + periodicRate, period);

      weightedTime += timeInYears * (timeInYears + 1 / periodsPerYear) * pv;
      presentValue += pv;
    });

    return weightedTime / (presentValue * Math.pow(1 + periodicRate, 2));
  }

  private calculateMarketPrice(
    cashFlows: CashflowModel[],
    periodicRate: number
  ): number {
    const marketRate = periodicRate * (1 + this.DEFAULT_CONFIG.marketSpread);
    return cashFlows.reduce(
      (pv, cf, index) => pv + cf.installment / Math.pow(1 + marketRate, index + 1),
      0
    );
  }
}
