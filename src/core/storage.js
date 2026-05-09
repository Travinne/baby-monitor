const DEFAULT_HEALTH = {
    appointments: [],
    medications: [],
    allergies: [],
    growth: [],
    symptoms: [],
    vaccinations: [],
    teething: [],
    temperature: []
};

export const Storage = {
    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (err) {
            console.error(`Failed to save ${key}:`, err);
            return false;
        }
    },

    load(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    },

    setSession(user) {
        this.save('baby_monitor_session', user);
    },

    getSession() {
        return this.load('baby_monitor_session');
    },

    clearSession() {
        localStorage.removeItem('baby_monitor_session');
    },

    getLogs(category) {
        const session = this.getSession();
        if (!session) return [];
        return this.load(`${category}_${session.email}`) || [];
    },

    addLog(category, entry) {
        const session = this.getSession();
        if (!session) return;
        const logs = this.getLogs(category);
        logs.push(entry);
        this.save(`${category}_${session.email}`, logs);
    },

    getHealth() {
        const session = this.getSession();
        if (!session) return { ...DEFAULT_HEALTH };
        return this.load(`health_data_${session.email}`) || { ...DEFAULT_HEALTH };
    },

    saveHealth(data) {
        const session = this.getSession();
        if (!session) return;
        this.save(`health_data_${session.email}`, data);
    },

    getJournalEntries() {
        const session = this.getSession();
        if (!session) return [];
        return this.load(`journal_${session.email}`) || [];
    },

    addJournalEntry(entry) {
        const session = this.getSession();
        if (!session) return;
        const entries = this.getJournalEntries();
        entries.push(entry);
        this.save(`journal_${session.email}`, entries);
    },

    deleteJournalEntry(id) {
        const session = this.getSession();
        if (!session) return;
        const entries = this.getJournalEntries();
        const filtered = entries.filter(e => e.id !== id);
        this.save(`journal_${session.email}`, filtered);
    },

    getReminders() {
        const session = this.getSession();
        if (!session) return [];
        return this.load(`reminders_${session.email}`) || [];
    },

    addReminder(reminder) {
        const session = this.getSession();
        if (!session) return;
        const reminders = this.getReminders();
        reminders.push(reminder);
        this.save(`reminders_${session.email}`, reminders);
    },

    deleteReminder(id) {
        const session = this.getSession();
        if (!session) return;
        const reminders = this.getReminders();
        const filtered = reminders.filter(r => r.id !== id);
        this.save(`reminders_${session.email}`, filtered);
    },

    clearAllData() {
        const session = this.getSession();
        if (!session) return;
        const email = session.email;
        const keysToRemove = Object.keys(localStorage).filter(key => 
            key.includes(email) || key === 'baby_monitor_session'
        );
        keysToRemove.forEach(key => localStorage.removeItem(key));
    },

    exportData() {
        const session = this.getSession();
        if (!session) return null;
        const allData = {};
        const email = session.email;
        Object.keys(localStorage).forEach(key => {
            if (key.includes(email) || key === 'registered_users') {
                allData[key] = this.load(key);
            }
        });
        return JSON.stringify(allData, null, 2);
    },

    debug() {
        console.group('Storage Debug');
        console.log('Session:', this.getSession());
        console.log('All localStorage keys:', Object.keys(localStorage));
        console.groupEnd();
    }
};