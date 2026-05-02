import { Storage as CoreStorage  } from './storage';

export const Auth = {
    init(): void {
        const loginForm = document.getElementById('login-form') as HTMLFormElement;
        const registerForm = document.getElementById('register-form') as HTMLFormElement;

        if (loginForm) {
            loginForm.onsubmit = (e) => {
                e.preventDefault();
                this.handleLogin();
            };
        }
        if (registerForm) {
            registerForm.onsubmit = (e) => {
                e.preventDefault();
                this.handleRegister();
            };
        }
    },

    handleLogin(): void {
        const emailInput = document.getElementById('email') as HTMLInputElement;
        const passwordInput = document.getElementById('password') as HTMLInputElement;
        const users = Storage.load<any[]>('registered_users') || [];
        const user = users.find(u => u.email === emailInput.value && u.password === passwordInput.value);

        if (user) {
            Storage.setSession({
                email: user.email,
                childName: user.childName,
                childGender: user.childGender
            });
            window.location.href = '/pages/dashboard/home.html';
        } else {
            alert('Invalid email or password');
        }
    },

    handleRegister(): void {
        const email = (document.getElementById('email') as HTMLInputElement).value;
        const password = (document.getElementById('password') as HTMLInputElement).value;
        const childName = (document.getElementById('child-name') as HTMLInputElement).value;
        const genderEl = document.getElementById('child-gender') as HTMLSelectElement;

        const newUser = {
            email,
            password,
            childName,
            childGender: genderEl?.value || 'other'
        };

        const users = Storage.load<any[]>('registered_users') || [];
        if (users.some(u => u.email === email)) {
            alert('This email is already registered.');
            return;
        }

        users.push(newUser);
        Storage.save('registered_users', users);
        alert('Registration successful! Please login.');
        window.location.href = '/pages/auth/login.html';
    },

    checkAuth(): void {
        const session = Storage.getSession();
        const path = window.location.pathname;
        const isAuthPage = path.includes('login.html') || path.includes('register.html') || path === '/' || path === '/index.html';

        if (!session && !isAuthPage) {
            window.location.href = '/pages/auth/login.html';
        }
    }
};