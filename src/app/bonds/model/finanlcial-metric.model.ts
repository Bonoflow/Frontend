export class FinancialMetricModel {
  id?: number;
  bondId: number;
  tcea: number;
  trea: number;
  duration: number;
  modifiedDuration: number;
  convexity: number;
  marketPrice: number;
  calculationDate: string; // Usar string para fechas ISO

  constructor(
    bondId: number,
    tcea: number,
    trea: number,
    duration: number,
    modifiedDuration: number,
    convexity: number,
    marketPrice: number,
    calculationDate: string,
    id?: number
  ) {
    this.id = id;
    this.bondId = bondId;
    this.tcea = tcea;
    this.trea = trea;
    this.duration = duration;
    this.modifiedDuration = modifiedDuration;
    this.convexity = convexity;
    this.marketPrice = marketPrice;
    this.calculationDate = calculationDate;
  }
}
