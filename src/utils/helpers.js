import { Storage } from '../core/storage.js';

export function addGoBack() {
    const backBtn = document.createElement('button');
    backBtn.textContent = '← Back';
    backBtn.className = 'btn-outline go-back';
    backBtn.style.margin = '1rem';
    backBtn.onclick = () => window.history.back();
    const container = document.querySelector('.container');
    if (container && !document.querySelector('.go-back')) {
        container.insertBefore(backBtn, container.firstChild);
    }
}

export function addFooter() {
    if (document.querySelector('.app-footer')) return;
    const footer = document.createElement('footer');
    footer.className = 'app-footer';
    footer.innerHTML = `<p>BabyTrack - Keeping your little one safe ❤️</p>`;
    document.body.appendChild(footer);
}

export function initJournal() {
    const form = document.getElementById('journal-form');
    const listEl = document.getElementById('journal-list');
    
    const render = () => {
        const entries = Storage.getJournalEntries();
        if (!listEl) return;
        if (entries.length === 0) {
            listEl.innerHTML = '<li class="empty-state">No journal entries yet.</li>';
            return;
        }
        listEl.innerHTML = entries.map(entry => `
            <li class="data-item">
                <strong>${entry.date}</strong>
                <p>${entry.content}</p>
                <button class="delete-entry btn-danger" data-id="${entry.id}">Delete</button>
            </li>
        `).join('');
        
        document.querySelectorAll('.delete-entry').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.dataset.id);
                if (confirm('Delete this entry?')) {
                    Storage.deleteJournalEntry(id);
                    render();
                }
            });
        });
    };
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const date = document.getElementById('journal-date').value;
            const content = document.getElementById('journal-content').value;
            if (!date || !content) return;
            Storage.addJournalEntry({
                id: Date.now(),
                date,
                content
            });
            render();
            form.reset();
        });
    }
    
    render();
}

