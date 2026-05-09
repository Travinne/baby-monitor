import { Storage } from '../core/storage.js';

export const Tracker = {
    init() {
        const page = document.body.dataset.page;
        if (page === 'sleep') this.initSleep();
        else if (page === 'feeding') this.initFeeding();
        else if (page === 'diaper') this.initDiaper();
    },

    initSleep() {
        const form = document.getElementById('tracker-form');
        const listEl = document.getElementById('logs-list');

        const render = () => {
            const logs = Storage.getLogs('sleep_logs');
            if (!listEl) return;
            if (logs.length === 0) {
                listEl.innerHTML = '<li class="empty-state">No sleep records yet.</li>';
                return;
            }
            listEl.innerHTML = logs.map(log => `
                <li class="data-item">😴 ${new Date(log.start).toLocaleString()} → ${new Date(log.end).toLocaleString()}<br>${log.notes || '—'}</li>
            `).join('');
        };

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const start = document.getElementById('start-time').value;
                const end = document.getElementById('end-time').value;
                const notes = document.getElementById('notes').value;
                if (!start || !end) return;
                Storage.addLog('sleep_logs', { start, end, notes });
                render();
                form.reset();
            });
        }

        render();
    },

    initFeeding() {
        const form = document.getElementById('tracker-form');
        const listEl = document.getElementById('logs-list');

        const render = () => {
            const logs = Storage.getLogs('feeding_logs');
            if (!listEl) return;
            if (logs.length === 0) {
                listEl.innerHTML = '<li class="empty-state">No feeding entries.</li>';
                return;
            }
            listEl.innerHTML = logs.map(log => `
                <li class="data-item">🍼 ${log.type} — ${log.amount || '—'} at ${new Date(log.time).toLocaleString()}<br>${log.notes || ''}</li>
            `).join('');
        };

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const type = document.getElementById('feeding-type').value;
                const amount = document.getElementById('amount').value;
                const time = document.getElementById('feeding-time').value;
                const notes = document.getElementById('feeding-notes').value;
                if (!time) return;
                Storage.addLog('feeding_logs', { type, amount, time, notes });
                render();
                form.reset();
            });
        }

        render();
    },

    initDiaper() {
        const form = document.getElementById('tracker-form');
        const listEl = document.getElementById('logs-list');

        const render = () => {
            const logs = Storage.getLogs('diaper_logs');
            if (!listEl) return;
            if (logs.length === 0) {
                listEl.innerHTML = '<li class="empty-state">No diaper changes logged.</li>';
                return;
            }
            listEl.innerHTML = logs.map(log => `
                <li class="data-item">🧷 ${log.type} change at ${new Date(log.time).toLocaleString()}<br>${log.notes || ''}</li>
            `).join('');
        };

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const type = document.getElementById('diaper-type').value;
                const time = document.getElementById('change-time').value;
                const notes = document.getElementById('diaper-notes').value;
                if (!time) return;
                Storage.addLog('diaper_logs', { type, time, notes });
                render();
                form.reset();
            });
        }

        render();
    }
};