import {BondModel} from '../bonds/model/bond.model';
import {delay, map, Observable, of} from 'rxjs';
import {CashflowModel} from '../bonds/model/cashflow.model';
import {FinancialMetricModel} from '../bonds/model/finanlcial-metric.model';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class BondCalculatorService {

  calculateCashFlow(bond: BondModel): Observable<CashflowModel[]> {
    return of(null).pipe(
      delay(1500),
      map(() => this.calculateFrenchMethod(bond)),
    );
  }

  calculateFinancialMetrics(bond: BondModel): Observable<FinancialMetricModel> {
    return of(null).pipe(
      delay(1000),
      map(() => {
        // Calculamos los valores comunes una sola vez
        const cashFlows = this.calculateFrenchMethod(bond);
        const { ratePerPeriod, periodsPerYear } = this.getCommonCalculationParams(bond);
        const discountRate = this.getDiscountRate(bond);

        // Pasamos los parámetros comunes a todas las funciones
        const tcea = this.calculateTCEA(bond);
        const trea = this.calculateTREA(tcea);
        const duration = this.calculateDuration(cashFlows, ratePerPeriod, periodsPerYear);

        return {
          bondId: bond.id,
          tcea,
          trea,
          duration,
          modifiedDuration: this.calculateModifiedDuration(duration, bond.interestRate),
          convexity: this.calculateConvexity(cashFlows, ratePerPeriod, periodsPerYear),
          marketPrice: this.calculateMarketPrice(cashFlows, discountRate),
          calculationDate: new Date().toISOString(),
        } as FinancialMetricModel;
      }),
    );
  }

  private getCommonCalculationParams(bond: BondModel): {
    ratePerPeriod: number;
    periodsPerYear: number;
  } {
    const periodsPerYear = this.getPeriodsPerYear(bond.paymentFrequency);
    const ratePerPeriod = this.calculateRatePerPeriod(bond, periodsPerYear);

    return { ratePerPeriod, periodsPerYear };
  }

  private calculateRatePerPeriod(bond: BondModel, periodsPerYear: number): number {
    if (bond.rateType === "EFFECTIVE") {
      return Math.pow(1 + bond.interestRate / 100, 1 / periodsPerYear) - 1;
    } else {
      const m = this.getCapitalizationFrequency(bond.compounding || "MONTHLY");
      return Math.pow(1 + bond.interestRate / 100 / m, m / periodsPerYear) - 1;
    }
  }

  private getDiscountRate(bond: BondModel): number {
    const periodsPerYear = this.getPeriodsPerYear(bond.paymentFrequency);
    return this.calculateRatePerPeriod(bond, periodsPerYear);
  }

  private getPeriodsPerYear(paymentFrequency: string): number {
    return 12 / this.getPaymentFrequencyMonths(paymentFrequency);
  }

  /**
   * Métodos de cálculo que ahora reciben los parámetros precalculados
   */
  private calculateTCEA(bond: BondModel): number {
    if (bond.rateType === "EFFECTIVE") {
      return bond.interestRate;
    } else {
      const m = this.getCapitalizationFrequency(bond.compounding || "MONTHLY");
      return (Math.pow(1 + bond.interestRate / 100 / m, m) - 1) * 100;
    }
  }

  private calculateTREA(tcea: number): number {
    return tcea * 0.98; // 2% menos que TCEA
  }

  private calculateDuration(
    cashFlows: CashflowModel[],
    ratePerPeriod: number,
    periodsPerYear: number
  ): number {
    let weightedTimeSum = 0;
    let presentValueSum = 0;

    for (const flow of this.getPaymentFlows(cashFlows)) {
      const presentValue = flow.installment / Math.pow(1 + ratePerPeriod, flow.period);
      weightedTimeSum += (flow.period / periodsPerYear) * presentValue;
      presentValueSum += presentValue;
    }

    return presentValueSum > 0 ? weightedTimeSum / presentValueSum : 0;
  }

  private calculateModifiedDuration(duration: number, interestRate: number): number {
    return duration / (1 + interestRate / 100);
  }

  private calculateConvexity(
    cashFlows: CashflowModel[],
    ratePerPeriod: number,
    periodsPerYear: number
  ): number {
    let convexitySum = 0;
    let presentValueSum = 0;

    for (const flow of this.getPaymentFlows(cashFlows)) {
      const presentValue = flow.installment / Math.pow(1 + ratePerPeriod, flow.period);
      convexitySum += Math.pow(flow.period / periodsPerYear, 2) * presentValue;
      presentValueSum += presentValue;
    }

    const convexity = presentValueSum > 0 ? convexitySum / presentValueSum : 0;
    return convexity / Math.pow(1 + ratePerPeriod, 2);
  }

  private calculateMarketPrice(
    cashFlows: CashflowModel[],
    discountRate: number
  ): number {
    return this.getPaymentFlows(cashFlows).reduce(
      (sum, flow) => sum + flow.installment / Math.pow(1 + discountRate, flow.period),
      0
    );
  }

  /**
   * Método francés optimizado
   */
  private calculateFrenchMethod(bond: BondModel): CashflowModel[] {
    const { ratePerPeriod} = this.getCommonCalculationParams(bond);
    const numberOfPeriods = bond.term / this.getPaymentFrequencyMonths(bond.paymentFrequency);
    const periodMonths = this.getPaymentFrequencyMonths(bond.paymentFrequency);

    const payment = this.calculatePayment(
      bond.faceValue,
      ratePerPeriod,
      numberOfPeriods,
      bond.graceType,
      bond.gracePeriod,
    );

    let balance = bond.faceValue;
    const startDate = new Date();
    const cashFlows: CashflowModel[] = [
      this.createInitialCashFlow(bond, startDate)
    ];

    for (let period = 1; period <= numberOfPeriods; period++) {
      const date = new Date(startDate);
      date.setMonth(startDate.getMonth() + period * periodMonths);

      const cashFlow = this.createPeriodCashFlow(
        bond, period, date.toISOString(), balance, ratePerPeriod, payment
      );

      cashFlows.push(cashFlow);
      balance = cashFlow.finalBalance;
    }

    return cashFlows;
  }

  // Resto de métodos auxiliares (sin cambios)
  private getPaymentFlows(cashFlows: CashflowModel[]): CashflowModel[] {
    return cashFlows.filter(flow => flow.period > 0);
  }

  private createInitialCashFlow(bond: BondModel, date: Date): CashflowModel {
    return {
      bondId: bond.id ?? 0,
      period: 0,
      date: date.toISOString(),
      initialBalance: 0,
      interest: 0,
      amortization: -bond.faceValue,
      installment: -bond.faceValue,
      finalBalance: bond.faceValue,
    };
  }

  private createPeriodCashFlow(
    bond: BondModel,
    period: number,
    date: string,
    initialBalance: number,
    ratePerPeriod: number,
    payment: number
  ): CashflowModel {
    const interest = initialBalance * ratePerPeriod;
    let amortization = 0;
    let periodPayment = payment;
    let finalBalance = initialBalance;

    if (period <= bond.gracePeriod) {
      if (bond.graceType === "TOTAL") {
        periodPayment = 0;
        finalBalance += interest;
      } else if (bond.graceType === "PARTIAL") {
        periodPayment = interest;
      }
    } else {
      amortization = payment - interest;
      finalBalance -= amortization;
    }

    return {
      bondId: bond.id ?? 0,
      period,
      date,
      initialBalance,
      interest,
      amortization,
      installment: periodPayment,
      finalBalance,
    };
  }

  private calculatePayment(
    principal: number,
    ratePerPeriod: number,
    numberOfPeriods: number,
    graceType: string,
    gracePeriod: number,
  ): number {
    const adjustedPeriods = numberOfPeriods - (graceType === "TOTAL" ? gracePeriod : 0);
    if (ratePerPeriod === 0) return principal / adjustedPeriods;

    return principal * ratePerPeriod * Math.pow(1 + ratePerPeriod, adjustedPeriods) /
      (Math.pow(1 + ratePerPeriod, adjustedPeriods) - 1);
  }

  private getPaymentFrequencyMonths(frequency: string): number {
    switch (frequency) {
      case "MONTHLY": return 1;
      case "BIMONTHLY": return 2;
      case "QUARTERLY": return 3;
      case "SEMIANNUAL": return 6;
      case "ANNUAL": return 12;
      default: return 1;
    }
  }

  private getCapitalizationFrequency(capitalization: string): number {
    switch (capitalization) {
      case "DAILY": return 360;
      case "MONTHLY": return 12;
      case "BIMONTHLY": return 6;
      case "QUARTERLY": return 4;
      case "SEMIANNUAL": return 2;
      case "ANNUAL": return 1;
      default: return 12;
    }
  }
}
