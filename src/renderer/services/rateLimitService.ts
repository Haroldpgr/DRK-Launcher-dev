// Servicio para gestionar límites de peticiones de la API
export class RateLimitService {
  private readonly DAILY_LIMIT_KEY = 'ai_request_limit';
  private readonly MINUTE_LIMIT_KEY = 'ai_request_minute_limit';
  private readonly LIMIT_PER_DAY = 50; // Límite diario de peticiones
  private readonly LIMIT_PER_MINUTE = 5; // Límite por minuto para evitar errores 429
  private readonly DAY_IN_MS = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
  private readonly MINUTE_IN_MS = 60 * 1000; // 1 minuto en milisegundos

  /**
   * Verifica si el usuario puede hacer una petición
   * @returns true si puede hacer la petición, false si ha superado algún límite
   */
  public canMakeRequest(): boolean {
    const dailyLimitData = this.getDailyLimitData();
    const minuteLimitData = this.getMinuteLimitData();
    const now = Date.now();

    // Si es un nuevo día, reiniciar el contador diario
    if (now - dailyLimitData.lastReset > this.DAY_IN_MS) {
      this.resetDailyLimit();
    }

    // Si es un nuevo minuto, reiniciar el contador por minuto
    if (now - minuteLimitData.lastReset > this.MINUTE_IN_MS) {
      this.resetMinuteLimit();
    }

    // Verificar ambos límites
    const dailyCanMakeRequest = dailyLimitData.count < this.LIMIT_PER_DAY;
    const minuteCanMakeRequest = minuteLimitData.count < this.LIMIT_PER_MINUTE;

    return dailyCanMakeRequest && minuteCanMakeRequest;
  }

  /**
   * Registra una petición realizada
   * @returns true si se registró correctamente, false si ha superado el límite
   */
  public recordRequest(): boolean {
    if (!this.canMakeRequest()) {
      return false;
    }

    const now = Date.now();
    const dailyLimitData = this.getDailyLimitData();
    const minuteLimitData = this.getMinuteLimitData();

    // Si es un nuevo día, reiniciar
    if (now - dailyLimitData.lastReset > this.DAY_IN_MS) {
      this.resetDailyLimit();
    } else {
      // Incrementar contador diario
      dailyLimitData.count += 1;
      this.saveDailyLimitData(dailyLimitData);
    }

    // Si es un nuevo minuto, reiniciar
    if (now - minuteLimitData.lastReset > this.MINUTE_IN_MS) {
      this.resetMinuteLimit();
    } else {
      // Incrementar contador por minuto
      minuteLimitData.count += 1;
      minuteLimitData.lastRequest = now;
      this.saveMinuteLimitData(minuteLimitData);
    }

    return true;
  }

  /**
   * Obtiene información sobre el estado actual de los límites
   */
  public getLimitInfo(): {
    dailyCount: number;
    dailyRemaining: number;
    minuteCount: number;
    minuteRemaining: number;
    resetTime: Date;
    canMakeRequest: boolean;
    dailyResetTime: Date;
    minuteResetTime: Date;
  } {
    const dailyLimitData = this.getDailyLimitData();
    const minuteLimitData = this.getMinuteLimitData();
    const now = Date.now();

    // Verificar si es nuevo día o minuto
    const isNextDay = now - dailyLimitData.lastReset > this.DAY_IN_MS;
    const isNextMinute = now - minuteLimitData.lastReset > this.MINUTE_IN_MS;

    // Calcular resets
    const dailyResetTime = new Date(dailyLimitData.lastReset + this.DAY_IN_MS);
    const minuteResetTime = new Date(minuteLimitData.lastReset + this.MINUTE_IN_MS);

    // Contadores actuales
    const currentDailyCount = isNextDay ? 0 : dailyLimitData.count;
    const currentMinuteCount = isNextMinute ? 0 : minuteLimitData.count;

    // Cálculo de restantes
    const dailyRemaining = this.LIMIT_PER_DAY - currentDailyCount;
    const minuteRemaining = this.LIMIT_PER_MINUTE - currentMinuteCount;

    return {
      dailyCount: currentDailyCount,
      dailyRemaining: Math.max(0, dailyRemaining),
      minuteCount: currentMinuteCount,
      minuteRemaining: Math.max(0, minuteRemaining),
      resetTime: dailyResetTime, // para mantener compatibilidad con el código existente
      dailyResetTime,
      minuteResetTime,
      canMakeRequest: dailyRemaining > 0 && minuteRemaining > 0
    };
  }

  // Métodos para límite diario
  private getDailyLimitData(): { count: number; lastReset: number; lastRequest: number } {
    const data = localStorage.getItem(this.DAILY_LIMIT_KEY);
    if (!data) {
      return this.getDefaultLimitData();
    }

    try {
      const parsed = JSON.parse(data);
      return {
        count: parseInt(parsed.count) || 0,
        lastReset: parseInt(parsed.lastReset) || Date.now(),
        lastRequest: parseInt(parsed.lastRequest) || 0
      };
    } catch {
      return this.getDefaultLimitData();
    }
  }

  private saveDailyLimitData(data: { count: number; lastReset: number; lastRequest: number }): void {
    localStorage.setItem(this.DAILY_LIMIT_KEY, JSON.stringify(data));
  }

  private resetDailyLimit(): void {
    const now = Date.now();
    this.saveDailyLimitData({
      count: 0,
      lastReset: now,
      lastRequest: now
    });
  }

  // Métodos para límite por minuto
  private getMinuteLimitData(): { count: number; lastReset: number; lastRequest: number } {
    const data = localStorage.getItem(this.MINUTE_LIMIT_KEY);
    if (!data) {
      return this.getDefaultLimitData();
    }

    try {
      const parsed = JSON.parse(data);
      return {
        count: parseInt(parsed.count) || 0,
        lastReset: parseInt(parsed.lastReset) || Date.now(),
        lastRequest: parseInt(parsed.lastRequest) || 0
      };
    } catch {
      return this.getDefaultLimitData();
    }
  }

  private saveMinuteLimitData(data: { count: number; lastReset: number; lastRequest: number }): void {
    localStorage.setItem(this.MINUTE_LIMIT_KEY, JSON.stringify(data));
  }

  private resetMinuteLimit(): void {
    const now = Date.now();
    this.saveMinuteLimitData({
      count: 0,
      lastReset: now,
      lastRequest: now
    });
  }

  // Método auxiliar
  private getDefaultLimitData(): { count: number; lastReset: number; lastRequest: number } {
    const now = Date.now();
    return {
      count: 0,
      lastReset: now,
      lastRequest: 0
    };
  }
}

// Instancia singleton del servicio
export const rateLimitService = new RateLimitService();