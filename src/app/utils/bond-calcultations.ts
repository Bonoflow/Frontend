import { Injectable } from '@angular/core';
import { BondModel } from '../bonds/model/bond.model';
import { CashflowModel } from '../bonds/model/cashflow.model';
import { FinancialMetricModel } from '../bonds/model/finanlcial-metric.model';
import { BondCashflowCalculator } from './bond-cashflow-calculator';
import { BondMetricsCalculator } from './bond-metrics-calculator';

@Injectable({
  providedIn: 'root'
})
export class BondCalculatorService {

  public calculateCashFlowsOnly(bond: BondModel): CashflowModel[] {
    this.validateBond(bond);
    return BondCashflowCalculator.calculateFrenchMethodCashFlow(bond);
  }

  public calculateMetricsOnly(
    bond: BondModel,
    cashFlows: CashflowModel[]
  ): FinancialMetricModel {
    this.validateBond(bond);
    return BondMetricsCalculator.calculateFinancialMetrics(bond, cashFlows);
  }

  public validateBond(bond: BondModel): void {
    const errors: string[] = [];

    if (!bond.name || bond.name.trim().length === 0) errors.push('El nombre del bono es requerido');
    if (bond.faceValue <= 0) errors.push('El valor nominal debe ser mayor a cero');
    if (bond.interestRate < 0) errors.push('La tasa de interés no puede ser negativa');

    try {
      const totalPeriods = BondMetricsCalculator.calculateTotalPeriodsFromDates(
        bond.issueDate,
        bond.maturityDate,
        bond.paymentFrequency
      );
      if (bond.gracePeriod < 0) errors.push('El período de gracia no puede ser negativo');
      if (bond.gracePeriod >= totalPeriods) errors.push('El período de gracia no puede ser mayor o igual al plazo total');
    } catch (e) {
      errors.push(`Error en fechas: ${e instanceof Error ? e.message : 'Error desconocido'}`);
    }

    if (bond.rateType === 'NOMINAL' && !bond.compounding) {
      errors.push('Se requiere especificar la capitalización para tasa nominal');
    }

    if (errors.length > 0) {
      throw new Error(`Errores de validación:\n${errors.join('\n')}`);
    }
  }
}
