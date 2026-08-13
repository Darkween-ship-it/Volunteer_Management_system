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
    async del(url) {
        const res = await fetch(url, { method: 'DELETE' });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Request failed');
        return data.data;
    },
};

function toast(message, isError = false) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.toggle('error', isError);
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3000);
}

const navItems = document.querySelectorAll('.nav-item');
const titles = {
    dashboard: 'Dashboard',
    volunteers: 'Volunteers',
    events: 'Events',
    participation: 'Participation',
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

function openModal(title, bodyHtml) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

async function loadView(view) {
    if (view === 'dashboard') loadDashboard();
    if (view === 'volunteers') loadVolunteers();
    if (view === 'events') loadEvents();
    if (view === 'participation') loadParticipation();
}

async function loadDashboard() {
    try {
        const [volunteers, events, participations] = await Promise.all([
            api.get('/api/volunteers'),
            api.get('/api/events'),
            api.get('/api/participations'),
        ]);
        document.getElementById('stat-volunteers').textContent = volunteers.length;
        document.getElementById('stat-events').textContent = events.length;
        document.getElementById('stat-participation').textContent = participations.length;
        const participants = events.reduce((sum, e) => sum + (e.participants || []).length, 0);
        document.getElementById('stat-participants').textContent = participants;

        const list = document.getElementById('dashboard-events');
        if (!events.length) {
            list.innerHTML = '<p class="muted">No events yet. Create one in the Events section.</p>';
        } else {
            list.innerHTML = events.map((e) => `
                <p><strong>${escapeHtml(e.title)}</strong> — ${escapeHtml(e.date)} · ${escapeHtml(e.location)} · ${(e.participants || []).length} volunteer(s)</p>
            `).join('');
        }
    } catch (err) {
        toast(err.message, true);
    }
}

async function loadVolunteers() {
    try {
        const volunteers = await api.get('/api/volunteers');
        const tbody = document.getElementById('volunteers-tbody');
        if (!volunteers.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="muted">No volunteers yet.</td></tr>';
            return;
        }
        tbody.innerHTML = volunteers.map((v) => {
            const status = `<span class="status status-${v.status}">${escapeHtml(v.status)}</span>`;
            const actions = v.status === 'pending'
                ? `<button class="btn btn-sm btn-edit" onclick="setVolunteerStatus(${v.id}, 'approved')">Approve</button>
                   <button class="btn btn-sm btn-del" onclick="setVolunteerStatus(${v.id}, 'rejected')">Reject</button>`
                : `<button class="btn btn-sm btn-edit" onclick="openVolunteerModal(${v.id})">Edit</button>`;
            return `
            <tr>
                <td>${v.id}</td>
                <td>${escapeHtml(v.name)}</td>
                <td>${escapeHtml(v.email)}</td>
                <td>${(v.skills || []).map(escapeHtml).join(', ') || '—'}</td>
                <td>${status}</td>
                <td>${actions}
                    <button class="btn btn-sm btn-del" onclick="deleteVolunteer(${v.id})">Delete</button>
                </td>
            </tr>
        `;
        }).join('');
    } catch (err) {
        toast(err.message, true);
    }
}

async function setVolunteerStatus(id, status) {
    try {
        await api.put(`/api/volunteers/${id}`, { status });
        toast(`Volunteer ${status}`);
        loadVolunteers();
        loadDashboard();
    } catch (err) {
        toast(err.message, true);
    }
}

async function openVolunteerModal(id = null) {
    let volunteer = { name: '', email: '', skills: '' };
    if (id) {
        volunteer = await api.get(`/api/volunteers/${id}`);
        volunteer.skills = (volunteer.skills || []).join(', ');
    }
    openModal(id ? 'Edit Volunteer' : 'Add Volunteer', `
        <label>Name</label>
        <input id="v-name" value="${escapeHtml(volunteer.name)}" placeholder="Full name">
        <label>Email</label>
        <input id="v-email" type="email" value="${escapeHtml(volunteer.email)}" placeholder="Email">
        <label>Skills (comma separated)</label>
        <input id="v-skills" value="${escapeHtml(volunteer.skills)}" placeholder="e.g. cooking, first aid">
        <button class="btn btn-primary" onclick="saveVolunteer(${id || 'null'})">Save</button>
    `);
}

async function saveVolunteer(id) {
    const body = {
        name: document.getElementById('v-name').value.trim(),
        email: document.getElementById('v-email').value.trim(),
        skills: document.getElementById('v-skills').value.split(',').map((s) => s.trim()).filter(Boolean),
    };
    if (!body.name || !body.email) {
        toast('Name and email are required', true);
        return;
    }
    try {
        if (id) {
            await api.put(`/api/volunteers/${id}`, body);
            toast('Volunteer updated');
        } else {
            await api.post('/api/volunteers', { ...body, status: 'approved' });
            toast('Volunteer added');
        }
        closeModal();
        loadVolunteers();
        loadDashboard();
    } catch (err) {
        toast(err.message, true);
    }
}

async function deleteVolunteer(id) {
    if (!confirm('Delete this volunteer?')) return;
    try {
        await api.del(`/api/volunteers/${id}`);
        toast('Volunteer deleted');
        loadVolunteers();
        loadDashboard();
    } catch (err) {
        toast(err.message, true);
    }
}

async function loadEvents() {
    try {
        const events = await api.get('/api/events');
        const tbody = document.getElementById('events-tbody');
        if (!events.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="muted">No events yet.</td></tr>';
            return;
        }
        tbody.innerHTML = events.map((e) => `
            <tr>
                <td>${e.id}</td>
                <td>${escapeHtml(e.title)}</td>
                <td>${escapeHtml(e.date)}</td>
                <td>${escapeHtml(e.location)}</td>
                <td>${(e.participants || []).length}</td>
                <td>
                    <button class="btn btn-sm btn-view" onclick="viewParticipants(${e.id})">Participants</button>
                    <button class="btn btn-sm btn-edit" onclick="openEventModal(${e.id})">Edit</button>
                    <button class="btn btn-sm btn-del" onclick="deleteEvent(${e.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        toast(err.message, true);
    }
}

async function openEventModal(id = null) {
    let event = { title: '', date: '', location: '', description: '' };
    if (id) event = await api.get(`/api/events/${id}`);
    openModal(id ? 'Edit Event' : 'Create Event', `
        <label>Title</label>
        <input id="e-title" value="${escapeHtml(event.title)}" placeholder="Event title">
        <label>Date</label>
        <input id="e-date" type="date" value="${escapeHtml(event.date)}">
        <label>Location</label>
        <input id="e-location" value="${escapeHtml(event.location)}" placeholder="Location">
        <label>Description</label>
        <textarea id="e-description" rows="3" placeholder="Description">${escapeHtml(event.description)}</textarea>
        <button class="btn btn-primary" onclick="saveEvent(${id || 'null'})">Save</button>
    `);
}

async function saveEvent(id) {
    const body = {
        title: document.getElementById('e-title').value.trim(),
        date: document.getElementById('e-date').value,
        location: document.getElementById('e-location').value.trim(),
        description: document.getElementById('e-description').value.trim(),
    };
    if (!body.title || !body.date) {
        toast('Title and date are required', true);
        return;
    }
    try {
        if (id) {
            await api.put(`/api/events/${id}`, body);
            toast('Event updated');
        } else {
            await api.post('/api/events', body);
            toast('Event created');
        }
        closeModal();
        loadEvents();
        loadDashboard();
    } catch (err) {
        toast(err.message, true);
    }
}

async function deleteEvent(id) {
    if (!confirm('Delete this event?')) return;
    try {
        await api.del(`/api/events/${id}`);
        toast('Event deleted');
        loadEvents();
        loadDashboard();
    } catch (err) {
        toast(err.message, true);
    }
}

async function viewParticipants(eventId) {
    try {
        const [participants, volunteers] = await Promise.all([
            api.get(`/api/events/${eventId}/participants`),
            api.get('/api/volunteers'),
        ]);
        const available = volunteers.filter(
            (v) => !participants.some((p) => p.volunteerId === v.id)
        );
        const options = available.map(
            (v) => `<option value="${v.id}">${escapeHtml(v.name)} (${escapeHtml(v.email)})</option>`
        ).join('');
        const rows = participants.length
            ? participants.map((p) => `
                <tr><td>${p.name}</td><td>${escapeHtml(p.email)}</td><td>${p.volunteerId}</td></tr>
              `).join('')
            : '<tr><td colspan="3" class="muted">No participants yet.</td></tr>';
        openModal('Event Participants', `
            <div class="card-head"><h2 style="margin:0">Add volunteer</h2></div>
            <div style="display:flex;gap:8px;margin-bottom:16px">
                <select id="reg-volunteer" style="flex:1">${options || '<option value="">No volunteers available</option>'}</select>
                <button class="btn btn-primary" onclick="registerVolunteer(${eventId})">Register</button>
            </div>
            <table class="table">
                <thead><tr><th>Name</th><th>Email</th><th>Volunteer ID</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `);
    } catch (err) {
        toast(err.message, true);
    }
}

async function registerVolunteer(eventId) {
    const select = document.getElementById('reg-volunteer');
    if (!select.value) return;
    try {
        await api.post(`/api/events/${eventId}/register`, { volunteerId: Number(select.value) });
        toast('Volunteer registered');
        viewParticipants(eventId);
        loadEvents();
    } catch (err) {
        toast(err.message, true);
    }
}

async function loadParticipation() {
    try {
        const [events, volunteers, records] = await Promise.all([
            api.get('/api/events'),
            api.get('/api/volunteers'),
            api.get('/api/participations'),
        ]);
        document.getElementById('part-event').innerHTML =
            '<option value="">Select event</option>' +
            events.map((e) => `<option value="${e.id}">${escapeHtml(e.title)}</option>`).join('');
        document.getElementById('part-volunteer').innerHTML =
            '<option value="">Select volunteer</option>' +
            volunteers.map((v) => `<option value="${v.id}">${escapeHtml(v.name)}</option>`).join('');

        const tbody = document.getElementById('participation-tbody');
        if (!records.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="muted">No participation records yet.</td></tr>';
            return;
        }
        tbody.innerHTML = records.map((r) => `
            <tr>
                <td>${r.id}</td>
                <td>${escapeHtml(r.eventTitle)}</td>
                <td>${escapeHtml(r.volunteerName)}</td>
                <td><span class="status status-${r.status}">${escapeHtml(r.status)}</span></td>
                <td>${new Date(r.date).toLocaleString()}</td>
            </tr>
        `).join('');
    } catch (err) {
        toast(err.message, true);
    }
}

document.getElementById('participation-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await api.post('/api/participations', {
            eventId: Number(document.getElementById('part-event').value),
            volunteerId: Number(document.getElementById('part-volunteer').value),
            status: document.getElementById('part-status').value,
        });
        toast('Participation recorded');
        loadParticipation();
        loadDashboard();
    } catch (err) {
        toast(err.message, true);
    }
});

loadDashboard();
