export class CashflowModel {
  id?: number;
  bondId: number;
  period: number;
  date: string; // Usar string para fechas ISO (LocalDate)
  initialBalance: number;
  interest: number;
  amortization: number;
  fixedInstallment: number; // Este campo es opcional
  installment: number;
  finalBalance: number;
  expenses: number;
  investorFlow: number;

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
    fixedInstallment: number = 0,
    expenses: number = 0,
    investorFlow: number = 0 // Asignar un valor por defecto
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
    this.expenses = expenses;
    this.investorFlow = investorFlow; // Asignar el valor del flujo del inversionista
  }
}
