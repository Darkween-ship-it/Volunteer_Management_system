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
        });
    });
}

Object.values(formPanels).forEach(handleFormToggle);
