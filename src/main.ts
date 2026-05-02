import { Auth } from './core/auth';
import { UI } from './core/ui';
import { Tracker } from './features/tracker';
import { Health } from './features/health';

document.addEventListener('DOMContentLoaded', () => {
    UI.renderNavbar();
    Auth.checkAuth();

    const page = document.body.dataset.page;
    if (!page) return;

    switch (page) {
        case 'login':
        case 'register':
            Auth.init();
            break;
        case 'home':
            initDashboard();
            break;
        case 'sleep':
        case 'feeding':
        case 'diaper':
            Tracker.init();
            break;
        default:
            if (page.startsWith('health-')) {
                Health.init();
            }
            break;
    }
});

function initDashboard(): void {
    const welcomeTitle = document.querySelector('.page-header h1');
    const session = localStorage.getItem('baby_monitor_session');
    if (welcomeTitle && session) {
        try {
            const parsed = JSON.parse(session);
            if (parsed.childName) welcomeTitle.textContent = `Welcome back, ${parsed.childName}!`;
        } catch (e) {}
    }
}