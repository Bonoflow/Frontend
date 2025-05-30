export class BondModel {
  id?: number;
  clientId: number;
  name: string;
  faceValue: number;
  interestRate: number;
  rateType: string;
  compounding?: string;
  term: number;
  paymentFrequency: string;
  currency: string;
  graceType: string;
  gracePeriod: number;

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
    id?: number
  ) {
    this.id = id;
    this.clientId = clientId;
    this.name = name;
    this.faceValue = faceValue;
    this.interestRate = interestRate;
    this.rateType = rateType;
    this.compounding = compounding;
    this.term = term;
    this.paymentFrequency = paymentFrequency;
    this.currency = currency;
    this.graceType = graceType;
    this.gracePeriod = gracePeriod;
  }
}
