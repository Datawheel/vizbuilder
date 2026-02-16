export class ChartEligibility {
  private context: string;
  private logger: (message: string) => void;
  private readonly reasons: string[] = [];

  constructor(context: string, logger?: (message: string) => void) {
    this.context = context;
    this.logger = logger || console.debug;
  }

  /**
   * Bails if a condition is met.
   * @param badCondition A condition that, if true, should cause a bail.
   * @param reason The reason for bailing.
   * @returns `true` if the condition was met, indicating the caller should bail.
   */
  bailIf(badCondition: boolean, reason: string): boolean {
    if (badCondition) {
      const message = `[${this.context}] ${reason}`;
      this.reasons.push(message);
      if (this.logger) {
        this.logger(message);
      }
      return true;
    }
    return false;
  }

  getReasons(): readonly string[] {
    return this.reasons;
  }
}
