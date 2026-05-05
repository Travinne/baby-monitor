(function() {
    const Storage = {
        save(key, data) { try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {} },
        load(key) { try { return JSON.parse(localStorage.getItem(key)); } catch(e) { return null; } },
        setSession(user) { this.save('baby_monitor_session', user); },
        getSession() { return this.load('baby_monitor_session'); },
        clearSession() { localStorage.removeItem('baby_monitor_session'); },
        getLogs(cat) { const s = this.getSession(); if(!s) return []; return this.load(`${cat}_${s.email}`) || []; },
        addLog(cat, entry) { const s = this.getSession(); if(!s) return; const logs = this.getLogs(cat); logs.push(entry); this.save(`${cat}_${s.email}`, logs); },
        getHealth() { const s = this.getSession(); if(!s) return { appointments:[], medications:[], allergies:[], growth:[], symptoms:[], vaccinations:[], teething:[], temperature:[] }; return this.load(`health_data_${s.email}`) || { appointments:[], medications:[], allergies:[], growth:[], symptoms:[], vaccinations:[], teething:[], temperature:[] }; },
        saveHealth(data) { const s = this.getSession(); if(!s) return; this.save(`health_data_${s.email}`, data); }
    };

    window.Storage = Storage;

    const Auth = {
        init() {
            const login = document.getElementById('login-form');
            const register = document.getElementById('register-form');
            if(login) login.onsubmit = (e) => { e.preventDefault(); this.handleLogin(); };
            if(register) register.onsubmit = (e) => { e.preventDefault(); this.handleRegister(); };
        },
        handleLogin() {
            const email = document.getElementById('email').value;
            const pwd = document.getElementById('password').value;
            const users = Storage.load('registered_users') || [];
            const user = users.find(u => u.email === email && u.password === pwd);
            if(user) {
                Storage.setSession({ email: user.email, childName: user.childName, childGender: user.childGender });
                window.location.href = '/pages/dashboard/home.html';
            } else alert('Invalid credentials');
        },
        handleRegister() {
            const email = document.getElementById('email').value;
            const pwd = document.getElementById('password').value;
            const name = document.getElementById('child-name').value;
            const gender = document.getElementById('child-gender').value;
            const users = Storage.load('registered_users') || [];
            if(users.some(u => u.email === email)) { alert('Email exists'); return; }
            users.push({ email, password: pwd, childName: name, childGender: gender });
            Storage.save('registered_users', users);
            alert('Registered! Please login.');
            window.location.href = '/pages/auth/login.html';
        },
        checkAuth() {
            const session = Storage.getSession();
            const path = window.location.pathname;
            const isAuth = path.includes('login.html') || path.includes('register.html');
            if(!session && !isAuth) window.location.href = '/pages/auth/login.html';
        }
    };
    window.Auth = Auth;

    const UI = {
        renderNavbar() {
            const nav = document.getElementById('navbar');
            if(!nav) return;
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
            const logout = document.getElementById('logout-btn');
            if(logout) logout.onclick = () => { Storage.clearSession(); window.location.href = '/pages/auth/login.html'; };
        }
    };
    window.UI = UI;

    function addGoBack() {
        const main = document.querySelector('main');
        if(!main || main.querySelector('.go-back')) return;
        const btn = document.createElement('button');
        btn.textContent = '← Go Back';
        btn.className = 'go-back';
        btn.style.margin = '0.5rem 0';
        btn.onclick = () => window.history.back();
        main.prepend(btn);
    }
    function addFooter() {
        if(document.getElementById('global-footer')) return;
        const footer = document.createElement('footer');
        footer.id = 'global-footer';
        footer.innerHTML = '<p>© BabyTrack – caring for your little one</p>';
        footer.style.textAlign = 'center';
        footer.style.marginTop = '2rem';
        footer.style.padding = '1rem';
        footer.style.color = '#64748b';
        document.body.appendChild(footer);
    }

    function initTracker(type) {
        const form = document.getElementById('tracker-form');
        const list = document.getElementById('logs-list');
        if(!form || !list) return;
        const render = () => {
            const logs = Storage.getLogs(`${type}_logs`);
            if(type === 'sleep') list.innerHTML = logs.map(l => `<li class="data-item">😴 ${new Date(l.start).toLocaleString()} → ${new Date(l.end).toLocaleString()}<br>${l.notes||'—'}</li>`).join('') || '<li class="empty-state">No records</li>';
            else if(type === 'feeding') list.innerHTML = logs.map(l => `<li class="data-item">🍼 ${l.type} — ${l.amount} at ${new Date(l.time).toLocaleString()}<br>${l.notes||''}</li>`).join('') || '<li class="empty-state">No entries</li>';
            else if(type === 'diaper') list.innerHTML = logs.map(l => `<li class="data-item">🧷 ${l.type} change at ${new Date(l.time).toLocaleString()}<br>${l.notes||''}</li>`).join('') || '<li class="empty-state">No changes</li>';
        };
        form.onsubmit = (e) => {
            e.preventDefault();
            if(type === 'sleep') {
                const start = document.getElementById('start-time').value;
                const end = document.getElementById('end-time').value;
                const notes = document.getElementById('notes').value;
                if(!start || !end) return;
                Storage.addLog('sleep_logs', { start, end, notes });
            } else if(type === 'feeding') {
                const t = document.getElementById('feeding-type').value;
                const amt = document.getElementById('amount').value;
                const tm = document.getElementById('feeding-time').value;
                const n = document.getElementById('feeding-notes').value;
                if(!tm) return;
                Storage.addLog('feeding_logs', { type: t, amount: amt, time: tm, notes: n });
            } else if(type === 'diaper') {
                const t = document.getElementById('diaper-type').value;
                const tm = document.getElementById('change-time').value;
                const n = document.getElementById('diaper-notes').value;
                if(!tm) return;
                Storage.addLog('diaper_logs', { type: t, time: tm, notes: n });
            }
            render();
            form.reset();
        };
        render();
    }

    function initHealthOverview() {
        const health = Storage.getHealth();
        const preview = document.getElementById('next-appointment-preview');
        if(preview) preview.innerText = health.appointments[0] ? `${health.appointments[0].date} with ${health.appointments[0].doctor}` : 'None';
        const medCount = document.getElementById('active-medications-count');
        if(medCount) medCount.innerText = health.medications.length;
        const growthForm = document.getElementById('growth-form');
        if(growthForm) {
            growthForm.onsubmit = (e) => {
                e.preventDefault();
                const h = parseFloat(document.getElementById('growth-height').value);
                const w = parseFloat(document.getElementById('growth-weight').value);
                if(isNaN(h)||isNaN(w)) return;
                const data = Storage.getHealth();
                data.growth.push({ date: new Date().toLocaleDateString(), height: h, weight: w });
                Storage.saveHealth(data);
                alert('Growth saved');
                growthForm.reset();
                renderGrowth();
            };
        }
        function renderGrowth() {
            const list = document.getElementById('growth-list');
            if(!list) return;
            const data = Storage.getHealth();
            list.innerHTML = data.growth.map(g => `<li class="data-item">📏 ${g.height}cm ⚖️ ${g.weight}kg (${g.date})</li>`).join('') || '<li class="empty-state">No growth records</li>';
        }
        renderGrowth();
    }

    function initAppointments() {
        const form = document.getElementById('appointment-form');
        const list = document.getElementById('appointment-list');
        const render = () => {
            const data = Storage.getHealth();
            list.innerHTML = data.appointments.map(a => `<li class="data-item"><strong>${a.doctor}</strong> — ${a.date} at ${a.time}</li>`).join('') || '<li class="empty-state">No appointments</li>';
        };
        if(form) form.onsubmit = (e) => {
            e.preventDefault();
            const health = Storage.getHealth();
            health.appointments.push({
                doctor: document.getElementById('doctor-name').value,
                date: document.getElementById('appointment-date').value,
                time: document.getElementById('appointment-time').value
            });
            Storage.saveHealth(health);
            render();
            form.reset();
        };
        render();
    }

    function initAllergies() {
        const form = document.getElementById('allergy-form');
        const list = document.getElementById('allergy-list');
        const render = () => {
            const data = Storage.getHealth();
            list.innerHTML = data.allergies.map(a => `<li class="data-item"><strong>${a.name}</strong> (${a.severity})<br>${a.reaction}</li>`).join('') || '<li class="empty-state">No allergies</li>';
        };
        if(form) form.onsubmit = (e) => {
            e.preventDefault();
            const health = Storage.getHealth();
            health.allergies.push({
                name: document.getElementById('allergy-name').value,
                severity: document.getElementById('allergy-severity').value,
                reaction: document.getElementById('allergy-reaction').value
            });
            Storage.saveHealth(health);
            render();
            form.reset();
        };
        render();
    }

    function initMedications() {
        const health = Storage.getHealth();
        const tempForm = document.getElementById('temp-form');
        const tempList = document.getElementById('temp-list');
        const medForm = document.getElementById('med-form');
        const medList = document.getElementById('med-list');
        const vaccineForm = document.getElementById('vaccine-form');
        const vaccineList = document.getElementById('vaccine-list');
        const emergency = document.getElementById('emergency-btn');
        if(emergency) emergency.onclick = () => window.location.href = '/pages/tracking/health/appointments.html';

        function renderTemp() {
            const temps = Storage.getHealth().temperature;
            if(tempList) tempList.innerHTML = temps.map(t => `<li class="data-item ${t.value>38?'temp-critical':t.value>37.2?'temp-warning':'temp-normal'}">🌡️ ${new Date(t.datetime).toLocaleString()} — ${t.value}°C (${t.method})<br>${t.notes||''}</li>`).join('') || '<li class="empty-state">No temps</li>';
        }
        function renderMeds() {
            const meds = Storage.getHealth().medications;
            if(medList) medList.innerHTML = meds.map(m => `<li class="data-item"><strong>${m.name}</strong> — ${m.dosage} (${m.frequency})</li>`).join('') || '<li class="empty-state">No medications</li>';
        }
        function renderVaccines() {
            const vaccs = Storage.getHealth().vaccinations;
            if(vaccineList) vaccineList.innerHTML = vaccs.map(v => `<li class="data-item"><strong>${v.name}</strong><br>Due: ${v.dueDate} ${v.administeredDate ? '✅ Administered: '+v.administeredDate : '⏳ Pending'}<br>${v.notes||''}</li>`).join('') || '<li class="empty-state">No vaccines</li>';
        }

        if(tempForm) tempForm.onsubmit = (e) => {
            e.preventDefault();
            const data = Storage.getHealth();
            data.temperature.push({
                id: Date.now(),
                datetime: document.getElementById('temp-datetime').value,
                value: parseFloat(document.getElementById('temp-value').value),
                method: document.getElementById('temp-method').value,
                notes: document.getElementById('temp-notes').value
            });
            Storage.saveHealth(data);
            renderTemp();
            tempForm.reset();
        };
        if(medForm) medForm.onsubmit = (e) => {
            e.preventDefault();
            const data = Storage.getHealth();
            data.medications.push({
                name: document.getElementById('med-name').value,
                dosage: document.getElementById('med-dosage').value,
                frequency: document.getElementById('med-frequency').value
            });
            Storage.saveHealth(data);
            renderMeds();
            medForm.reset();
        };
        if(vaccineForm) vaccineForm.onsubmit = (e) => {
            e.preventDefault();
            const data = Storage.getHealth();
            data.vaccinations.push({
                id: Date.now(),
                name: document.getElementById('vaccine-name').value,
                dueDate: document.getElementById('vaccine-due').value,
                administeredDate: document.getElementById('vaccine-admin').value || null,
                notes: document.getElementById('vaccine-notes').value
            });
            Storage.saveHealth(data);
            renderVaccines();
            vaccineForm.reset();
        };
        renderTemp(); renderMeds(); renderVaccines();
    }

    function initTeething() {
        const dentistInput = document.getElementById('dentist-date');
        const dentistStatus = document.getElementById('dentist-status');
        const session = Storage.getSession();
        const email = session ? session.email : '';
        const getKey = (k) => `${k}_${email}`;
        function updateDentist() {
            const reminder = localStorage.getItem(getKey('dentist_reminder'));
            if(dentistStatus) dentistStatus.innerText = reminder ? `Next dentist: ${new Date(reminder).toLocaleDateString()}` : 'No dentist reminder';
            if(dentistInput && reminder) dentistInput.value = reminder;
        }
        const setDentist = document.getElementById('set-dentist');
        if(setDentist) setDentist.onclick = () => {
            const date = dentistInput.value;
            if(!date) { alert('Select date'); return; }
            localStorage.setItem(getKey('dentist_reminder'), date);
            updateDentist();
            alert('Dentist reminder saved');
        };
        updateDentist();

        const teethingForm = document.getElementById('teething-form');
        const teethingList = document.getElementById('teething-list');
        function renderTeething() {
            const teeth = Storage.getHealth().teething;
            if(teethingList) teethingList.innerHTML = teeth.map(t => `<li class="data-item"><strong>${t.toothName}</strong> — erupted ${new Date(t.eruptionDate).toLocaleDateString()}<br>${t.symptoms||''}</li>`).join('') || '<li class="empty-state">No teeth</li>';
        }
        if(teethingForm) teethingForm.onsubmit = (e) => {
            e.preventDefault();
            const health = Storage.getHealth();
            health.teething.push({
                id: Date.now(),
                toothName: document.getElementById('tooth-name').value,
                eruptionDate: document.getElementById('eruption-date').value,
                symptoms: document.getElementById('symptoms').value
            });
            Storage.saveHealth(health);
            renderTeething();
            teethingForm.reset();
        };
        renderTeething();
    }

    document.addEventListener('DOMContentLoaded', () => {
        UI.renderNavbar();
        Auth.checkAuth();
        addGoBack();
        addFooter();

        const page = document.body.dataset.page;
        if(!page) return;
        if(page === 'login' || page === 'register') Auth.init();
        else if(page === 'home') {
            const welcome = document.querySelector('.page-header h1');
            const session = Storage.getSession();
            if(welcome && session) welcome.textContent = `Welcome back, ${session.childName}!`;
        }
        else if(page === 'sleep') initTracker('sleep');
        else if(page === 'feeding') initTracker('feeding');
        else if(page === 'diaper') initTracker('diaper');
        else if(page === 'health-overview') initHealthOverview();
        else if(page === 'health-appointments') initAppointments();
        else if(page === 'health-allergies') initAllergies();
        else if(page === 'health-medications') initMedications();
        else if(page === 'health-teething') initTeething();
    });
})();