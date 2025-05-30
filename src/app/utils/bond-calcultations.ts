import {BondModel} from '../bonds/model/bond.model';
import {CashflowModel} from '../bonds/model/cashflow.model';

/**
 * Calcula el flujo de caja de un bono utilizando el método francés
 * @param bond Datos del bono
 * @returns Array de flujos de caja
 */
export function calculateFrenchMethod(bond: BondModel): CashflowModel[] {
  const cashFlows: CashflowModel[] = []

  // Convertir tasa de interés a tasa efectiva por período
  const periodsPerYear = 12 / getPaymentFrequencyMonths(bond.paymentFrequency)
  let ratePerPeriod: number

  if (bond.rateType === "effective") {
    // Convertir tasa efectiva anual a tasa efectiva por período
    ratePerPeriod = Math.pow(1 + bond.interestRate / 100, 1 / periodsPerYear) - 1
  } else {
    // Convertir tasa nominal a tasa efectiva por período
    const m = getCapitalizationFrequency(bond.compounding || "monthly")
    ratePerPeriod = Math.pow(1 + bond.interestRate/ 100 / m, m / periodsPerYear) - 1
  }

  // Calcular número de períodos
  const numberOfPeriods = bond.term / getPaymentFrequencyMonths(bond.paymentFrequency)

  // Calcular cuota constante (método francés)
  const payment = calculatePayment(
    bond.faceValue,
    ratePerPeriod,
    numberOfPeriods,
    bond.graceType,
    bond.gracePeriod,
  )

  // Generar flujo de caja
  let balance = bond.faceValue
  const startDate = new Date()
  const periodMonths = getPaymentFrequencyMonths(bond.paymentFrequency)

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

    // Calcular interés del período
    const interest = balance * ratePerPeriod

    // Determinar amortización según tipo de gracia
    let amortization = 0
    let periodPayment = payment

    if (period <= bond.gracePeriod) {
      if (bond.graceType === "total") {
        // Gracia total: no se paga ni interés ni amortización
        amortization = 0
        periodPayment = 0
        balance += interest // El interés se capitaliza
      } else if (bond.graceType === "partial") {
        // Gracia parcial: solo se paga interés
        amortization = 0
        periodPayment = interest
      }
    } else {
      // Período normal: se paga cuota completa
      amortization = payment - interest
    }

    // Actualizar saldo
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

/**
 * Calcula la cuota constante según el método francés
 */
function calculatePayment(
  principal: number,
  ratePerPeriod: number,
  numberOfPeriods: number,
  graceType: string,
  gracePeriod: number,
): number {
  // Ajustar número de períodos considerando período de gracia
  const adjustedPeriods = numberOfPeriods - (graceType === "total" ? gracePeriod : 0)

  // Fórmula de cuota constante: P * r * (1+r)^n / ((1+r)^n - 1)
  if (ratePerPeriod === 0) return principal / adjustedPeriods

  const numerator = principal * ratePerPeriod * Math.pow(1 + ratePerPeriod, adjustedPeriods)
  const denominator = Math.pow(1 + ratePerPeriod, adjustedPeriods) - 1

  return numerator / denominator
}

/**
 * Obtiene la frecuencia de capitalización en términos de períodos por año
 */
function getCapitalizationFrequency(capitalization: string): number {
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

/**
 * Obtiene el número de meses según la frecuencia de pago
 */
function getPaymentFrequencyMonths(frequency: string): number {
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
