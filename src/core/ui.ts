import { Storage } from './storage';

export const UI = {
    renderNavbar(): void {
        const nav = document.getElementById('navbar');
        if (!nav) return;
        const session = Storage.getSession();
        nav.innerHTML = `
            <nav class="navbar">
                <div class="nav-logo">👶 BabyTrack</div>
                <ul class="nav-links">
                    <li><a href="/public/pages/dashboard/home.html">Home</a></li>
                    <li><a href="/public/pages/dashboard/timetable.html">Timetable</a></li>
                    <li><a href="/public/pages/dashboard/journal.html">Journal</a></li>
                    <li><a href="/public/pages/dashboard/settings.html">Settings</a></li>
                </ul>
                <div class="nav-user">
                    ${session ? `<span>${session.childName}</span>` : ''}
                    <button id="logout-btn" class="btn-text">Logout</button>
                </div>
            </nav>
        `;
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                Storage.clearSession();
                window.location.href = '/public/pages/auth/login.html';
            });
        }
    }
};

import { Storage } from './storage';

export const Sidebar = {
    renderSidebar(): void {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;
        sidebar.innerHTML = `
            <div class="sidebar">
                <h3>📋 Tracking</h3>
                <ul>
                    <li><a href="/public/pages/tracking/sleep.html">😴 Sleep</a></li>
                    <li><a href="/public/pages/tracking/feeding.html">🍼 Feeding</a></li>
                    <li><a href="/public/pages/tracking/diaper.html">🧷 Diaper</a></li>
                    <li class="dropdown">
                        <a href="#" class="dropdown-toggle">🩺 Health ▼</a>
                        <ul class="dropdown-menu">
                            <li><a href="/public/pages/tracking/health/overview.html">Overview</a></li>
                            <li><a href="/public/pages/tracking/health/appointments.html">Appointments</a></li>
                            <li><a href="/public/pages/tracking/health/medications.html">Medications & Vaccines</a></li>
                            <li><a href="/public/pages/tracking/health/allergies.html">Allergies</a></li>
                            <li><a href="/public/pages/tracking/health/teething.html">Teething</a></li>
                        </ul>
                    </li>
                </ul>
            </div>
        `;
        // Dropdown toggle
        const toggle = sidebar.querySelector('.dropdown-toggle');
        if (toggle) {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const menu = toggle.parentElement?.querySelector('.dropdown-menu');
                if (menu) menu.classList.toggle('show');
            });
        }
    }
};