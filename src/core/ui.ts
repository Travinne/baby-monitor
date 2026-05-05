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
                    <li><a href="/pages/dashboard/home.html">Home</a></li>
                    <li><a href="/pages/dashboard/timetable.html">Timetable</a></li>
                    <li><a href="/pages/dashboard/journal.html">Journal</a></li>
                    <li><a href="/pages/dashboard/settings.html">Settings</a></li>
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
                window.location.href = '/pages/auth/login.html';
            });
        }
    }
};