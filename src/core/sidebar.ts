export const Sidebar = {
    renderSidebar(): void {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;
        sidebar.innerHTML = `
            <div class="sidebar">
                <h3>📋 Tracking</h3>
                <ul>
                    <li><a href="/pages/tracking/sleep.html">😴 Sleep</a></li>
                    <li><a href="/pages/tracking/feeding.html">🍼 Feeding</a></li>
                    <li><a href="/pages/tracking/diaper.html">🧷 Diaper</a></li>
                    <li class="dropdown">
                        <a href="#" class="dropdown-toggle">🩺 Health ▼</a>
                        <ul class="dropdown-menu">
                            <li><a href="/pages/tracking/health/overview.html">Overview</a></li>
                            <li><a href="/pages/tracking/health/appointments.html">Appointments</a></li>
                            <li><a href="/pages/tracking/health/medications.html">Medications & Vaccines</a></li>
                            <li><a href="/pages/tracking/health/allergies.html">Allergies</a></li>
                            <li><a href="/pages/tracking/health/teething.html">Teething</a></li>
                        </ul>
                    </li>
                </ul>
            </div>
        `;
        
        const toggle = sidebar.querySelector('.dropdown-toggle');
        if (toggle) {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const menu = toggle.parentElement?.querySelector('.dropdown-menu');
                if (menu) {
                    menu.classList.toggle('show');
                    const isExpanded = menu.classList.contains('show');
                    toggle.setAttribute('aria-expanded', String(isExpanded));
                }
            });
        }
        
        document.addEventListener('click', function(e) {
            const dropdown = document.querySelector('.dropdown');
            if (dropdown && !dropdown.contains(e.target as Node)) {
                const menu = dropdown.querySelector('.dropdown-menu');
                if (menu) menu.classList.remove('show');
            }
        });
    }
};