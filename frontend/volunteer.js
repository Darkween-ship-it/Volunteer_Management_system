const VOLUNTEER_KEY = 'vhub-volunteer-id';

const api = {
    async get(url) {
        const res = await fetch(url);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Request failed');
        return data.data;
    },
    async post(url, body) {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Request failed');
        return data.data;
    },
    async put(url, body) {
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Request failed');
        return data.data;
    },
};

let volunteer = null;

function toast(message, isError = false) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.toggle('error', isError);
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3000);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function logout() {
    localStorage.removeItem(VOLUNTEER_KEY);
    window.location.href = 'index.html';
}

document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
        document.getElementById(`view-${tab.dataset.view}`).classList.add('active');
    });
});

async function init() {
    const id = localStorage.getItem(VOLUNTEER_KEY);
    if (!id) {
        window.location.href = 'index.html';
        return;
    }
    try {
        volunteer = await api.get(`/api/volunteers/${id}`);
        document.getElementById('nav-greeting').textContent = `Hi, ${volunteer.name}`;
        if (volunteer.status !== 'approved') {
            document.getElementById('pending-banner').classList.remove('hidden');
        }
        renderProfile();
        renderEvents();
        renderMyEvents();
    } catch (err) {
        toast(err.message, true);
    }
}

function renderProfile() {
    document.getElementById('profile-info').innerHTML = `
        <div class="list-item">
            <div class="info"><h4>Name</h4><p>${escapeHtml(volunteer.name)}</p></div>
        </div>
        <div class="list-item">
            <div class="info"><h4>Email</h4><p>${escapeHtml(volunteer.email)}</p></div>
        </div>
        <div class="list-item">
            <div class="info"><h4>Skills</h4><p>${(volunteer.skills || []).map(escapeHtml).join(', ') || 'None added'}</p></div>
        </div>
        <div class="list-item">
            <div class="info"><h4>Status</h4><p><span class="badge badge-${volunteer.status}">${escapeHtml(volunteer.status)}</span></p></div>
        </div>
        <div class="list-item">
            <div class="info"><h4>Applied</h4><p>${new Date(volunteer.createdAt).toLocaleDateString()}</p></div>
        </div>
    `;
    document.getElementById('p-name').value = volunteer.name;
    document.getElementById('p-skills').value = (volunteer.skills || []).join(', ');
}

document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
        name: document.getElementById('p-name').value.trim(),
        skills: document.getElementById('p-skills').value.split(',').map((s) => s.trim()).filter(Boolean),
    };
    const password = document.getElementById('p-password').value;
    if (password) body.password = password;
    try {
        volunteer = await api.put(`/api/volunteers/${volunteer.id}`, body);
        document.getElementById('nav-greeting').textContent = `Hi, ${volunteer.name}`;
        document.getElementById('p-password').value = '';
        renderProfile();
        toast('Profile updated');
    } catch (err) {
        toast(err.message, true);
    }
});

async function renderEvents() {
    const grid = document.getElementById('events-grid');
    try {
        const events = await api.get('/api/events');
        if (!events.length) {
            grid.innerHTML = '<p class="muted">No events available yet.</p>';
            return;
        }
        const myEvents = events.filter(
            (e) => (e.participants || []).some((p) => p.volunteerId === volunteer.id)
        );
        grid.innerHTML = events.map((e) => {
            const applied = myEvents.some((m) => m.id === e.id);
            const disabled = volunteer.status !== 'approved';
            return `
                <div class="event-card">
                    <h3>${escapeHtml(e.title)}</h3>
                    <p class="meta">${escapeHtml(e.date)} · ${escapeHtml(e.location)}</p>
                    ${e.description ? `<p class="desc">${escapeHtml(e.description)}</p>` : ''}
                    <p class="meta">${(e.participants || []).length} volunteer(s) registered</p>
                    <div class="actions">
                        ${applied
                            ? '<span class="applied">Applied</span>'
                            : `<button class="btn btn-primary" ${disabled ? 'disabled' : ''} onclick="applyToEvent(${e.id})">Apply to participate</button>`}
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        grid.innerHTML = `<p class="muted">${escapeHtml(err.message)}</p>`;
    }
}

async function applyToEvent(eventId) {
    try {
        await api.post(`/api/events/${eventId}/register`, { volunteerId: volunteer.id });
        toast('Applied! You are now registered for this event.');
        renderEvents();
        renderMyEvents();
    } catch (err) {
        toast(err.message, true);
    }
}

async function renderMyEvents() {
    const box = document.getElementById('my-events');
    const attBox = document.getElementById('my-participation');
    try {
        const [events, participations] = await Promise.all([
            api.get('/api/events'),
            api.get('/api/participations'),
        ]);
        const myEvents = events.filter(
            (e) => (e.participants || []).some((p) => p.volunteerId === volunteer.id)
        );
        box.innerHTML = myEvents.length
            ? myEvents.map((e) => `
                <div class="list-item">
                    <div class="info">
                        <h4>${escapeHtml(e.title)}</h4>
                        <p>${escapeHtml(e.date)} · ${escapeHtml(e.location)}</p>
                    </div>
                    <span class="applied">Registered</span>
                </div>
              `).join('')
            : '<p class="muted">You have not applied to any events yet.</p>';

        const myParticipation = participations.filter((r) => r.volunteerId === volunteer.id);
        attBox.innerHTML = myParticipation.length
            ? myParticipation.map((r) => `
                <div class="list-item">
                    <div class="info">
                        <h4>${escapeHtml(r.eventTitle)}</h4>
                        <p>${new Date(r.date).toLocaleString()}</p>
                    </div>
                    <span class="badge badge-${r.status === 'present' ? 'approved' : r.status === 'late' ? 'pending' : 'rejected'}">${escapeHtml(r.status)}</span>
                </div>
              `).join('')
            : '<p class="muted">No participation records yet.</p>';
    } catch (err) {
        box.innerHTML = `<p class="muted">${escapeHtml(err.message)}</p>`;
    }
}

init();
