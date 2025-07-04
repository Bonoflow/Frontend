export class InvestmentModel {
  id?: number;
  investorId!: number;
  bondId!: number;
  amount!: number;
  investmentDate!: string;

  constructor(
    investorId: number,
    bondId: number,
    amount: number,
    investmentDate: string,
    id?: number
  ) {
    this.id = id;
    this.investorId = investorId;
    this.bondId = bondId;
    this.amount = amount;
    this.investmentDate = investmentDate;
  }
}
