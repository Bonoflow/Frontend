import { Injectable } from '@angular/core';
import { BaseService } from '../../shared/services/base.service';
import { BondModel } from '../model/bond.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {catchError, delay, map, Observable, of} from 'rxjs';
import {CashflowModel} from '../model/cashflow.model';
import {FinancialMetricModel} from '../model/finanlcial-metric.model';

@Injectable({
  providedIn: 'root'
})
export class BondService extends BaseService<BondModel> {
  constructor(http: HttpClient) {
    super(http);
    this.extraUrl = environment.bondURL;
  }

  calculateCashFlow(bond: BondModel): Observable<CashflowModel[]> {
    return of(null).pipe(
      delay(1500),
      map(() => this.calculateFrenchMethod(bond)),
    )
  }

  calculateFinancialMetrics(bond: BondModel): Observable<FinancialMetricModel> {
    return of(null).pipe(
      delay(1000),
      map(() => {
        const cashFlows = this.calculateFrenchMethod(bond)


        const tcea = this.calculateTCEA(bond, cashFlows)
        const trea = this.calculateTREA(bond, cashFlows)
        const duration = this.calculateDuration(bond, cashFlows)
        const modifiedDuration = this.calculateModifiedDuration(duration, bond.interestRate)
        const convexity = this.calculateConvexity(bond, cashFlows)
        const marketPrice = this.calculateMarketPrice(bond, cashFlows)
        console.log("TCEA:", tcea)
        console.log("trea:", trea)
        console.log("Duration:", duration)
        console.log("Modified Duration:", modifiedDuration)
        console.log("Convexity:", convexity)
        console.log("Market Price:", marketPrice)

        return {
          bondId: bond.id,
          tcea: tcea,
          trea: trea,
          duration: duration,
          modifiedDuration: modifiedDuration,
          convexity: convexity,
          marketPrice: marketPrice,
          calculationDate: new Date().toISOString(),
        } as FinancialMetricModel;
      }),
    )
  }

  /**
   * Calcula la Tasa de Costo Efectiva Anual (TCEA)
   * Es la tasa que iguala el valor presente de todos los flujos de salida con el valor presente de todos los flujos de entrada
   */
  private calculateTCEA(bond: BondModel, cashFlows: CashflowModel[]): number {
    // Para el cálculo de TCEA, consideramos todos los costos asociados al bono
    // En este caso simplificado, usamos la tasa de interés efectiva del bono
    const periodsPerYear = 12 / this.getPaymentFrequencyMonths(bond.paymentFrequency)

    if (bond.rateType=== "effective") {
      return bond.interestRate
    } else {
      // Convertir tasa nominal a efectiva anual
      const m = this.getCapitalizationFrequency(bond.compounding || "monthly")
      return (Math.pow(1 + bond.interestRate / 100 / m, m) - 1) * 100
    }
  }

  /**
   * Calcula la Tasa de Rendimiento Efectiva Anual (TREA)
   * Es la tasa de rendimiento que obtiene el inversionista
   */
  private calculateTREA(bond: BondModel, cashFlows: CashflowModel[]): number {
    // Para simplificar, asumimos que TREA es ligeramente menor que TCEA debido a costos
    const tcea = this.calculateTCEA(bond, cashFlows)
    return tcea * 0.98 // 2% menos que TCEA como ejemplo
  }

  /**
   * Calcula la duración de Macaulay
   * Mide la sensibilidad del precio del bono a cambios en las tasas de interés
   */
  private calculateDuration(bond: BondModel, cashFlows: CashflowModel[]): number {
    const periodsPerYear = 12 / this.getPaymentFrequencyMonths(bond.paymentFrequency)
    let ratePerPeriod: number

    if (bond.rateType === "effective") {
      ratePerPeriod = Math.pow(1 + bond.interestRate/ 100, 1 / periodsPerYear) - 1
    } else {
      const m = this.getCapitalizationFrequency(bond.compounding || "monthly")
      ratePerPeriod = Math.pow(1 + bond.interestRate / 100 / m, m / periodsPerYear) - 1
    }

    let weightedTimeSum = 0
    let presentValueSum = 0

    // Excluir el período 0 (desembolso inicial)
    const paymentFlows = cashFlows.filter((flow) => flow.period > 0)

    for (const flow of paymentFlows) {
      const presentValue = flow.installment / Math.pow(1 + ratePerPeriod, flow.period)
      const weightedTime = (flow.period / periodsPerYear) * presentValue

      weightedTimeSum += weightedTime
      presentValueSum += presentValue
    }

    return presentValueSum > 0 ? weightedTimeSum / presentValueSum : 0
  }

  /**
   * Calcula la duración modificada
   * Es la duración de Macaulay dividida por (1 + tasa de rendimiento)
   */
  private calculateModifiedDuration(duration: number, interestRate: number): number {
    return duration / (1 + interestRate / 100)
  }

