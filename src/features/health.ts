import { Storage, type HealthData } from '../core/storage';

export const Health = {
    init(): void {
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

    initOverview(): void {
        const healthData = Storage.getHealth();
        const nextAppt = healthData.appointments[0];
        const apptPreview = document.getElementById('next-appointment-preview');
        if (apptPreview) {
            apptPreview.innerText = nextAppt ? `${nextAppt.date} with ${nextAppt.doctor}` : 'None scheduled';
        }
        const medCount = document.getElementById('active-medications-count');
        if (medCount) medCount.innerText = healthData.medications.length.toString();

        const growthForm = document.getElementById('growth-form') as HTMLFormElement;
        growthForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const height = parseFloat((document.getElementById('growth-height') as HTMLInputElement).value);
            const weight = parseFloat((document.getElementById('growth-weight') as HTMLInputElement).value);
            if (isNaN(height) || isNaN(weight)) return;
            const updatedHealth = Storage.getHealth();
            updatedHealth.growth.push({ date: new Date().toLocaleDateString(), height, weight });
            Storage.saveHealth(updatedHealth);
            alert('Growth record saved!');
            growthForm.reset();
            this.renderGrowthList();
        });
        this.renderGrowthList();
    },

    renderGrowthList(): void {
        const listEl = document.getElementById('growth-list');
        if (!listEl) return;
        const health = Storage.getHealth();
        listEl.innerHTML = health.growth.length ? health.growth.map(g => `
            <li class="data-item">📏 ${g.height}cm  ⚖️ ${g.weight}kg  (${g.date})</li>
        `).join('') : '<li class="empty-state">No growth records yet.</li>';
    },

    initAppointments(): void {
        const form = document.getElementById('appointment-form') as HTMLFormElement;
        const list = document.getElementById('appointment-list');
        const render = () => {
            const data = Storage.getHealth();
            if (!list) return;
            list.innerHTML = data.appointments.map(appt => `
                <li class="data-item"><strong>${appt.doctor}</strong> — ${appt.date} at ${appt.time}</li>
            `).join('') || '<li class="empty-state">No appointments scheduled.</li>';
        };
        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            const healthData = Storage.getHealth();
            healthData.appointments.push({
                doctor: (document.getElementById('doctor-name') as HTMLInputElement).value,
                date: (document.getElementById('appointment-date') as HTMLInputElement).value,
                time: (document.getElementById('appointment-time') as HTMLInputElement).value
            });
            Storage.saveHealth(healthData);
            render();
            form.reset();
        });
        render();
    },

    initMedications(): void {
        const medicationForm = document.getElementById('medication-form') as HTMLFormElement;
        const medicationList = document.getElementById('medication-list');
        const vaccineForm = document.getElementById('vaccine-form') as HTMLFormElement;
        const vaccineList = document.getElementById('vaccine-list');
        const tempForm = document.getElementById('temp-form') as HTMLFormElement;
        const tempList = document.getElementById('temp-list');

        const renderMedications = () => {
            const data = Storage.getHealth();
            if (medicationList) {
                medicationList.innerHTML = data.medications.map(med => `
                    <li class="data-item"><strong>${med.name}</strong> — ${med.dosage} (${med.frequency})</li>
                `).join('') || '<li class="empty-state">No medications added.</li>';
            }
        };

        const renderVaccines = () => {
            const data = Storage.getHealth();
            if (vaccineList) {
                vaccineList.innerHTML = data.vaccinations.map(v => `
                    <li class="data-item ${v.administeredDate ? 'vaccine-administered' : ''}">
                        <strong>${v.name}</strong><br>Due: ${v.dueDate} ${v.administeredDate ? `✅ Administered: ${v.administeredDate}` : '⏳ Not yet'}<br>${v.notes || ''}
                    </li>
                `).join('') || '<li class="empty-state">No vaccines added.</li>';
            }
        };

        const renderTemperatures = () => {
            const data = Storage.getHealth();
            if (tempList) {
                tempList.innerHTML = data.temperature.map(t => {
                    let cls = '';
                    if (t.value > 38.0) cls = 'temp-critical';
                    else if (t.value > 37.2) cls = 'temp-warning';
                    else cls = 'temp-normal';
                    return `<li class="data-item ${cls}">🌡️ ${new Date(t.datetime).toLocaleString()} — ${t.value}°C (${t.method})<br>${t.notes || ''}</li>`;
                }).join('') || '<li class="empty-state">No temperature records.</li>';
            }
        };

        medicationForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const healthData = Storage.getHealth();
            healthData.medications.push({
                name: (document.getElementById('med-name') as HTMLInputElement).value,
                dosage: (document.getElementById('med-dosage') as HTMLInputElement).value,
                frequency: (document.getElementById('med-frequency') as HTMLInputElement).value
            });
            Storage.saveHealth(healthData);
            renderMedications();
            medicationForm.reset();
        });

        vaccineForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const healthData = Storage.getHealth();
            healthData.vaccinations.push({
                id: Date.now(),
                name: (document.getElementById('vaccine-name') as HTMLInputElement).value,
                dueDate: (document.getElementById('vaccine-due') as HTMLInputElement).value,
                administeredDate: (document.getElementById('vaccine-admin') as HTMLInputElement).value || null,
                notes: (document.getElementById('vaccine-notes') as HTMLTextAreaElement).value
            });
            Storage.saveHealth(healthData);
            renderVaccines();
            vaccineForm.reset();
        });

        tempForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const healthData = Storage.getHealth();
            healthData.temperature.push({
                id: Date.now(),
                datetime: (document.getElementById('temp-datetime') as HTMLInputElement).value,
                value: parseFloat((document.getElementById('temp-value') as HTMLInputElement).value),
                method: (document.getElementById('temp-method') as HTMLSelectElement).value,
                notes: (document.getElementById('temp-notes') as HTMLTextAreaElement).value
            });
            Storage.saveHealth(healthData);
            renderTemperatures();
            tempForm.reset();
        });

        const emergencyBtn = document.getElementById('emergency-btn');
        if (emergencyBtn) {
            emergencyBtn.onclick = () => {
                window.location.href = '/public/pages/tracking/health/appointments.html';
            };
        }

        renderMedications();
        renderVaccines();
        renderTemperatures();
    },

    initAllergies(): void {
        const form = document.getElementById('allergy-form') as HTMLFormElement;
        const list = document.getElementById('allergy-list');
        const render = () => {
            const data = Storage.getHealth();
            if (!list) return;
            list.innerHTML = data.allergies.map(all => `
                <li class="data-item severity-${all.severity.toLowerCase()}"><strong>${all.name}</strong> (${all.severity})<br><small>${all.reaction}</small></li>
            `).join('') || '<li class="empty-state">No allergies recorded.</li>';
        };
        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            const healthData = Storage.getHealth();
            healthData.allergies.push({
                name: (document.getElementById('allergy-name') as HTMLInputElement).value,
                severity: (document.getElementById('allergy-severity') as HTMLSelectElement).value,
                reaction: (document.getElementById('allergy-reaction') as HTMLTextAreaElement).value
            });
            Storage.saveHealth(healthData);
            render();
            form.reset();
        });
        render();
    },

    initTeething(): void {
        const dentistInput = document.getElementById('dentist-date') as HTMLInputElement;
        const dentistStatus = document.getElementById('dentist-status');
        const session = Storage.getSession();
        const email = session ? session.email : '';
        const getKey = (k: string) => `${k}_${email}`;

        const updateDentist = () => {
            const reminder = localStorage.getItem(getKey('dentist_reminder'));
            if (dentistStatus) {
                dentistStatus.innerText = reminder ? `Next dentist visit: ${new Date(reminder).toLocaleDateString()}` : 'No dentist reminder set.';
                if (dentistInput) dentistInput.value = reminder || '';
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

        const teethingForm = document.getElementById('teething-form') as HTMLFormElement;
        const teethingList = document.getElementById('teething-list');
        const renderTeething = () => {
            const health = Storage.getHealth();
            if (teethingList) {
                teethingList.innerHTML = health.teething.map(t => `
                    <li class="data-item"><strong>${t.toothName}</strong> — erupted ${new Date(t.eruptionDate).toLocaleDateString()}<br>${t.symptoms || ''}</li>
                `).join('') || '<li class="empty-state">No teething records.</li>';
            }
        };
        teethingForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const health = Storage.getHealth();
            health.teething.push({
                id: Date.now(),
                toothName: (document.getElementById('tooth-name') as HTMLInputElement).value,
                eruptionDate: (document.getElementById('eruption-date') as HTMLInputElement).value,
                symptoms: (document.getElementById('symptoms') as HTMLTextAreaElement).value
            });
            Storage.saveHealth(health);
            renderTeething();
            teethingForm.reset();
        });
        renderTeething();
    }
};