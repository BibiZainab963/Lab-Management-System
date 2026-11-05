const state = { equipment: [], users: [], issues: [] };

const $ = (id) => document.getElementById(id);
const toast = (message, ok=true) => {
  const el = $('toast'); el.textContent = message; el.className = 'toast show';
  if (!ok) el.style.borderColor = 'rgba(220,100,120,.45)';
  setTimeout(() => { el.className = 'toast'; el.style.borderColor = ''; }, 2600);
};

async function api(url, options={}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
}

function go(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  $(page + 'Page').classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  $('pageTitle').textContent = page === 'home' ? 'Overview' : page === 'issues' ? 'Issue Records' : page[0].toUpperCase()+page.slice(1);
  window.scrollTo({top:0, behavior:'smooth'});
}

document.querySelectorAll('[data-page]').forEach(b => b.addEventListener('click', () => go(b.dataset.page)));
document.querySelectorAll('[data-page-jump]').forEach(b => b.addEventListener('click', () => go(b.dataset.pageJump)));

async function refreshAll() {
  try {
    const [dash, equipment, users, issues] = await Promise.all([
      api('/api/dashboard'), api('/api/equipment'), api('/api/users'), api('/api/issues')
    ]);
    Object.assign(state, {equipment, users, issues});
    updateDashboard(dash);
    renderEquipment(); renderUsers(); renderIssues();
    populateIssueForm();
    toast('Dashboard synced with MySQL');
  } catch (e) { toast('Database connection error: ' + e.message, false); }
}

function updateDashboard(d) {
  $('totalEquipment').textContent = d.equipment.total_equipment;
  $('availableUnits').textContent = d.equipment.available_units;
  $('activeIssues').textContent = d.issues.active_issues;
  $('totalUsers').textContent = d.users.total_users;

  const total = Number(d.equipment.total_units || 0);
  const available = Number(d.equipment.available_units || 0);
  const issued = Math.max(total - available, 0);
  const pct = total ? Math.round(available/total*100) : 0;
  $('availabilityPct').textContent = pct + '%';
  $('availableLegend').textContent = available;
  $('issuedLegend').textContent = issued;
  $('damagedLegend').textContent = d.equipment.damaged_items;
  const deg = pct * 3.6;
  document.querySelector('.donut').style.background =
    `conic-gradient(#19bca9 0deg ${deg}deg, #dca94f ${deg}deg ${Math.min(deg+45,360)}deg, #15373a ${Math.min(deg+45,360)}deg 360deg)`;
}

function badge(status) {
  const cls = String(status).toLowerCase();
  return `<span class="badge ${cls}">${status}</span>`;
}

function renderEquipment() {
  const q = ($('equipmentSearch')?.value || '').toLowerCase();
  const status = $('equipmentStatus')?.value || '';
  const rows = state.equipment.filter(e =>
    (!q || `${e.name} ${e.category}`.toLowerCase().includes(q)) &&
    (!status || e.status === status)
  );
  $('equipmentTable').innerHTML = rows.length ? rows.map(e => `
    <tr>
      <td>#${e.equipment_id}</td><td><b>${escapeHtml(e.name)}</b></td>
      <td>${escapeHtml(e.category)}</td><td>${e.quantity}</td><td>${e.available_quantity}</td>
      <td>${badge(e.status)}</td>
      <td><button class="small-btn danger" onclick="deleteEquipment(${e.equipment_id})">Delete</button></td>
    </tr>`).join('') : emptyRow(7, 'No equipment found');
}

function renderUsers() {
  const q = ($('userSearch')?.value || '').toLowerCase();
  const rows = state.users.filter(u => !q || `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q));
  $('usersGrid').innerHTML = rows.length ? rows.map(u => `
    <article class="user-card">
      <div class="user-top"><div class="user-avatar">${initials(u.name)}</div>${badgeRole(u.role)}</div>
      <h3>${escapeHtml(u.name)}</h3><p>${escapeHtml(u.email)}</p>
    </article>`).join('') : `<div class="panel">No users found.</div>`;
}

function badgeRole(role){ return `<span class="role">${escapeHtml(role)}</span>`; }

function renderIssues() {
  const q = ($('issueSearch')?.value || '').toLowerCase();
  const status = $('issueStatus')?.value || '';
  const rows = state.issues.filter(i =>
    (!q || `${i.equipment_name} ${i.user_name} ${i.status}`.toLowerCase().includes(q)) &&
    (!status || i.status === status)
  );
  $('issuesTable').innerHTML = rows.length ? rows.map(i => `
    <tr>
      <td>#${i.issue_id}</td><td>${escapeHtml(i.equipment_name)}</td>
      <td>${escapeHtml(i.user_name)}</td><td>${formatDate(i.issue_date)}</td>
      <td>${i.return_date ? formatDate(i.return_date) : '—'}</td><td>${i.quantity}</td>
      <td>${badge(i.status)}</td>
      <td>${i.status !== 'Returned' ? `<button class="small-btn" onclick="returnIssue(${i.issue_id})">Mark Returned</button>` : '<span style="color:#58706e">Completed</span>'}</td>
    </tr>`).join('') : emptyRow(8, 'No issue records found');
}

function emptyRow(cols, text){ return `<tr><td colspan="${cols}" style="text-align:center;color:#5e7775;padding:35px">${text}</td></tr>`; }
function escapeHtml(s){return String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function initials(s){ return String(s).split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase(); }
function formatDate(d){ return d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'; }

function openModal(id){ $(id).classList.remove('hidden'); }
function closeModal(id){ $(id).classList.add('hidden'); }

$('equipmentForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const data = Object.fromEntries(new FormData(e.target));
    await api('/api/equipment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    e.target.reset(); closeModal('equipmentModal'); await refreshAll(); go('equipment'); toast('Equipment added successfully');
  } catch(err){ toast(err.message,false); }
});

$('userForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const data = Object.fromEntries(new FormData(e.target));
    await api('/api/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    e.target.reset(); closeModal('userModal'); await refreshAll(); go('users'); toast('User created successfully');
  } catch(err){ toast(err.message,false); }
});

async function deleteEquipment(id){
  if(!confirm('Delete this equipment? It cannot be deleted if issue records reference it.')) return;
  try { await api('/api/equipment/'+id,{method:'DELETE'}); await refreshAll(); toast('Equipment deleted'); }
  catch(err){ toast(err.message,false); }
}

function openIssueModal(){
  populateIssueForm(); $('issueModal').classList.remove('hidden');
  $('issueForm').querySelector('[name="issue_date"]').value = new Date().toISOString().slice(0,10);
}

function populateIssueForm(){
  $('equipmentSelect').innerHTML = state.equipment
    .filter(e => e.available_quantity > 0)
    .map(e => `<option value="${e.equipment_id}">${escapeHtml(e.name)} — ${e.available_quantity} available</option>`).join('');
  $('userSelect').innerHTML = state.users
    .map(u => `<option value="${u.user_id}">${escapeHtml(u.name)} (${escapeHtml(u.role)})</option>`).join('');
}

$('issueForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const data = Object.fromEntries(new FormData(e.target));
    data.quantity = Number(data.quantity);
    await api('/api/issues',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    e.target.reset(); closeModal('issueModal'); await refreshAll(); go('issues'); toast('Issue record created');
  } catch(err){ toast(err.message,false); }
});

async function returnIssue(id){
  try { await api('/api/issues/'+id+'/return',{method:'PATCH'}); await refreshAll(); toast('Equipment marked as returned'); }
  catch(err){ toast(err.message,false); }
}

refreshAll();
