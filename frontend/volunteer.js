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
            headers: body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
            body: body instanceof FormData ? body : JSON.stringify(body),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Request failed');
        return data.data;
    },
    async put(url, body) {
        const res = await fetch(url, {
            method: 'PUT',
            headers: body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
            body: body instanceof FormData ? body : JSON.stringify(body),
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

const navItems = document.querySelectorAll('.nav-item');
const titles = {
    dashboard: 'Dashboard',
    events: 'Available Events',
    mine: 'My Events',
    profile: 'My Profile',
};

navItems.forEach((item) => {
    item.addEventListener('click', () => {
        navItems.forEach((n) => n.classList.remove('active'));
        item.classList.add('active');
        const view = item.dataset.view;
        document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
        document.getElementById(`view-${view}`).classList.add('active');
        document.getElementById('page-title').textContent = titles[view];
        loadView(view);
    });
});

function loadView(view) {
    if (view === 'dashboard') loadDashboard();
    if (view === 'events') renderEvents();
    if (view === 'mine') renderMyEvents();
    if (view === 'profile') renderProfile();
}

async function init() {
    const id = localStorage.getItem(VOLUNTEER_KEY);
    if (!id) {
        window.location.href = 'index.html';
        return;
    }
    try {
        volunteer = await api.get(`/api/volunteers/${id}`);
        document.getElementById('nav-greeting').textContent = `Hi, ${volunteer.name}`;
        if (volunteer.profilePicture) {
            const avatar = document.getElementById('nav-avatar');
            avatar.src = volunteer.profilePicture;
            avatar.classList.remove('hidden');
        }
        if (volunteer.status !== 'approved') {
            document.getElementById('pending-banner').classList.remove('hidden');
        }
        loadView('dashboard');
    } catch (err) {
        toast(err.message, true);
    }
}

async function loadDashboard() {
    try {
        const [events, participations] = await Promise.all([
            api.get('/api/events'),
            api.get('/api/participations'),
        ]);
        const myEvents = events.filter(
            (e) => (e.participants || []).some((p) => p.volunteerId === volunteer.id)
        );
        const myParticipation = participations.filter((r) => r.volunteerId === volunteer.id);

        const statusEl = document.getElementById('stat-status');
        statusEl.textContent = volunteer.status;
        statusEl.classList.add(`stat-${volunteer.status}`);
        document.getElementById('stat-events').textContent = myEvents.length;
        document.getElementById('stat-participation').textContent = myParticipation.length;
        document.getElementById('stat-present').textContent =
            myParticipation.filter((r) => r.status === 'present').length;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = events
            .filter((e) => new Date(e.date).getTime() >= today.getTime())
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5);

        const upBox = document.getElementById('dashboard-events');
        if (!upcoming.length) {
            upBox.innerHTML = '<p class="muted">No upcoming events.</p>';
        } else {
            upBox.innerHTML = upcoming.map((e) => {
                const joined = myEvents.some((m) => m.id === e.id);
                return `
                    <div class="list-item">
                        <div class="info">
                            <h4>${escapeHtml(e.title)}</h4>
                            <p>${escapeHtml(e.date)} · ${escapeHtml(e.location)}</p>
                        </div>
                        <span class="badge ${joined ? 'badge-approved' : 'badge-open'}">${joined ? 'Joined' : 'Open'}</span>
                    </div>
                `;
            }).join('');
        }

        const partBox = document.getElementById('dashboard-participation');
        if (!myParticipation.length) {
            partBox.innerHTML = '<p class="muted">No participation records yet.</p>';
        } else {
            partBox.innerHTML = myParticipation.slice(0, 5).map((r) => `
                <div class="list-item">
                    <div class="info">
                        <h4>${escapeHtml(r.eventTitle)}</h4>
                        <p>${new Date(r.date).toLocaleString()}</p>
                    </div>
                    <span class="badge ${statusBadge(r.status)}">${escapeHtml(r.status)}</span>
                </div>
            `).join('');
        }
    } catch (err) {
        toast(err.message, true);
    }
}

function statusBadge(status) {
    if (status === 'present') return 'badge-approved';
    if (status === 'late') return 'badge-pending';
    return 'badge-rejected';
}

function renderProfile() {
    document.getElementById('profile-info').innerHTML = `
        <div class="list-item">
            <div class="info"><h4>Photo</h4><img class="avatar" src="${volunteer.profilePicture || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 fill=%22%23ccc%22/%3E%3Ctext x=%2232%22 y=%2240%22 font-size=%2228%22 text-anchor=%22middle%22 fill=%22%23fff%22%3E${escapeHtml((volunteer.name || '?')[0].toUpperCase())}%3C/text%3E%3C/svg%3E'}" alt=""></div>
        </div>
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
    document.getElementById('profile-picture-preview').innerHTML = volunteer.profilePicture
        ? `<img class="avatar" src="${escapeHtml(volunteer.profilePicture)}" alt="">`
        : '<span class="muted">No photo yet.</span>';
    document.getElementById('p-name').value = volunteer.name;
    document.getElementById('p-skills').value = (volunteer.skills || []).join(', ');
}

document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = new FormData();
    body.append('name', document.getElementById('p-name').value.trim());
    body.append('skills', document.getElementById('p-skills').value.split(',').map((s) => s.trim()).filter(Boolean));
    const password = document.getElementById('p-password').value;
    if (password) body.append('password', password);
    const file = document.getElementById('p-picture').files[0];
    if (file) body.append('profilePicture', file);
    try {
        volunteer = await api.put(`/api/volunteers/${volunteer.id}`, body);
        document.getElementById('nav-greeting').textContent = `Hi, ${volunteer.name}`;
        if (volunteer.profilePicture) {
            const avatar = document.getElementById('nav-avatar');
            avatar.src = volunteer.profilePicture;
            avatar.classList.remove('hidden');
        }
        document.getElementById('p-password').value = '';
        document.getElementById('p-picture').value = '';
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
        const myEventIds = new Set(
            events
                .filter((e) => (e.participants || []).some((p) => p.volunteerId === volunteer.id))
                .map((e) => e.id)
        );
        grid.innerHTML = events.map((e) => {
            const applied = myEventIds.has(e.id);
            const disabled = volunteer.status !== 'approved';
            return `
                <div class="event-card">
                    ${e.image ? `<img class="event-img" src="${escapeHtml(e.image)}" alt="">` : ''}
                    <h3>${escapeHtml(e.title)}</h3>
                    <p class="meta">${escapeHtml(e.date)} · ${escapeHtml(e.location)}</p>
                    ${e.description ? `<p class="desc">${escapeHtml(e.description)}</p>` : ''}
                    <p class="meta">${(e.participants || []).length} volunteer(s) registered</p>
                    <div class="actions">
                        ${applied
                            ? '<span class="badge badge-approved">Applied</span>'
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
    const partTbody = document.getElementById('my-participation');
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
                <tr>
                    <td>${escapeHtml(e.title)}</td>
                    <td>${escapeHtml(e.date)}</td>
                    <td>${escapeHtml(e.location)}</td>
                    <td><span class="badge badge-approved">Registered</span></td>
                </tr>
              `).join('')
            : '<tr><td colspan="4" class="muted">You have not applied to any events yet. Browse Available Events.</td></tr>';

        const myParticipation = participations.filter((r) => r.volunteerId === volunteer.id);
        partTbody.innerHTML = myParticipation.length
            ? myParticipation.map((r) => `
                <tr>
                    <td>${escapeHtml(r.eventTitle)}</td>
                    <td><span class="badge ${statusBadge(r.status)}">${escapeHtml(r.status)}</span></td>
                    <td>${new Date(r.date).toLocaleString()}</td>
                </tr>
              `).join('')
            : '<tr><td colspan="3" class="muted">No participation records yet.</td></tr>';
    } catch (err) {
        box.innerHTML = `<tr><td colspan="4" class="muted">${escapeHtml(err.message)}</td></tr>`;
    }
}

init();
