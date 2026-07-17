import { login,signup } from './main2.js';

const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');

signupForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const fullName = document.getElementById('fullName').value.toLowerCase();
    const signupPhone = document.getElementById('signupPhone').value.toLowerCase();
    const governorate = document.getElementById('governorate').value.toLowerCase();
    const email = document.getElementById('signupEmail').value.toLowerCase();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    if (password.length < 8) {
        alert("password must be 8 char");
        return;
    }
    if (password !== confirmPassword) {
        alert("passwords do not match.");
        return;
    }
    const phoneRegex = /^01[0125]\d{8}$/;

    if (!phoneRegex.test(signupPhone)) {
        alert("enter a valid phone");
        return;
    }
    signup(fullName,email,signupPhone,governorate);
    alert("success");
    window.location.href = "index.html";
});

loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.toLowerCase();
    const password = document.getElementById('loginPassword').value;
    if (email.length <= 6) {
        alert("email must 6char");
        return;
    }
    if (password.length <= 6) {
        alert("password must 6char");
        return;
    }
    if (login(email, password)) {
        alert("success");
        window.location.href = "index.html";
    } else {
        alert("pass or email not correct");

    }


});

document.querySelectorAll('.toggle-password').forEach(icon => {
    icon.addEventListener('click', () => {
        const targetId = icon.getAttribute('data-target');
        const passwordInput = document.getElementById(targetId);

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    });
});