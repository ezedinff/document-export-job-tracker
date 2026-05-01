const createForm = document.getElementById('create-job-form');
const nameInput = document.getElementById('job-name');
const createError = document.getElementById('create-error');
const refreshButton = document.getElementById('refresh-button');
const jobsTable = document.getElementById('jobs-table');
const jobsBody = document.getElementById('jobs-body');
const emptyState = document.getElementById('list-empty');

async function apiRequest(path, method = 'GET', body) {
  const response = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    let message = `${response.status}`;
    try {
      const json = await response.json();
      message = json.error || message;
    } catch {
      // no-op: keep fallback message
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
}

function makeActionButton(label, className, onClick) {
  const button = document.createElement('button');
  button.textContent = label;
  if (className) {
    button.classList.add(className);
  }
  button.addEventListener('click', onClick);
  return button;
}

async function runTransition(id, action) {
  try {
    await apiRequest(`/api/exports/${id}/${action}`, 'POST');
    await loadJobs();
  } catch (error) {
    alert(`Action failed: ${error.message}`);
  }
}

function renderRows(jobs) {
  jobsBody.innerHTML = '';
  jobs.forEach((job) => {
    const tr = document.createElement('tr');

    const idTd = document.createElement('td');
    idTd.textContent = String(job.id);
    tr.appendChild(idTd);

    const nameTd = document.createElement('td');
    nameTd.textContent = job.name;
    tr.appendChild(nameTd);

    const statusTd = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.textContent = job.status;
    statusBadge.classList.add('status-badge', `status-${job.status}`);
    statusBadge.setAttribute('data-testid', `status-badge-${job.id}`);
    statusTd.appendChild(statusBadge);
    tr.appendChild(statusTd);

    const csvTd = document.createElement('td');
    if (job.status === 'completed') {
      const link = document.createElement('a');
      link.href = `/api/exports/${job.id}/download`;
      link.textContent = 'Download CSV';
      link.title = `export-job-${job.id}.csv`;
      link.setAttribute('data-testid', `download-link-${job.id}`);
      csvTd.appendChild(link);
    } else {
      const none = document.createElement('span');
      none.textContent = '—';
      none.classList.add('muted');
      csvTd.appendChild(none);
    }
    tr.appendChild(csvTd);

    const actionsTd = document.createElement('td');
    const actionWrap = document.createElement('div');
    actionWrap.classList.add('actions');

    if (job.status === 'queued') {
      actionWrap.appendChild(makeActionButton('Start', '', () => runTransition(job.id, 'start')));
    }
    if (job.status === 'processing') {
      actionWrap.appendChild(makeActionButton('Complete', 'secondary', () => runTransition(job.id, 'complete')));
      actionWrap.appendChild(makeActionButton('Fail', 'fail', () => runTransition(job.id, 'fail')));
    }
    if (job.status === 'failed') {
      const none = document.createElement('span');
      none.textContent = '—';
      none.classList.add('muted');
      actionWrap.appendChild(none);
    }
    if (job.status === 'completed') {
      const none = document.createElement('span');
      none.textContent = '—';
      none.classList.add('muted');
      actionWrap.appendChild(none);
    }

    actionsTd.appendChild(actionWrap);
    tr.appendChild(actionsTd);
    jobsBody.appendChild(tr);
  });
}

async function loadJobs() {
  const jobs = await apiRequest('/api/exports');
  if (jobs.length === 0) {
    jobsTable.hidden = true;
    emptyState.hidden = false;
    return;
  }

  jobsTable.hidden = false;
  emptyState.hidden = true;
  renderRows(jobs);
}

createForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  createError.textContent = '';
  try {
    await apiRequest('/api/exports', 'POST', { name: nameInput.value });
    nameInput.value = '';
    await loadJobs();
  } catch (error) {
    createError.textContent = error.message;
  }
});

refreshButton.addEventListener('click', () => {
  loadJobs().catch((error) => alert(error.message));
});

loadJobs().catch((error) => {
  createError.textContent = error.message;
});
