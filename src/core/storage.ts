export interface UserSession {
    email: string;
    childName: string;
    childGender: string;
}

export interface HealthData {
    appointments: any[];
    medications: any[];
    allergies: any[];
    growth: any[];
    symptoms: any[];
    vaccinations: any[];
    teething: any[];
    temperature: any[];
}

const DEFAULT_HEALTH: HealthData = {
    appointments: [], medications: [], allergies: [], growth: [], symptoms: [],
    vaccinations: [], teething: [], temperature: []
};

export const Storage = {
    save<T>(key: string, data: T): void {
        try { localStorage.setItem(key, JSON.stringify(data)); } catch(err) { console.error(err); }
    },
    load<T>(key: string): T | null {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch { return null; }
    },
    setSession(user: UserSession): void { this.save('baby_monitor_session', user); },
    getSession(): UserSession | null { return this.load('baby_monitor_session'); },
    clearSession(): void { localStorage.removeItem('baby_monitor_session'); },
    getLogs<T>(category: string): T[] {
        const session = this.getSession();
        if (!session) return [];
        return this.load<T[]>(`${category}_${session.email}`) || [];
    },
    addLog<T>(category: string, entry: T): void {
        const session = this.getSession();
        if (!session) return;
        const logs = this.getLogs<T>(category);
        logs.push(entry);
        this.save(`${category}_${session.email}`, logs);
    },
    getHealth(): HealthData {
        const session = this.getSession();
        if (!session) return { ...DEFAULT_HEALTH };
        return this.load<HealthData>(`health_data_${session.email}`) || { ...DEFAULT_HEALTH };
    },
    saveHealth(data: HealthData): void {
        const session = this.getSession();
        if (!session) return;
        this.save(`health_data_${session.email}`, data);
    }
};