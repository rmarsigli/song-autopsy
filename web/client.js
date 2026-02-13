const form = document.getElementById('reviewForm');
const submitBtn = document.getElementById('submitBtn');
const clearBtn = document.getElementById('clearBtn');
const status = document.getElementById('status');
const cynicismSlider = document.getElementById('cynicism');
const cynicismValue = document.getElementById('cynicismValue');

let artists = [];
let albums = [];

async function loadData() {
  try {
    const [artistsRes, albumsRes] = await Promise.all([
      fetch('/api/artists'),
      fetch('/api/albums')
    ]);
    artists = await artistsRes.json();
    albums = await albumsRes.json();
  } catch (error) {
    console.error('Failed to load autocomplete data:', error);
  }
}

function setupAutocomplete(input, data) {
  const container = input.parentElement;
  let list = container.querySelector('.autocomplete-list');
  
  if (!list) {
    list = document.createElement('div');
    list.className = 'autocomplete-list';
    container.appendChild(list);
  }

  input.addEventListener('input', (e) => {
    const value = e.target.value.toLowerCase();
    list.innerHTML = '';
    
    if (!value) {
      list.classList.remove('show');
      return;
    }

    const filtered = data.filter(item => 
      item.toLowerCase().includes(value)
    ).slice(0, 10);

    if (filtered.length === 0) {
      list.classList.remove('show');
      return;
    }

    filtered.forEach(item => {
      const div = document.createElement('div');
      div.className = 'autocomplete-item';
      div.textContent = item;
      div.addEventListener('click', () => {
        input.value = item;
        list.classList.remove('show');
      });
      list.appendChild(div);
    });

    list.classList.add('show');
  });

  input.addEventListener('blur', () => {
    setTimeout(() => list.classList.remove('show'), 200);
  });
}

loadData().then(() => {
  setupAutocomplete(document.getElementById('artist'), artists);
  setupAutocomplete(document.getElementById('album'), albums);
});

// Update cynicism value display
cynicismSlider.addEventListener('input', (e) => {
  cynicismValue.textContent = e.target.value;
});

// Clear form
clearBtn.addEventListener('click', () => {
  form.reset();
  cynicismValue.textContent = '5';
  hideStatus();
});

// Form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(form);
  const data = {
    artist: formData.get('artist'),
    song: formData.get('song'),
    album: formData.get('album') || undefined,
    language: formData.get('language'),
    cynicism: parseInt(formData.get('cynicism')),
    lyrics: formData.get('lyrics'),
  };
  
  // Validate
  if (!data.artist || !data.song || !data.lyrics) {
    showError('Please fill in all required fields (Artist, Song, Lyrics)');
    return;
  }
  
  if (data.lyrics.trim().length < 10) {
    showError('Lyrics seem too short. Please paste the full song lyrics.');
    return;
  }
  
  // Disable form
  submitBtn.disabled = true;
  clearBtn.disabled = true;
  Array.from(form.elements).forEach(el => el.disabled = true);
  
  // Show progress
  showProgress();
  
  try {
    const response = await fetch('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      showSuccess(result);
      form.reset();
      cynicismValue.textContent = '5';
    } else {
      showError(result.error || 'Unknown error occurred', result.details);
    }
  } catch (error) {
    showError('Network error: ' + error.message);
  } finally {
    // Re-enable form
    submitBtn.disabled = false;
    clearBtn.disabled = false;
    Array.from(form.elements).forEach(el => el.disabled = false);
  }
});

function showProgress() {
  status.className = 'loading show';
  status.innerHTML = `
    <div class="status-header">
      <span class="spinner"></span>
      <span>Generating Review...</span>
    </div>
    <div class="progress-steps">
      <div class="progress-step active" id="step1">Calling AI model</div>
      <div class="progress-step" id="step2">Analyzing lyrics</div>
      <div class="progress-step" id="step3">Processing review</div>
      <div class="progress-step" id="step4">Creating files</div>
    </div>
  `;
  
  // Simulate progress steps
  setTimeout(() => updateStep('step2', 'step1'), 2000);
  setTimeout(() => updateStep('step3', 'step2'), 8000);
  setTimeout(() => updateStep('step4', 'step3'), 12000);
}

function updateStep(current, previous) {
  const prevEl = document.getElementById(previous);
  const currEl = document.getElementById(current);
  if (prevEl) {
    prevEl.classList.remove('active');
    prevEl.classList.add('done');
  }
  if (currEl) {
    currEl.classList.add('active');
  }
}

function showSuccess(result) {
  status.className = 'success show';
  status.innerHTML = `
    <div class="status-header">✓ Review Created Successfully!</div>
    <p>File saved to: <span class="filepath">${result.filepath}</span></p>
    <p style="margin-top: 0.5rem;">
      <strong>${result.artist}</strong> - <strong>${result.song}</strong>
      ${result.album ? '(Album: ' + result.album + ')' : ''}
    </p>
  `;
}

function showError(message, details) {
  status.className = 'error show';
  let html = `
    <div class="status-header">✗ Error</div>
    <p>${message}</p>
  `;
  if (details) {
    html += `<div class="error-details">${details}</div>`;
  }
  status.innerHTML = html;
}

function hideStatus() {
  status.className = '';
}
