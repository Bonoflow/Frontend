export class BondModel {
  id?: number;
  clientId: number;
  name: string;
  faceValue: number;
  interestRate: number;
  rateType: string;
  compounding?: string;
  paymentFrequency: string;
  currency: string;
  graceType: string;
  gracePeriod: number;
  issueDate: string;
  maturityDate: string;
  issuanceExpenses?: number;
  placementExpenses?: number;
  structuringExpenses?: number;
  cavaliExpenses?: number;
  marketRate: number;

  constructor(
    clientId: number,
    name: string,
    faceValue: number,
    interestRate: number,
    rateType: string,
    term: number,
    paymentFrequency: string,
    currency: string,
    graceType: string,
    gracePeriod: number,
    compounding?: string,
    id?: number,
    issueDate?: string,
    maturityDate?: string,
    issuanceExpenses?: number,
    placementExpenses?: number,
    structuringExpenses?: number,
    cavaliExpenses?: number,
    marketRate?: number
  ) {
    this.id = id;
    this.clientId = clientId;
    this.name = name;
    this.faceValue = faceValue;
    this.interestRate = interestRate;
    this.rateType = rateType;
    this.compounding = compounding;
    this.paymentFrequency = paymentFrequency;
    this.currency = currency;
    this.graceType = graceType;
    this.gracePeriod = gracePeriod;
    this.issueDate = issueDate || new Date().toISOString();
    this.maturityDate = maturityDate || new Date(new Date().setFullYear(new Date().getFullYear() + term)).toISOString();
    this.issuanceExpenses = issuanceExpenses || 0;
    this.placementExpenses = placementExpenses || 0;
    this.structuringExpenses = structuringExpenses || 0;
    this.cavaliExpenses = cavaliExpenses || 0;
    this.marketRate = marketRate || 0;
  }
}
