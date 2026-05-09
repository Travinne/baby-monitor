import { Storage } from '../core/storage.js';

export const Health = {
    init() {
        const page = document.body.dataset.page;
        switch (page) {
            case 'health-overview':
                this.initOverview();
                break;
            case 'health-appointments':
                this.initAppointments();
                break;
            case 'health-medications':
                this.initMedications();
                break;
            case 'health-allergies':
                this.initAllergies();
                break;
            case 'health-teething':
                this.initTeething();
                break;
        }
    },

    initOverview() {
        const healthData = Storage.getHealth();
        const nextAppt = healthData.appointments[0];
        const apptPreview = document.getElementById('next-appointment-preview');
        if (apptPreview) {
            apptPreview.innerText = nextAppt ? `${nextAppt.date} with ${nextAppt.doctor}` : 'None scheduled';
        }
        const medCount = document.getElementById('active-medications-count');
        if (medCount) medCount.innerText = healthData.medications.length.toString();

        const growthForm = document.getElementById('growth-form');
        if (growthForm) {
            growthForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const height = parseFloat(document.getElementById('growth-height').value);
                const weight = parseFloat(document.getElementById('growth-weight').value);
                if (isNaN(height) || isNaN(weight)) return;
                const updatedHealth = Storage.getHealth();
                updatedHealth.growth.push({ date: new Date().toLocaleDateString(), height, weight });
                Storage.saveHealth(updatedHealth);
                alert('Growth record saved!');
                growthForm.reset();
                this.renderGrowthList();
            });
        }
        this.renderGrowthList();
    },

    renderGrowthList() {
        const listEl = document.getElementById('growth-list');
        if (!listEl) return;
        const health = Storage.getHealth();
        if (health.growth.length === 0) {
            listEl.innerHTML = '<li class="empty-state">No growth records yet.</li>';
            return;
        }
        listEl.innerHTML = health.growth.map(g => `
            <li class="data-item">📏 ${g.height}cm  ⚖️ ${g.weight}kg  (${g.date})</li>
        `).join('');
    },

    initAppointments() {
        const form = document.getElementById('appointment-form');
        const list = document.getElementById('appointment-list');
        
        const render = () => {
            const data = Storage.getHealth();
            if (!list) return;
            if (data.appointments.length === 0) {
                list.innerHTML = '<li class="empty-state">No appointments scheduled.</li>';
                return;
            }
            list.innerHTML = data.appointments.map(appt => `
                <li class="data-item"><strong>${appt.doctor}</strong> — ${appt.date} at ${appt.time}</li>
            `).join('');
        };
        
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const healthData = Storage.getHealth();
                healthData.appointments.push({
                    doctor: document.getElementById('doctor-name').value,
                    date: document.getElementById('appointment-date').value,
                    time: document.getElementById('appointment-time').value
                });
                Storage.saveHealth(healthData);
                render();
                form.reset();
            });
        }
        render();
    },

    initMedications() {
        const tempForm = document.getElementById('temp-form');
        const tempList = document.getElementById('temp-list');
        const medForm = document.getElementById('med-form');
        const medList = document.getElementById('med-list');
        const vaccineForm = document.getElementById('vaccine-form');
        const vaccineList = document.getElementById('vaccine-list');
        const emergency = document.getElementById('emergency-btn');
        
        if (emergency) {
            emergency.onclick = () => {
                window.location.href = '/public/pages/tracking/health/appointments.html';
            };
        }

        const renderTemp = () => {
            const temps = Storage.getHealth().temperature;
            if (!tempList) return;
            if (temps.length === 0) {
                tempList.innerHTML = '<li class="empty-state">No temperature records.</li>';
                return;
            }
            tempList.innerHTML = temps.map(t => {
                let cls = '';
                if (t.value > 38) cls = 'temp-critical';
                else if (t.value > 37.2) cls = 'temp-warning';
                else cls = 'temp-normal';
                return `<li class="data-item ${cls}">🌡️ ${new Date(t.datetime).toLocaleString()} — ${t.value}°C (${t.method})<br>${t.notes || ''}</li>`;
            }).join('');
        };

        const renderMeds = () => {
            const meds = Storage.getHealth().medications;
            if (!medList) return;
            if (meds.length === 0) {
                medList.innerHTML = '<li class="empty-state">No medications added.</li>';
                return;
            }
            medList.innerHTML = meds.map(m => `
                <li class="data-item"><strong>${m.name}</strong> — ${m.dosage} (${m.frequency})</li>
            `).join('');
        };

        const renderVaccines = () => {
            const vaccs = Storage.getHealth().vaccinations;
            if (!vaccineList) return;
            if (vaccs.length === 0) {
                vaccineList.innerHTML = '<li class="empty-state">No vaccines added.</li>';
                return;
            }
            vaccineList.innerHTML = vaccs.map(v => `
                <li class="data-item ${v.administeredDate ? 'vaccine-administered' : ''}">
                    <strong>${v.name}</strong><br>Due: ${v.dueDate} ${v.administeredDate ? '✅ Administered: ' + v.administeredDate : '⏳ Not yet'}<br>${v.notes || ''}
                </li>
            `).join('');
        };

        if (tempForm) {
            tempForm.addEventListener('submit', (e) => {
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
            });
        }

        if (medForm) {
            medForm.addEventListener('submit', (e) => {
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
            });
        }

        if (vaccineForm) {
            vaccineForm.addEventListener('submit', (e) => {
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
            });
        }

        renderTemp();
        renderMeds();
        renderVaccines();
    },

    initAllergies() {
        const form = document.getElementById('allergy-form');
        const list = document.getElementById('allergy-list');
        
        const render = () => {
            const data = Storage.getHealth();
            if (!list) return;
            if (data.allergies.length === 0) {
                list.innerHTML = '<li class="empty-state">No allergies recorded.</li>';
                return;
            }
            list.innerHTML = data.allergies.map(all => `
                <li class="data-item severity-${all.severity.toLowerCase()}"><strong>${all.name}</strong> (${all.severity})<br><small>${all.reaction}</small></li>
            `).join('');
        };
        
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const healthData = Storage.getHealth();
                healthData.allergies.push({
                    name: document.getElementById('allergy-name').value,
                    severity: document.getElementById('allergy-severity').value,
                    reaction: document.getElementById('allergy-reaction').value
                });
                Storage.saveHealth(healthData);
                render();
                form.reset();
            });
        }
        render();
    },

    initTeething() {
        const dentistInput = document.getElementById('dentist-date');
        const dentistStatus = document.getElementById('dentist-status');
        const session = Storage.getSession();
        const email = session ? session.email : '';
        const getKey = (k) => `${k}_${email}`;

        const updateDentist = () => {
            const reminder = localStorage.getItem(getKey('dentist_reminder'));
            if (dentistStatus) {
                dentistStatus.innerText = reminder ? `Next dentist visit: ${new Date(reminder).toLocaleDateString()}` : 'No dentist reminder set.';
                if (dentistInput && reminder) dentistInput.value = reminder;
            }
        };

        const setDentistBtn = document.getElementById('set-dentist');
        if (setDentistBtn) {
            setDentistBtn.onclick = () => {
                const date = dentistInput?.value;
                if (!date) { alert('Select a date'); return; }
                localStorage.setItem(getKey('dentist_reminder'), date);
                updateDentist();
                alert('Dentist reminder saved!');
            };
        }
        updateDentist();

        const teethingForm = document.getElementById('teething-form');
        const teethingList = document.getElementById('teething-list');
        
        const renderTeething = () => {
            const health = Storage.getHealth();
            if (!teethingList) return;
            if (health.teething.length === 0) {
                teethingList.innerHTML = '<li class="empty-state">No teething records.</li>';
                return;
            }
            teethingList.innerHTML = health.teething.map(t => `
                <li class="data-item"><strong>${t.toothName}</strong> — erupted ${new Date(t.eruptionDate).toLocaleDateString()}<br>${t.symptoms || ''}</li>
            `).join('');
        };
        
        if (teethingForm) {
            teethingForm.addEventListener('submit', (e) => {
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
            });
        }
        renderTeething();
    }
};