export function initSettings() {
    const session = Storage.getSession();
    if (session) {
        const childNameInput = document.getElementById('settings-child-name');
        const emailInput = document.getElementById('settings-email');
        if (childNameInput) childNameInput.value = session.childName;
        if (emailInput) emailInput.value = session.email;
    }
    
    const exportBtn = document.getElementById('export-data-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const data = Storage.exportData();
            if (data) {
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `babytrack_export_${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
            }
        });
    }
    
    const clearBtn = document.getElementById('clear-data-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('⚠️ This will delete ALL your data! Are you sure?')) {
                Storage.clearAllData();
                alert('All data cleared. You will be logged out.');
                // Updated path
                window.location.href = '/public/pages/auth/login.html';
            }
        });
    }
}

export function initDashboard() {
    const statsContainer = document.querySelector('.dashboard-stats');
    if (!statsContainer) return;
    
    const session = Storage.getSession();
    if (session) {
        statsContainer.innerHTML = `
            <div class="welcome-card">
                <h2>Hello, ${session.childName}! 👶</h2>
                <p>Track sleep, feeding, health, and more - all in one place.</p>
            </div>
        `;
    }
    
    const today = new Date().toLocaleDateString();
    const sleepLogs = Storage.getLogs('sleep_logs');
    const todaySleep = sleepLogs.filter(log => new Date(log.start).toLocaleDateString() === today);
    const totalSleepMinutes = todaySleep.reduce((sum, log) => {
        const start = new Date(log.start);
        const end = new Date(log.end);
        return sum + (end - start) / (1000 * 60);
    }, 0);
    
    if (totalSleepMinutes > 0) {
        const hours = Math.floor(totalSleepMinutes / 60);
        const minutes = Math.floor(totalSleepMinutes % 60);
        statsContainer.innerHTML += `
            <div class="stat-card">
                <h3>Today's Sleep</h3>
                <p>${hours}h ${minutes}m</p>
            </div>
        `;
    }
}

export function initTimetable() {
    let currentDate = new Date();
    let selectedDate = new Date();
    
    const calendarDays = document.getElementById('calendar-days');
    const currentMonthYear = document.getElementById('current-month-year');
    const selectedDateLabel = document.getElementById('selected-date-label');
    const dailyTimeline = document.getElementById('daily-timeline');
    
    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const startDay = firstDay.getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        currentMonthYear.textContent = `${firstDay.toLocaleString('default', { month: 'long' })} ${year}`;
        
        let calendarHTML = '';
        for (let i = 0; i < startDay; i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
            const isSelected = selectedDate.toDateString() === new Date(year, month, day).toDateString();
            calendarHTML += `
                <div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${dateStr}">
                    ${day}
                </div>
            `;
        }
        
        calendarDays.innerHTML = calendarHTML;
        
        document.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
            day.addEventListener('click', () => {
                const dateStr = day.dataset.date;
                selectedDate = new Date(dateStr);
                renderCalendar();
                renderTimeline();
            });
        });
    };
    
    const renderTimeline = () => {
        if (!selectedDateLabel || !dailyTimeline) return;
        
        const dateStr = selectedDate.toLocaleDateString();
        selectedDateLabel.textContent = dateStr;
        
        const sleepLogs = Storage.getLogs('sleep_logs')
            .filter(log => new Date(log.start).toLocaleDateString() === dateStr);
        const feedingLogs = Storage.getLogs('feeding_logs')
            .filter(log => new Date(log.time).toLocaleDateString() === dateStr);
        const diaperLogs = Storage.getLogs('diaper_logs')
            .filter(log => new Date(log.time).toLocaleDateString() === dateStr);
        const reminders = Storage.getReminders()
            .filter(rem => new Date(rem.datetime).toLocaleDateString() === dateStr);
        
        let timelineHTML = '';
        
        if (sleepLogs.length > 0) {
            timelineHTML += '<div class="timeline-section"><h4>😴 Sleep</h4>';
            sleepLogs.forEach(log => {
                timelineHTML += `<div class="timeline-item">${new Date(log.start).toLocaleTimeString()} → ${new Date(log.end).toLocaleTimeString()}<br><small>${log.notes || ''}</small></div>`;
            });
            timelineHTML += '</div>';
        }
        
        if (feedingLogs.length > 0) {
            timelineHTML += '<div class="timeline-section"><h4>🍼 Feeding</h4>';
            feedingLogs.forEach(log => {
                timelineHTML += `<div class="timeline-item">${new Date(log.time).toLocaleTimeString()} - ${log.type} ${log.amount ? `(${log.amount})` : ''}<br><small>${log.notes || ''}</small></div>`;
            });
            timelineHTML += '</div>';
        }
        
        if (diaperLogs.length > 0) {
            timelineHTML += '<div class="timeline-section"><h4>🧷 Diaper</h4>';
            diaperLogs.forEach(log => {
                timelineHTML += `<div class="timeline-item">${new Date(log.time).toLocaleTimeString()} - ${log.type}<br><small>${log.notes || ''}</small></div>`;
            });
            timelineHTML += '</div>';
        }
        
        if (reminders.length > 0) {
            timelineHTML += '<div class="timeline-section"><h4>⏰ Reminders</h4>';
            reminders.forEach(rem => {
                timelineHTML += `<div class="timeline-item"><strong>${rem.title}</strong> at ${new Date(rem.datetime).toLocaleTimeString()}<br><small>${rem.notes || ''}</small></div>`;
            });
            timelineHTML += '</div>';
        }
        
        if (timelineHTML === '') {
            timelineHTML = '<div class="empty-state">No events on this day.</div>';
        }
        
        dailyTimeline.innerHTML = timelineHTML;
    };
    
    const reminderForm = document.getElementById('reminder-form');
    if (reminderForm) {
        reminderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('reminder-title').value;
            const datetime = document.getElementById('reminder-datetime').value;
            const notes = document.getElementById('reminder-notes').value;
            if (!title || !datetime) return;
            Storage.addReminder({
                id: Date.now(),
                title,
                datetime,
                notes
            });
            alert('Reminder added!');
            reminderForm.reset();
            renderTimeline();
        });
    }
    
    document.getElementById('prev-month')?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('next-month')?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    document.getElementById('today-btn')?.addEventListener('click', () => {
        currentDate = new Date();
        selectedDate = new Date();
        renderCalendar();
        renderTimeline();
    });
    
    document.getElementById('year-down')?.addEventListener('click', () => {
        currentDate.setFullYear(currentDate.getFullYear() - 1);
        renderCalendar();
    });
    
    document.getElementById('year-up')?.addEventListener('click', () => {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        renderCalendar();
    });
    
    renderCalendar();
    renderTimeline();
}