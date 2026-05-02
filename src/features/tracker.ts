import { Storage } from '../core/storage';

interface SleepLog { start: string; end: string; notes: string; }
interface FeedingLog { type: string; amount: string; time: string; notes: string; }
interface DiaperLog { type: string; time: string; notes: string; }

export const Tracker = {
    init(): void {
        const page = document.body.dataset.page;
        if (page === 'sleep') this.initSleep();
        else if (page === 'feeding') this.initFeeding();
        else if (page === 'diaper') this.initDiaper();
    },

    initSleep(): void {
        const form = document.getElementById('tracker-form') as HTMLFormElement;
        const listEl = document.getElementById('logs-list');
        const render = () => {
            const logs = Storage.getLogs<SleepLog>('sleep_logs');
            if (!listEl) return;
            listEl.innerHTML = logs.map(log => `
                <li class="data-item">😴 ${new Date(log.start).toLocaleString()} → ${new Date(log.end).toLocaleString()} <br> ${log.notes || '—'}</li>
            `).join('') || '<li class="empty-state">No sleep records yet.</li>';
        };
        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            const start = (document.getElementById('start-time') as HTMLInputElement).value;
            const end = (document.getElementById('end-time') as HTMLInputElement).value;
            const notes = (document.getElementById('notes') as HTMLTextAreaElement).value;
            if (!start || !end) return;
            Storage.addLog('sleep_logs', { start, end, notes });
            render();
            form.reset();
        });
        render();
    },

    initFeeding(): void {
        const form = document.getElementById('tracker-form') as HTMLFormElement;
        const listEl = document.getElementById('logs-list');
        const render = () => {
            const logs = Storage.getLogs<FeedingLog>('feeding_logs');
            if (!listEl) return;
            listEl.innerHTML = logs.map(log => `
                <li class="data-item">🍼 ${log.type} — ${log.amount} at ${new Date(log.time).toLocaleString()} <br> ${log.notes || ''}</li>
            `).join('') || '<li class="empty-state">No feeding entries.</li>';
        };
        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            const type = (document.getElementById('feeding-type') as HTMLSelectElement).value;
            const amount = (document.getElementById('amount') as HTMLInputElement).value;
            const time = (document.getElementById('feeding-time') as HTMLInputElement).value;
            const notes = (document.getElementById('feeding-notes') as HTMLTextAreaElement).value;
            if (!time) return;
            Storage.addLog('feeding_logs', { type, amount, time, notes });
            render();
            form.reset();
        });
        render();
    },

    initDiaper(): void {
        const form = document.getElementById('tracker-form') as HTMLFormElement;
        const listEl = document.getElementById('logs-list');
        const render = () => {
            const logs = Storage.getLogs<DiaperLog>('diaper_logs');
            if (!listEl) return;
            listEl.innerHTML = logs.map(log => `
                <li class="data-item">🧷 ${log.type} change at ${new Date(log.time).toLocaleString()} <br> ${log.notes || ''}</li>
            `).join('') || '<li class="empty-state">No diaper changes logged.</li>';
        };
        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            const type = (document.getElementById('diaper-type') as HTMLSelectElement).value;
            const time = (document.getElementById('change-time') as HTMLInputElement).value;
            const notes = (document.getElementById('diaper-notes') as HTMLTextAreaElement).value;
            if (!time) return;
            Storage.addLog('diaper_logs', { type, time, notes });
            render();
            form.reset();
        });
        render();
    }
};