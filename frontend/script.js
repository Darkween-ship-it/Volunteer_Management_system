const roleTabs = document.querySelectorAll('.tab');
const formPanels = {
    volunteer: document.getElementById('volunteer-form'),
    admin: document.getElementById('admin-form')
};

roleTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        roleTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const role = tab.dataset.role;
        Object.values(formPanels).forEach(panel => panel.classList.remove('active'));
        formPanels[role].classList.add('active');
    });
});

function handleFormToggle(panel) {
    const buttons = panel.querySelectorAll('.form-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const mode = btn.dataset.mode;
            const forms = panel.querySelectorAll('.auth-form');
            forms.forEach(f => f.classList.add('hidden'));
            panel.querySelector(`#${panel.id.split('-')[0]}-${mode}`).classList.remove('hidden');
            clearMessage(panel);
        });
    });
}

Object.values(formPanels).forEach(handleFormToggle);

function showMessage(panel, text, isError = false) {
    const el = panel.querySelector('.form-msg');
    el.textContent = text;
    el.classList.toggle('error', isError);
    el.classList.remove('hidden');
}

function clearMessage(panel) {
    const el = panel.querySelector('.form-msg');
    el.classList.add('hidden');
    el.textContent = '';
}

function applyAsVolunteer() {
    document.querySelector('.tab[data-role="volunteer"]').click();
    const panel = document.getElementById('volunteer-form');
    panel.querySelector('.form-btn[data-mode="signup"]').click();
}

async function api(url, method, body) {
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Request failed');
    return data.data;
}

document.getElementById('volunteer-signin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const panel = document.getElementById('volunteer-form');
    const email = panel.querySelector('#volunteer-signin input[type="email"]').value.trim();
    const password = panel.querySelector('#volunteer-signin input[type="password"]').value;
    try {
        const volunteer = await api('/api/volunteers/login', 'POST', { email, password });
        localStorage.setItem('vhub-volunteer-id', volunteer.id);
        window.location.href = 'volunteer.html';
    } catch (err) {
        showMessage(panel, err.message, true);
    }
});

document.getElementById('volunteer-signup').addEventListener('submit', async (e) => {
    e.preventDefault();
    const panel = document.getElementById('volunteer-form');
    const name = panel.querySelector('#volunteer-signup input[type="text"]').value.trim();
    const email = panel.querySelector('#volunteer-signup input[type="email"]').value.trim();
    const password = panel.querySelector('#volunteer-signup input[type="password"]').value;
    try {
        await api('/api/volunteers', 'POST', { name, email, password });
        panel.querySelector('#volunteer-signup input[type="text"]').value = '';
        panel.querySelector('#volunteer-signup input[type="email"]').value = '';
        panel.querySelector('#volunteer-signup input[type="password"]').value = '';
        showMessage(panel, 'Application submitted! An admin will review it before you can sign in.');
    } catch (err) {
        showMessage(panel, err.message, true);
    }
});

document.querySelectorAll('#admin-form .auth-form').forEach((form) => {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        window.location.href = 'admin.html';
    });
});
