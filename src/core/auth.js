import { Storage } from './storage.js';

export const Auth = {
    init() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
    },

    handleLogin() {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        if (!emailInput || !passwordInput) {
            alert('Form inputs not found');
            return;
        }

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        if (!email || !password) {
            alert('Please enter both email and password');
            return;
        }

        const users = Storage.load('registered_users') || [];
        const user = users.find(u => u.email.toLowerCase() === email && u.password === password);

        if (user) {
            Storage.setSession({
                email: user.email,
                childName: user.childName,
                childGender: user.childGender
            });
            // UPDATE THIS PATH based on your structure
            window.location.href = '/public/pages/dashboard/home.html';
        } else {
            alert('Invalid email or password');
        }
    },

    handleRegister() {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const childNameInput = document.getElementById('child-name');
        const genderSelect = document.getElementById('child-gender');

        if (!emailInput || !passwordInput || !childNameInput) {
            alert('Form inputs not found');
            return;
        }

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;
        const childName = childNameInput.value.trim();
        const childGender = genderSelect?.value || 'other';

        if (!email || !password || !childName) {
            alert('Please fill in all fields');
            return;
        }

        if (password.length < 3) {
            alert('Password must be at least 3 characters long');
            return;
        }

        const users = Storage.load('registered_users') || [];

        if (users.some(u => u.email.toLowerCase() === email)) {
            alert('This email is already registered. Please login instead.');
            return;
        }

        const newUser = { email, password, childName, childGender };
        users.push(newUser);

        Storage.save('registered_users', users);
        alert('Registration successful! Please login with your credentials.');
        // UPDATE THIS PATH based on your structure
        window.location.href = '/public/pages/auth/login.html';
    },

    checkAuth() {
        const session = Storage.getSession();
        const path = window.location.pathname;
        const isAuthPage = path.includes('login.html') ||
                          path.includes('register.html') ||
                          path === '/' ||
                          path === '/index.html';

        if (!session && !isAuthPage) {
            // UPDATE THIS PATH based on your structure
            window.location.href = '/public/pages/auth/login.html';
        }
    }
};