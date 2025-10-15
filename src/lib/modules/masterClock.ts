export interface TradingSession {
  name: string;
  start: string;
  end: string;
  timezone: string;
}

export interface SessionStatus {
  isActive: boolean;
  currentSession: string | null;
  nextSession: string | null;
  timeUntilNext: number;
  serverTime: Date;
}

export class MasterClock {
  private static instance: MasterClock;
  private timezone: string = 'Europe/Paris';
  private sessions: TradingSession[] = [
    {
      name: 'Asian',
      start: '01:00',
      end: '07:00',
      timezone: 'Europe/Paris'
    },
    {
      name: 'Asian Killzone',
      start: '07:00',
      end: '08:30',
      timezone: 'Europe/Paris'
    },
    {
      name: 'London',
      start: '07:00',
      end: '10:30',
      timezone: 'Europe/Paris'
    },
    {
      name: 'London Killzone',
      start: '07:00',
      end: '10:30',
      timezone: 'Europe/Paris'
    },
    {
      name: 'New York Killzone',
      start: '14:00',
      end: '17:00',
      timezone: 'Europe/Paris'
    }
  ];

  private constructor() {}

  public static getInstance(): MasterClock {
    if (!MasterClock.instance) {
      MasterClock.instance = new MasterClock();
    }
    return MasterClock.instance;
  }

  public getServerTime(): Date {
    return new Date();
  }

  public getCurrentSession(): SessionStatus {
    const now = new Date();
    // Convert to Paris time (UTC+1 in winter, UTC+2 in summer)
    const parisTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Paris"}));
    const currentHour = parisTime.getHours();
    const currentMinute = parisTime.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    let activeSession: string | null = null;
    let nextSession: string | null = null;
    let timeUntilNext = Infinity;

    for (const session of this.sessions) {
      const [startHour, startMinute] = session.start.split(':').map(Number);
      const [endHour, endMinute] = session.end.split(':').map(Number);

      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;

      if (currentTime >= startTime && currentTime < endTime) {
        activeSession = session.name;
      }

      if (currentTime < startTime) {
        const timeUntil = startTime - currentTime;
        if (timeUntil < timeUntilNext) {
          timeUntilNext = timeUntil;
          nextSession = session.name;
        }
      }
    }

    return {
      isActive: activeSession !== null,
      currentSession: activeSession,
      nextSession: nextSession || this.sessions[0].name,
      timeUntilNext: timeUntilNext === Infinity ? 0 : timeUntilNext,
      serverTime: now
    };
  }

  public isInKillzone(): boolean {
    const status = this.getCurrentSession();
    return status.currentSession === 'London Killzone' ||
           status.currentSession === 'Asian Killzone' ||
           status.currentSession === 'New York Killzone';
  }

  public isInAsianSession(): boolean {
    const status = this.getCurrentSession();
    return status.currentSession === 'Asian';
  }

  public isInAsianKillzone(): boolean {
    const status = this.getCurrentSession();
    return status.currentSession === 'Asian Killzone';
  }

  public isInLondonKillzone(): boolean {
    const status = this.getCurrentSession();
    return status.currentSession === 'London Killzone';
  }

  public isInNewYorkKillzone(): boolean {
    const status = this.getCurrentSession();
    return status.currentSession === 'New York Killzone';
  }
  public getAsianRange(): { start: Date; end: Date } {
    const now = new Date();
    const parisTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Paris"}));
    const start = new Date(now);
    start.setHours(1, 0, 0, 0);

    const end = new Date(now);
    end.setHours(7, 0, 0, 0);

    return { start, end };
  }

  public shouldTriggerContinuousScan(): boolean {
    const status = this.getCurrentSession();
    
    // Asian Killzone: every 1-5 minutes
    if (status.currentSession === 'Asian Killzone') {
      return true;
    }
    
    // London Killzone: every 1-5 minutes  
    if (status.currentSession === 'London Killzone') {
      return true;
    }
    
    // New York Killzone: every 1-5 minutes
    if (status.currentSession === 'New York Killzone') {
      return true;
    }

    return false;
  }

  public shouldUpdateAsianRange(): boolean {
    const status = this.getCurrentSession();
    return status.currentSession === 'Asian';
  }

  public getScanInterval(): number {
    const status = this.getCurrentSession();
    
    // During killzones: scan every 1-5 minutes
    if (this.isInKillzone()) {
      return Math.floor(Math.random() * 4 + 1) * 60 * 1000; // 1-5 minutes in ms
    }
    
    // During Asian session: monitor every 5-15 minutes
    if (status.currentSession === 'Asian') {
      return Math.floor(Math.random() * 10 + 5) * 60 * 1000; // 5-15 minutes in ms
    }
    
    // Default: 15 minutes
    return 15 * 60 * 1000;
  }

  public formatSessionTime(session: TradingSession): string {
    return `${session.start} - ${session.end} ${session.timezone}`;
  }

  public getAllSessions(): TradingSession[] {
    return [...this.sessions];
  }
}

export const masterClock = MasterClock.getInstance();