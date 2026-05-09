import { Auth } from './core/auth.js';
import { UI } from './core/ui.js';
import { Sidebar } from './core/sidebar.js';
import { Tracker } from './features/tracker.js';
import { Health } from './features/health.js';
import { addGoBack, addFooter, initJournal, initSettings, initDashboard, initTimetable } from './utils/helpers.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 BabyTrack application starting...');
    
    UI.renderNavbar();
    Sidebar.renderSidebar();
    Auth.checkAuth();
    
    addGoBack();
    addFooter();
    
    const page = document.body.dataset.page;
    console.log('📄 Current page:', page);
    
    if (!page) return;
    
    switch (page) {
        case 'login':
        case 'register':
            console.log('🔐 Initializing auth for page:', page);
            Auth.init();
            break;
        case 'home':
            console.log('🏠 Initializing dashboard');
            initDashboard();
            break;
        case 'journal':
            console.log('📓 Initializing journal');
            initJournal();
            break;
        case 'settings':
            console.log('⚙️ Initializing settings');
            initSettings();
            break;
        case 'timetable':
            console.log('📅 Initializing timetable');
            initTimetable();
            break;
        case 'sleep':
        case 'feeding':
        case 'diaper':
            console.log(`📊 Initializing ${page} tracker`);
            Tracker.init();
            break;
        default:
            if (page && page.startsWith('health-')) {
                console.log('🩺 Initializing health page:', page);
                Health.init();
            }
            break;
    }
});

if (import.meta.hot) {
    import.meta.hot.accept();
}