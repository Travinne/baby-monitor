export const Sidebar = {
    renderSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        const currentPath = window.location.pathname;

        sidebar.innerHTML = `
            <div class="sidebar">
                <h3>📋 Tracking</h3>
                <ul>
                    <li><a href="/public/pages/tracking/sleep.html" class="${currentPath.includes('sleep.html') ? 'active' : ''}">
                        <span class="menu-icon">😴</span> Sleep
                    </a></li>
                    <li><a href="/public/pages/tracking/feeding.html" class="${currentPath.includes('feeding.html') ? 'active' : ''}">
                        <span class="menu-icon">🍼</span> Feeding
                    </a></li>
                    <li><a href="/public/pages/tracking/diaper.html" class="${currentPath.includes('diaper.html') ? 'active' : ''}">
                        <span class="menu-icon">🧷</span> Diaper
                    </a></li>
                    <li class="dropdown">
                        <a href="javascript:void(0)" class="dropdown-toggle">
                            <span class="menu-icon">🩺</span> Health
                            <span class="dropdown-arrow">▼</span>
                        </a>
                        <ul class="dropdown-menu">
                            <li><a href="/public/pages/tracking/health/overview.html" class="${currentPath.includes('overview.html') ? 'active' : ''}">
                                <span class="menu-icon">📊</span> Overview
                            </a></li>
                            <li><a href="/public/pages/tracking/health/appointments.html" class="${currentPath.includes('appointments.html') ? 'active' : ''}">
                                <span class="menu-icon">📅</span> Appointments
                            </a></li>
                            <li><a href="/public/pages/tracking/health/medications.html" class="${currentPath.includes('medications.html') ? 'active' : ''}">
                                <span class="menu-icon">💊</span> Medications
                            </a></li>
                            <li><a href="/public/pages/tracking/health/allergies.html" class="${currentPath.includes('allergies.html') ? 'active' : ''}">
                                <span class="menu-icon">⚠️</span> Allergies
                            </a></li>
                            <li><a href="/public/pages/tracking/health/teething.html" class="${currentPath.includes('teething.html') ? 'active' : ''}">
                                <span class="menu-icon">🦷</span> Teething
                            </a></li>
                        </ul>
                    </li>
                </ul>
            </div>
        `;

        this.initDropdown();
    },

    initDropdown() {
        const dropdown = document.querySelector('.sidebar .dropdown');
        const toggle = dropdown?.querySelector('.dropdown-toggle');
        const menu = dropdown?.querySelector('.dropdown-menu');
        
        if (!dropdown || !toggle || !menu) return;

        let hoverTimeout;
        let isHovering = false;

        // Function to open dropdown
        const openDropdown = () => {
            clearTimeout(hoverTimeout);
            menu.classList.add('show');
            toggle.classList.add('expanded');
            const arrow = toggle.querySelector('.dropdown-arrow');
            if (arrow) arrow.innerHTML = '▲';
        };

    
        const closeDropdown = () => {
            hoverTimeout = setTimeout(() => {
                if (!isHovering) {
                    menu.classList.remove('show');
                    toggle.classList.remove('expanded');
                    const arrow = toggle.querySelector('.dropdown-arrow');
                    if (arrow) arrow.innerHTML = '▼';
                }
            }, 200);
        };


        dropdown.addEventListener('mouseenter', () => {
            isHovering = true;
            openDropdown();
        });

        dropdown.addEventListener('mouseleave', () => {
            isHovering = false;
            closeDropdown();
        });

        menu.addEventListener('mouseenter', () => {
            isHovering = true;
            clearTimeout(hoverTimeout);
        });

        menu.addEventListener('mouseleave', () => {
            isHovering = false;
            closeDropdown();
        });

        
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (window.innerWidth <= 768) {
                if (menu.classList.contains('show')) {
                    menu.classList.remove('show');
                    toggle.classList.remove('expanded');
                    const arrow = toggle.querySelector('.dropdown-arrow');
                    if (arrow) arrow.innerHTML = '▼';
                } else {
                
                    document.querySelectorAll('.sidebar .dropdown-menu.show').forEach(otherMenu => {
                        if (otherMenu !== menu) {
                            otherMenu.classList.remove('show');
                            const otherToggle = otherMenu.closest('.dropdown')?.querySelector('.dropdown-toggle');
                            if (otherToggle) otherToggle.classList.remove('expanded');
                        }
                    });
                    menu.classList.add('show');
                    toggle.classList.add('expanded');
                    const arrow = toggle.querySelector('.dropdown-arrow');
                    if (arrow) arrow.innerHTML = '▲';
                }
            }
        });

        
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && !dropdown.contains(e.target)) {
                menu.classList.remove('show');
                toggle.classList.remove('expanded');
                const arrow = toggle.querySelector('.dropdown-arrow');
                if (arrow) arrow.innerHTML = '▼';
            }
        });
    }
};