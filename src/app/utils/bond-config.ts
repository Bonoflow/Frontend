export class BondConfig {
  static readonly FREQUENCY_PERIODS: Record<string, number> = {
    MONTHLY: 12,
    BIMONTHLY: 6,
    QUARTERLY: 4,
    SEMIANNUAL: 2,
    ANNUAL: 1,
  };

  static readonly COMPOUNDING_PERIODS: Record<string, number> = {
    MONTHLY: 12,
    QUARTERLY: 4,
    SEMIANNUAL: 2,
    ANNUAL: 1,
    DAILY: 365,
  };

  static readonly DEFAULT_CONFIG = {
    precision: 7,
    tolerance: 1e-6,
    maxIterations: 100,
    marketSpread: 0.01,
  };
}