  /**
   * Calcula la convexidad
   * Mide la curvatura de la relación precio-rendimiento
   */
  private calculateConvexity(bond: BondModel, cashFlows: CashflowModel[]): number {
    const periodsPerYear = 12 / this.getPaymentFrequencyMonths(bond.paymentFrequency)
    let ratePerPeriod: number

    if (bond.rateType === "effective") {
      ratePerPeriod = Math.pow(1 + bond.interestRate/ 100, 1 / periodsPerYear) - 1
    } else {
      const m = this.getCapitalizationFrequency(bond.compounding || "monthly")
      ratePerPeriod = Math.pow(1 + bond.interestRate / 100 / m, m / periodsPerYear) - 1
    }

    let convexitySum = 0
    let presentValueSum = 0

    // Excluir el período 0 (desembolso inicial)
    const paymentFlows = cashFlows.filter((flow) => flow.period > 0)

    for (const flow of paymentFlows) {
      const presentValue = flow.installment / Math.pow(1 + ratePerPeriod, flow.period)
      const timeSquared = Math.pow(flow.period / periodsPerYear, 2)
      const convexityComponent = timeSquared * presentValue

      convexitySum += convexityComponent
      presentValueSum += presentValue
    }

    const convexity = presentValueSum > 0 ? convexitySum / presentValueSum : 0
    return convexity / Math.pow(1 + ratePerPeriod, 2)
  }

  /**
   * Calcula el precio de mercado del bono
   * Es el valor presente de todos los flujos futuros
   */
  private calculateMarketPrice(bond: BondModel, cashFlows: CashflowModel[], marketRate?: number): number {
    const periodsPerYear = 12 / this.getPaymentFrequencyMonths(bond.paymentFrequency)

    // Si no se proporciona tasa de mercado, usar la tasa del bono
    let discountRate: number
    if (marketRate) {
      discountRate = Math.pow(1 + marketRate / 100, 1 / periodsPerYear) - 1
    } else {
      if (bond.rateType === "effective") {
        discountRate = Math.pow(1 + bond.interestRate / 100, 1 / periodsPerYear) - 1
      } else {
        const m = this.getCapitalizationFrequency(bond.compounding || "monthly")
        discountRate = Math.pow(1 + bond.interestRate/ 100 / m, m / periodsPerYear) - 1
      }
    }

    let presentValue = 0

    // Excluir el período 0 (desembolso inicial)
    const paymentFlows = cashFlows.filter((flow) => flow.period > 0)

    for (const flow of paymentFlows) {
      presentValue += flow.installment / Math.pow(1 + discountRate, flow.period)
    }

    return presentValue
  }

  private calculateFrenchMethod(bond: BondModel): CashflowModel[] {
    const cashFlows: CashflowModel[] = []

    // Convertir tasa de interés a tasa efectiva por período
    const periodsPerYear = 12 / this.getPaymentFrequencyMonths(bond.paymentFrequency)
    let ratePerPeriod: number

    if (bond.rateType === "effective") {
      ratePerPeriod = Math.pow(1 + bond.interestRate / 100, 1 / periodsPerYear) - 1
    } else {
      const m = this.getCapitalizationFrequency(bond.compounding || "monthly")
      ratePerPeriod = Math.pow(1 + bond.interestRate / 100 / m, m / periodsPerYear) - 1
    }

    const numberOfPeriods = bond.term / this.getPaymentFrequencyMonths(bond.paymentFrequency)
    const payment = this.calculatePayment(
      bond.faceValue,
      ratePerPeriod,
      numberOfPeriods,
      bond.graceType,
      bond.gracePeriod,
    )

    let balance = bond.faceValue
    const startDate = new Date()
    const periodMonths = this.getPaymentFrequencyMonths(bond.paymentFrequency)

    for (let period = 0; period <= numberOfPeriods; period++) {
      const dateObj = new Date(startDate)
      dateObj.setMonth(startDate.getMonth() + period * periodMonths)
      const date = dateObj.toISOString()
      const initialBalance = balance

      // Período 0 (desembolso)
      if (period === 0) {
        cashFlows.push({
          bondId: bond.id ?? 0,
          period,
          date,
          initialBalance: 0,
          interest: 0,
          amortization: -bond.faceValue,
          installment: -bond.faceValue,
          finalBalance: bond.faceValue,
        })
        continue
      }

      const interest = balance * ratePerPeriod
      let amortization = 0
      let periodPayment = payment

      if (period <= bond.gracePeriod) {
        if (bond.graceType === "total") {
          amortization = 0
          periodPayment = 0
          balance += interest
        } else if (bond.graceType=== "partial") {
          amortization = 0
          periodPayment = interest
        }
      } else {
        amortization = payment - interest
      }

      balance -= amortization

      // Agregar flujo
      cashFlows.push({
        bondId: bond.id ?? 0,
        period,
        date,
        initialBalance: initialBalance,
        interest,
        amortization,
        installment: periodPayment,
        finalBalance: balance,
      })
    }

    return cashFlows
  }

  private calculatePayment(
    principal: number,
    ratePerPeriod: number,
    numberOfPeriods: number,
    graceType: string,
    gracePeriod: number,
  ): number {
    const adjustedPeriods = numberOfPeriods - (graceType === "total" ? gracePeriod : 0)

    if (ratePerPeriod === 0) return principal / adjustedPeriods

    const numerator = principal * ratePerPeriod * Math.pow(1 + ratePerPeriod, adjustedPeriods)
    const denominator = Math.pow(1 + ratePerPeriod, adjustedPeriods) - 1

    return numerator / denominator
  }

  private getPaymentFrequencyMonths(frequency: string): number {
    switch (frequency) {
      case "monthly":
        return 1
      case "bimonthly":
        return 2
      case "quarterly":
        return 3
      case "semiannual":
        return 6
      case "annual":
        return 12
      default:
        return 1
    }
  }

  private getCapitalizationFrequency(capitalization: string): number {
    switch (capitalization) {
      case "daily":
        return 360
      case "monthly":
        return 12
      case "bimonthly":
        return 6
      case "quarterly":
        return 4
      case "semiannual":
        return 2
      case "annual":
        return 1
      default:
        return 12
    }
  }
}
