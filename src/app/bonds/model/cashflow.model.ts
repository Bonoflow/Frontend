export class CashflowModel {
  id?: number;
  bondId: number;
  period: number;
  date: string; // Usar string para fechas ISO (LocalDate)
  initialBalance: number;
  interest: number;
  amortization: number;
  fixedInstallment?: number; // Este campo es opcional
  installment: number;
  finalBalance: number;

  constructor(
    bondId: number,
    period: number,
    date: string,
    initialBalance: number,
    interest: number,
    amortization: number,
    installment: number,
    finalBalance: number,
    id?: number,
    fixedInstallment?: number // Este campo es opcional
  ) {
    this.id = id;
    this.bondId = bondId;
    this.period = period;
    this.date = date;
    this.initialBalance = initialBalance;
    this.interest = interest;
    this.amortization = amortization;
    this.installment = installment;
    this.finalBalance = finalBalance;
    this.fixedInstallment = fixedInstallment; // Asignar el valor del campo opcional
  }
}
