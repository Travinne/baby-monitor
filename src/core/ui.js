import { Storage } from './storage.js';

export const UI = {
    renderNavbar() {
        const nav = document.getElementById('navbar');
        if (!nav) return;

        const session = Storage.getSession();
        const currentPath = window.location.pathname;

        nav.innerHTML = `
            <nav class="navbar">
                <button class="menu-toggle" id="menuToggle" aria-label="Menu">☰</button>
                <div class="nav-logo">👶 BabyTrack</div>
                <ul class="nav-links" id="navLinks">
                    <li><a href="/public/pages/dashboard/home.html" class="${currentPath.includes('home.html') ? 'active' : ''}">🏠 Home</a></li>
                    <li><a href="/public/pages/dashboard/timetable.html" class="${currentPath.includes('timetable.html') ? 'active' : ''}">📅 Timetable</a></li>
                    <li><a href="/public/pages/dashboard/journal.html" class="${currentPath.includes('journal.html') ? 'active' : ''}">📓 Journal</a></li>
                    <li><a href="/public/pages/dashboard/settings.html" class="${currentPath.includes('settings.html') ? 'active' : ''}">⚙️ Settings</a></li>
                </ul>
                <div class="nav-user">
                    ${session ? `<span>👋 ${session.childName}</span>` : ''}
                    <button id="logout-btn" class="btn-text">🚪 Logout</button>
                </div>
            </nav>
        `;

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                Storage.clearSession();
                // Updated path
                window.location.href = '/public/pages/auth/login.html';
            });
        }

        const menuToggle = document.getElementById('menuToggle');
        const navLinks = document.getElementById('navLinks');

        if (menuToggle && navLinks) {
            menuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                navLinks.classList.toggle('show');
                const isExpanded = navLinks.classList.contains('show');
                menuToggle.setAttribute('aria-expanded', String(isExpanded));
                menuToggle.textContent = isExpanded ? '✕' : '☰';
            });

            document.addEventListener('click', (e) => {
                if (navLinks.classList.contains('show') && !nav.contains(e.target)) {
                    navLinks.classList.remove('show');
                    menuToggle.textContent = '☰';
                    menuToggle.setAttribute('aria-expanded', 'false');
                }
            });

            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('show');
                    menuToggle.textContent = '☰';
                    menuToggle.setAttribute('aria-expanded', 'false');
                });
            });
        }
    }
};