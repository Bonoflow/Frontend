export class ConfigurationModel {
  id?: number;
  userId: number;
  currency: string;
  rateType: String;
  compounding?: String;

  constructor(
    userId: number,
    currency: string,
    rateType: String,
    compounding?: String,
    id?: number
  ) {
    this.id = id;
    this.userId = userId;
    this.currency = currency;
    this.rateType = rateType;
    this.compounding = compounding;
  }
}
