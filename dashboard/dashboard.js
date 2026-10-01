/**
 * Studio CMS Dashboard Logic — Janette Amoatemaa Sarfo Portfolio
 * Manages full CRUD operations for elements, pictures, sections, and text.
 * Real-time sync with localStorage and JSON download/import.
 */

document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'jay_portfolio_data';
  const CONVEX_CLOUD_URL = 'https://rightful-mandrill-291.convex.cloud';
  const CONVEX_SITE_URL = 'https://rightful-mandrill-291.convex.site';
  let portfolioData = null;

  async function fetchFromConvex() {
    try {
      const res = await fetch(`${CONVEX_SITE_URL}/get-portfolio`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) return json.data;
      }
    } catch (_) {}

    try {
      const res = await fetch(`${CONVEX_CLOUD_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'portfolio:get', args: {} })
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.value) return json.value;
      }
    } catch (_) {}

    return null;
  }

  async function saveToConvex(data) {
    let saved = false;
    try {
      const res = await fetch(`${CONVEX_SITE_URL}/save-portfolio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });
      if (res.ok) saved = true;
    } catch (_) {}

    try {
      const res = await fetch(`${CONVEX_CLOUD_URL}/api/mutation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'portfolio:save', args: { data } })
      });
      if (res.ok) saved = true;
    } catch (_) {}

    return saved;
  }

  // --------------------------------------------------------------------------
  // 1. Toast Notification Helper
  // --------------------------------------------------------------------------
  const dashToast = document.getElementById('dashToast');
  let toastTimer = null;

  function showToast(message) {
    if (!dashToast) return;
    dashToast.textContent = message;
    dashToast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      dashToast.classList.remove('show');
    }, 3800);
  }

  // --------------------------------------------------------------------------
  // 2. Data Loader
  // --------------------------------------------------------------------------
  async function loadPortfolioData() {
    const statusIndicator = document.getElementById('saveStatusIndicator');
    try {
      const convexData = await fetchFromConvex();
      if (convexData) {
        portfolioData = convexData;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolioData));
        if (statusIndicator) {
          statusIndicator.innerHTML = '<span class="status-dot-green"></span> Connected to Convex Cloud';
        }
        initDashboard();
        return;
      }
    } catch (e) {
      console.warn('Convex fetch bypassed:', e);
    }

    const localSaved = localStorage.getItem(STORAGE_KEY);
    if (localSaved) {
      try {
        portfolioData = JSON.parse(localSaved);
        initDashboard();
        return;
      } catch (e) {
        console.error('Error parsing localStorage portfolio data:', e);
      }
    }

    try {
      const res = await fetch('../data/portfolio-data.json');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      portfolioData = await res.json();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolioData));
      initDashboard();
    } catch (err) {
      console.error('Failed to load portfolio-data.json:', err);
      showToast('Could not load portfolio data. Check console.');
    }
  }

  // --------------------------------------------------------------------------
  // 3. Tab Switching
  // --------------------------------------------------------------------------
  const navItems = document.querySelectorAll('.dash-nav-item');
  const panels = document.querySelectorAll('.dash-panel');
  const currentSectionTitle = document.getElementById('currentSectionTitle');

  const tabTitles = {
    general: 'General & Profile Settings',
    hero: 'Hero Section & Portrait Picture',
    about: 'About Section & Creative Pillars',
    projects: 'Selected Works & Case Studies',
    philosophy: 'Philosophy & Methodology',
    credentials: 'Background, Education & Skills',
    visibility: 'Section Visibility Controls'
  };

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      navItems.forEach(n => n.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      item.classList.add('active');
      const targetPanel = document.getElementById(`panel-${tabId}`);
      if (targetPanel) targetPanel.classList.add('active');

      if (currentSectionTitle && tabTitles[tabId]) {
        currentSectionTitle.textContent = tabTitles[tabId];
      }
    });
  });

  // --------------------------------------------------------------------------
  // 4. Initialize Dashboard Fields
  // --------------------------------------------------------------------------
  function initDashboard() {
    if (!portfolioData) return;

    // A. General
    document.getElementById('brandNameInput').value = portfolioData.general?.brandName || '';
    document.getElementById('brandMonogramInput').value = portfolioData.general?.brandMonogram || '';
    document.getElementById('roleTagInput').value = portfolioData.general?.roleTag || '';
    document.getElementById('contactEmailInput').value = portfolioData.general?.contactEmail || '';
    document.getElementById('locationInput').value = portfolioData.general?.location || '';
    document.getElementById('availabilityTextInput').value = portfolioData.general?.availabilityText || '';
    document.getElementById('isAvailableSelect').value = portfolioData.general?.isAvailable !== false ? 'true' : 'false';
    renderSocialsList();

    // B. Hero
    document.getElementById('heroBadgeInput').value = portfolioData.hero?.badgeText || '';
    document.getElementById('heroHeadlineInput').value = portfolioData.hero?.headline || '';
    document.getElementById('heroLeadInput').value = portfolioData.hero?.leadText || '';
    
    const heroImgPath = portfolioData.hero?.portraitImage || 'assets/images/janette-portrait.jpg';
    document.getElementById('heroPortraitUrlInput').value = heroImgPath;
    updateHeroPreview(heroImgPath);

    document.getElementById('floatingSubInput').value = portfolioData.hero?.floatingBadge?.subtitle || '';
    document.getElementById('floatingTitleInput').value = portfolioData.hero?.floatingBadge?.title || '';
    document.getElementById('marqueeItemsInput').value = (portfolioData.hero?.marqueeItems || []).join(', ');
    renderMetricsList();

    // C. About
    document.getElementById('aboutEyebrowInput').value = portfolioData.about?.eyebrow || '';
    document.getElementById('aboutBadgeInput').value = portfolioData.about?.profileBadge || '';
    document.getElementById('aboutTitleInput').value = portfolioData.about?.title || '';
    document.getElementById('aboutSubtitleInput').value = portfolioData.about?.subtitle || '';
    document.getElementById('aboutHeadlineInput').value = portfolioData.about?.headline || '';
    document.getElementById('aboutBio1Input').value = portfolioData.about?.bioParagraphs?.[0] || '';
    document.getElementById('aboutBio2Input').value = portfolioData.about?.bioParagraphs?.[1] || '';
    renderValuesList();
    renderPillarsList();

    // D. Projects
    renderProjectsList();

    // E. Philosophy
    document.getElementById('philTitleInput').value = portfolioData.philosophy?.title || '';
    document.getElementById('philSubtitleInput').value = portfolioData.philosophy?.subtitle || '';
    document.getElementById('manifestoLabelInput').value = portfolioData.philosophy?.manifesto?.label || '';
    document.getElementById('manifestoQuoteInput').value = portfolioData.philosophy?.manifesto?.quote || '';
    document.getElementById('manifestoAuthorInput').value = portfolioData.philosophy?.manifesto?.author || '';
    renderProcessSteps();

    // F. Credentials
    renderTimelineList();
    renderSkillGroups();

    // G. Visibility
    const vis = portfolioData.sectionsVisibility || {};
    document.getElementById('toggleHero').checked = vis.hero !== false;
    document.getElementById('toggleAbout').checked = vis.about !== false;
    document.getElementById('toggleWork').checked = vis.work !== false;
    document.getElementById('togglePhilosophy').checked = vis.philosophy !== false;
    document.getElementById('toggleCredentials').checked = vis.credentials !== false;
    document.getElementById('toggleContact').checked = vis.contact !== false;
  }

  // --------------------------------------------------------------------------
  // 5. Image Upload & Preview Helper
  // --------------------------------------------------------------------------
  function updateHeroPreview(src) {
    const preview = document.getElementById('heroPortraitPreview');
    if (!preview) return;
    if (src.startsWith('assets/') || src.startsWith('data/')) {
      preview.src = `../${src}`;
    } else {
      preview.src = src;
    }
  }

  const heroPortraitFileInput = document.getElementById('heroPortraitFileInput');
  const heroPortraitUrlInput = document.getElementById('heroPortraitUrlInput');

  heroPortraitFileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target.result;
        heroPortraitUrlInput.value = base64Url;
        updateHeroPreview(base64Url);
        showToast('Hero portrait uploaded into preview.');
      };
      reader.readAsDataURL(file);
    }
  });

  heroPortraitUrlInput?.addEventListener('input', (e) => {
    updateHeroPreview(e.target.value.trim());
  });

  document.querySelectorAll('.preset-hero-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const src = btn.getAttribute('data-src');
      heroPortraitUrlInput.value = src;
      updateHeroPreview(src);
      showToast('Set to preset portrait.');
    });
  });

  // --------------------------------------------------------------------------
  // 6. Socials Repeater
  // --------------------------------------------------------------------------
  const socialsListContainer = document.getElementById('socialsListContainer');
  const addSocialBtn = document.getElementById('addSocialBtn');

  function renderSocialsList() {
    if (!socialsListContainer) return;
    const socials = portfolioData.general?.socials || [];
    socialsListContainer.innerHTML = '';

    socials.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'repeater-item';
      div.innerHTML = `
        <div class="repeater-item-header">
          <span class="repeater-badge">Channel #${index + 1}</span>
          <button type="button" class="repeater-delete-btn" data-index="${index}">Delete</button>
        </div>
        <div class="form-grid-2">
          <div class="dash-form-group">
            <label class="dash-label">Channel Name</label>
            <input type="text" class="dash-input social-name-input" value="${item.name || ''}" placeholder="e.g. LinkedIn">
          </div>
          <div class="dash-form-group">
            <label class="dash-label">URL Link</label>
            <input type="text" class="dash-input social-url-input" value="${item.url || ''}" placeholder="https://...">
          </div>
        </div>
      `;
      div.querySelector('.repeater-delete-btn').addEventListener('click', () => {
        portfolioData.general.socials.splice(index, 1);
        renderSocialsList();
      });
      socialsListContainer.appendChild(div);
    });
  }

  addSocialBtn?.addEventListener('click', () => {
    if (!portfolioData.general) portfolioData.general = {};
    if (!portfolioData.general.socials) portfolioData.general.socials = [];
    portfolioData.general.socials.push({ name: 'New Link', url: 'https://' });
    renderSocialsList();
  });

  // --------------------------------------------------------------------------
  // 7. Hero Metrics Repeater
  // --------------------------------------------------------------------------
  const metricsListContainer = document.getElementById('metricsListContainer');
  const addMetricBtn = document.getElementById('addMetricBtn');

  function renderMetricsList() {
    if (!metricsListContainer) return;
    const metrics = portfolioData.hero?.metrics || [];
    metricsListContainer.innerHTML = '';

    metrics.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'repeater-item';
      div.innerHTML = `
        <div class="repeater-item-header">
          <span class="repeater-badge">Metric #${index + 1}</span>
          <button type="button" class="repeater-delete-btn" data-index="${index}">Delete</button>
        </div>
        <div class="form-grid-2">
          <div class="dash-form-group">
            <label class="dash-label">Stat Value</label>
            <input type="text" class="dash-input metric-val-input" value="${item.value || ''}" placeholder="e.g. 15k+">
          </div>
          <div class="dash-form-group">
            <label class="dash-label">Label Description</label>
            <input type="text" class="dash-input metric-lbl-input" value="${item.label || ''}" placeholder="e.g. Students Impacted">
          </div>
        </div>
      `;
      div.querySelector('.repeater-delete-btn').addEventListener('click', () => {
        portfolioData.hero.metrics.splice(index, 1);
        renderMetricsList();
      });
      metricsListContainer.appendChild(div);
    });
  }

  addMetricBtn?.addEventListener('click', () => {
    if (!portfolioData.hero) portfolioData.hero = {};
    if (!portfolioData.hero.metrics) portfolioData.hero.metrics = [];
    portfolioData.hero.metrics.push({ value: '100%', label: 'Metric Description' });
    renderMetricsList();
  });

  // --------------------------------------------------------------------------
  // 8. About Values Repeater
  // --------------------------------------------------------------------------
  const valuesListContainer = document.getElementById('valuesListContainer');
  const addValueBtn = document.getElementById('addValueBtn');

  function renderValuesList() {
    if (!valuesListContainer) return;
    const values = portfolioData.about?.values || [];
    valuesListContainer.innerHTML = '';

    values.forEach((val, index) => {
      const div = document.createElement('div');
      div.className = 'repeater-item';
      div.innerHTML = `
        <div class="repeater-item-header">
          <span class="repeater-badge">Value #${index + 1}</span>
          <button type="button" class="repeater-delete-btn" data-index="${index}">Delete</button>
        </div>
        <div class="form-grid-2">
          <div class="dash-form-group">
            <label class="dash-label">Number / Tag</label>
            <input type="text" class="dash-input val-num-input" value="${val.num || `0${index + 1}`}">
          </div>
          <div class="dash-form-group">
            <label class="dash-label">Value Title</label>
            <input type="text" class="dash-input val-title-input" value="${val.title || ''}">
          </div>
        </div>
        <div class="dash-form-group">
          <label class="dash-label">Description</label>
          <textarea class="dash-input dash-textarea val-desc-input" rows="2">${val.desc || ''}</textarea>
        </div>
      `;
      div.querySelector('.repeater-delete-btn').addEventListener('click', () => {
        portfolioData.about.values.splice(index, 1);
        renderValuesList();
      });
      valuesListContainer.appendChild(div);
    });
  }

  addValueBtn?.addEventListener('click', () => {
    if (!portfolioData.about) portfolioData.about = {};
    if (!portfolioData.about.values) portfolioData.about.values = [];
    portfolioData.about.values.push({
      num: `0${portfolioData.about.values.length + 1}`,
      title: 'New Value',
      desc: 'Description of the design value and intention.'
    });
    renderValuesList();
  });

  // --------------------------------------------------------------------------
  // 9. About Pillars Repeater
  // --------------------------------------------------------------------------
  const pillarsListContainer = document.getElementById('pillarsListContainer');
  const addPillarBtn = document.getElementById('addPillarBtn');

  function renderPillarsList() {
    if (!pillarsListContainer) return;
    const pillars = portfolioData.about?.pillars || [];
    pillarsListContainer.innerHTML = '';

    pillars.forEach((p, index) => {
      const div = document.createElement('div');
      div.className = 'repeater-item';
      div.innerHTML = `
        <div class="repeater-item-header">
          <span class="repeater-badge">Pillar #${index + 1} (${p.title || 'Untitled'})</span>
          <button type="button" class="repeater-delete-btn" data-index="${index}">Delete</button>
        </div>
        <div class="form-grid-2">
          <div class="dash-form-group">
            <label class="dash-label">Pillar Title</label>
            <input type="text" class="dash-input pillar-title-input" value="${p.title || ''}">
          </div>
          <div class="dash-form-group">
            <label class="dash-label">Subtitle</label>
            <input type="text" class="dash-input pillar-sub-input" value="${p.subtitle || ''}">
          </div>
        </div>
        <div class="dash-form-group">
          <label class="dash-label">Description</label>
          <textarea class="dash-input dash-textarea pillar-desc-input" rows="2">${p.desc || ''}</textarea>
        </div>
        <div class="dash-form-group">
          <label class="dash-label">Skills / Tags (Comma-separated)</label>
          <input type="text" class="dash-input pillar-tags-input" value="${(p.tags || []).join(', ')}">
        </div>
      `;
      div.querySelector('.repeater-delete-btn').addEventListener('click', () => {
        portfolioData.about.pillars.splice(index, 1);
        renderPillarsList();
      });
      pillarsListContainer.appendChild(div);
    });
  }

  addPillarBtn?.addEventListener('click', () => {
    if (!portfolioData.about) portfolioData.about = {};
    if (!portfolioData.about.pillars) portfolioData.about.pillars = [];
    portfolioData.about.pillars.push({
      id: `pillar-${Date.now()}`,
      type: 'periwinkle',
      title: 'New Pillar',
      subtitle: 'Sub-discipline area',
      desc: 'Describe this foundation pillar and how it reinforces your design process.',
      tags: ['Skill 1', 'Skill 2']
    });
    renderPillarsList();
  });

  // --------------------------------------------------------------------------
  // 10. Selected Works & Projects Management (Full CRUD)
  // --------------------------------------------------------------------------
  const projectsListContainer = document.getElementById('projectsListContainer');
  const projectCountBadge = document.getElementById('projectCountBadge');
  const addNewProjectBtn = document.getElementById('addNewProjectBtn');

  const projectEditorModal = document.getElementById('projectEditorModal');
  const closeProjectModalBtn = document.getElementById('closeProjectModalBtn');
  const cancelProjectBtn = document.getElementById('cancelProjectBtn');
  const projectForm = document.getElementById('projectForm');
  const projectModalTitle = document.getElementById('projectModalTitle');

  // Modal Fields
  const editProjectId = document.getElementById('editProjectId');
  const projNameInput = document.getElementById('projNameInput');
  const projClientInput = document.getElementById('projClientInput');
  const projCategorySelect = document.getElementById('projCategorySelect');
  const projCategoryLabelInput = document.getElementById('projCategoryLabelInput');
  const projRoleInput = document.getElementById('projRoleInput');
  const projTimelineInput = document.getElementById('projTimelineInput');
  const projDomainTagInput = document.getElementById('projDomainTagInput');
  const projTaglineInput = document.getElementById('projTaglineInput');

  const projImagePreview = document.getElementById('projImagePreview');
  const projImageFileInput = document.getElementById('projImageFileInput');
  const projImageUrlInput = document.getElementById('projImageUrlInput');

  const projAccentColorInput = document.getElementById('projAccentColorInput');
  const projAccentColorText = document.getElementById('projAccentColorText');
  const projPaletteDescInput = document.getElementById('projPaletteDescInput');

  const projStat1Val = document.getElementById('projStat1Val');
  const projStat1Lbl = document.getElementById('projStat1Lbl');
  const projStat2Val = document.getElementById('projStat2Val');
  const projStat2Lbl = document.getElementById('projStat2Lbl');
  const projStat3Val = document.getElementById('projStat3Val');
  const projStat3Lbl = document.getElementById('projStat3Lbl');

  const projProblemInput = document.getElementById('projProblemInput');
  const projSolutionInput = document.getElementById('projSolutionInput');
  const projResearchInput = document.getElementById('projResearchInput');
  const projSystemDetailsInput = document.getElementById('projSystemDetailsInput');
  const projOutcomesInput = document.getElementById('projOutcomesInput');

  function renderProjectsList() {
    if (!projectsListContainer) return;
    const projects = portfolioData.projects || [];
    if (projectCountBadge) projectCountBadge.textContent = projects.length;
    projectsListContainer.innerHTML = '';

    projects.forEach((proj, index) => {
      let imgSrc = proj.image || 'assets/images/uenr-exam.jpg';
      if (imgSrc.startsWith('assets/') || imgSrc.startsWith('data/')) {
        imgSrc = `../${imgSrc}`;
      }

      const card = document.createElement('div');
      card.className = 'project-manage-card';
      card.innerHTML = `
        <div class="proj-manage-thumb">
          <img src="${imgSrc}" alt="${proj.name}">
        </div>
        <div class="proj-manage-info">
          <h4>${proj.name}</h4>
          <p>${proj.tagline || ''}</p>
          <div class="proj-manage-tags">
            <span class="proj-tag-badge">${proj.categoryLabel || proj.category}</span>
            <span class="proj-tag-badge" style="border-left: 3px solid ${proj.accentColor || '#17233C'};">${proj.client || 'Client'}</span>
          </div>
        </div>
        <div class="proj-manage-actions">
          <button type="button" class="dash-btn dash-btn--sm dash-btn--secondary edit-proj-btn" data-id="${proj.id}">Edit</button>
          <button type="button" class="dash-btn dash-btn--sm dash-btn--danger delete-proj-btn" data-id="${proj.id}">Delete</button>
        </div>
      `;

      card.querySelector('.edit-proj-btn').addEventListener('click', () => openProjectModal(proj.id));
      card.querySelector('.delete-proj-btn').addEventListener('click', () => {
        if (confirm(`Are you sure you want to remove project "${proj.name}"?`)) {
          portfolioData.projects.splice(index, 1);
          renderProjectsList();
          showToast(`Project "${proj.name}" removed.`);
        }
      });

      projectsListContainer.appendChild(card);
    });
  }

  function updateProjectImgPreview(src) {
    if (!projImagePreview) return;
    if (src.startsWith('assets/') || src.startsWith('data/')) {
      projImagePreview.src = `../${src}`;
    } else {
      projImagePreview.src = src;
    }
  }

  projImageFileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target.result;
        projImageUrlInput.value = base64Url;
        updateProjectImgPreview(base64Url);
      };
      reader.readAsDataURL(file);
    }
  });

  projImageUrlInput?.addEventListener('input', (e) => {
    updateProjectImgPreview(e.target.value.trim());
  });

  // Sync color pickers
  projAccentColorInput?.addEventListener('input', (e) => {
    projAccentColorText.value = e.target.value;
  });
  projAccentColorText?.addEventListener('input', (e) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
      projAccentColorInput.value = e.target.value;
    }
  });

  function openProjectModal(id) {
    let proj = null;
    if (id) {
      proj = portfolioData.projects.find(p => p.id === id);
    }

    if (proj) {
      projectModalTitle.textContent = `Edit Project — ${proj.name}`;
      editProjectId.value = proj.id;
      projNameInput.value = proj.name || '';
      projClientInput.value = proj.client || '';
      projCategorySelect.value = proj.category || 'academic';
      projCategoryLabelInput.value = proj.categoryLabel || '';
      projRoleInput.value = proj.role || '';
      projTimelineInput.value = proj.timeline || '';
      projDomainTagInput.value = proj.domainTag || '';
      projTaglineInput.value = proj.tagline || '';

      const imgVal = proj.image || 'assets/images/uenr-exam.jpg';
      projImageUrlInput.value = imgVal;
      updateProjectImgPreview(imgVal);

      projAccentColorInput.value = proj.accentColor || '#2563EB';
      projAccentColorText.value = proj.accentColor || '#2563EB';
      projPaletteDescInput.value = proj.paletteDesc || '';

      // Stats
      const stats = proj.stats || [];
      projStat1Val.value = stats[0]?.value || '';
      projStat1Lbl.value = stats[0]?.label || '';
      projStat2Val.value = stats[1]?.value || '';
      projStat2Lbl.value = stats[1]?.label || '';
      projStat3Val.value = stats[2]?.value || '';
      projStat3Lbl.value = stats[2]?.label || '';

      // Case study
      projProblemInput.value = proj.overview?.problem || '';
      projSolutionInput.value = proj.overview?.solution || '';
      projResearchInput.value = (proj.research || []).join('\n');
      projSystemDetailsInput.value = (proj.systemDetails || []).join('\n');
      projOutcomesInput.value = (proj.outcomes || []).join('\n');
    } else {
      // New project
      projectModalTitle.textContent = 'Add New Project';
      editProjectId.value = '';
      projectForm.reset();
      projAccentColorInput.value = '#2563EB';
      projAccentColorText.value = '#2563EB';
      projImageUrlInput.value = 'assets/images/uenr-exam.jpg';
      updateProjectImgPreview('assets/images/uenr-exam.jpg');
    }

    projectEditorModal.classList.add('open');
    projectEditorModal.setAttribute('aria-hidden', 'false');
  }

  function closeProjectModal() {
    projectEditorModal.classList.remove('open');
    projectEditorModal.setAttribute('aria-hidden', 'true');
  }

  addNewProjectBtn?.addEventListener('click', () => openProjectModal(null));
  closeProjectModalBtn?.addEventListener('click', closeProjectModal);
  cancelProjectBtn?.addEventListener('click', closeProjectModal);

  projectForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = editProjectId.value || `proj-${Date.now()}`;
    const isNew = !editProjectId.value;

    const stats = [];
    if (projStat1Val.value || projStat1Lbl.value) {
      stats.push({ value: projStat1Val.value.trim(), label: projStat1Lbl.value.trim() });
    }
    if (projStat2Val.value || projStat2Lbl.value) {
      stats.push({ value: projStat2Val.value.trim(), label: projStat2Lbl.value.trim() });
    }
    if (projStat3Val.value || projStat3Lbl.value) {
      stats.push({ value: projStat3Val.value.trim(), label: projStat3Lbl.value.trim() });
    }

    const researchBullets = projResearchInput.value.split('\n').map(s => s.trim()).filter(Boolean);
    const systemBullets = projSystemDetailsInput.value.split('\n').map(s => s.trim()).filter(Boolean);
    const outcomesBullets = projOutcomesInput.value.split('\n').map(s => s.trim()).filter(Boolean);

    const projectPayload = {
      id: id,
      name: projNameInput.value.trim(),
      client: projClientInput.value.trim(),
      category: projCategorySelect.value,
      categoryLabel: projCategoryLabelInput.value.trim() || projCategorySelect.options[projCategorySelect.selectedIndex].text,
      role: projRoleInput.value.trim(),
      timeline: projTimelineInput.value.trim(),
      domainTag: projDomainTagInput.value.trim(),
      tagline: projTaglineInput.value.trim(),
      image: projImageUrlInput.value.trim() || 'assets/images/uenr-exam.jpg',
      accentColor: projAccentColorInput.value,
      paletteDesc: projPaletteDescInput.value.trim(),
      palette: [
        { name: 'Primary Accent', hex: projAccentColorInput.value },
        { name: 'Navy Brand', hex: '#17233C' },
        { name: 'Warm Ivory', hex: '#F8F6F1' },
        { name: 'Pure White', hex: '#FFFFFF' }
      ],
      stats: stats.length ? stats : [{ value: '100%', label: 'Metric' }],
      overview: {
        problem: projProblemInput.value.trim(),
        solution: projSolutionInput.value.trim()
      },
      research: researchBullets.length ? researchBullets : ['User research insights and observations.'],
      systemDetails: systemBullets.length ? systemBullets : ['Design system tokens and architecture.'],
      outcomes: outcomesBullets.length ? outcomesBullets : ['Key impact metrics and results.']
    };

    if (isNew) {
      portfolioData.projects.push(projectPayload);
      showToast(`Added project "${projectPayload.name}".`);
    } else {
      const idx = portfolioData.projects.findIndex(p => p.id === id);
      if (idx !== -1) {
        portfolioData.projects[idx] = projectPayload;
        showToast(`Updated project "${projectPayload.name}".`);
      }
    }

    renderProjectsList();
    closeProjectModal();
  });

  // --------------------------------------------------------------------------
  // 11. Philosophy Steps Repeater
  // --------------------------------------------------------------------------
  const processStepsContainer = document.getElementById('processStepsContainer');
  const addProcessStepBtn = document.getElementById('addProcessStepBtn');

  function renderProcessSteps() {
    if (!processStepsContainer) return;
    const steps = portfolioData.philosophy?.steps || [];
    processStepsContainer.innerHTML = '';

    steps.forEach((step, index) => {
      const div = document.createElement('div');
      div.className = 'repeater-item';
      div.innerHTML = `
        <div class="repeater-item-header">
          <span class="repeater-badge">Step #${index + 1}</span>
          <button type="button" class="repeater-delete-btn" data-index="${index}">Delete</button>
        </div>
        <div class="form-grid-2">
          <div class="dash-form-group">
            <label class="dash-label">Step Number Label</label>
            <input type="text" class="dash-input step-num-input" value="${step.num || `0${index + 1}`}">
          </div>
          <div class="dash-form-group">
            <label class="dash-label">Step Title</label>
            <input type="text" class="dash-input step-title-input" value="${step.title || ''}">
          </div>
        </div>
        <div class="dash-form-group">
          <label class="dash-label">Description</label>
          <textarea class="dash-input dash-textarea step-desc-input" rows="2">${step.desc || ''}</textarea>
        </div>
        <div class="dash-form-group">
          <label class="dash-label">Checkmarks / Deliverables (Comma-separated)</label>
          <input type="text" class="dash-input step-checks-input" value="${(step.checks || []).join(', ')}">
        </div>
      `;
      div.querySelector('.repeater-delete-btn').addEventListener('click', () => {
        portfolioData.philosophy.steps.splice(index, 1);
        renderProcessSteps();
      });
      processStepsContainer.appendChild(div);
    });
  }

  addProcessStepBtn?.addEventListener('click', () => {
    if (!portfolioData.philosophy) portfolioData.philosophy = {};
    if (!portfolioData.philosophy.steps) portfolioData.philosophy.steps = [];
    portfolioData.philosophy.steps.push({
      num: `0${portfolioData.philosophy.steps.length + 1}`,
      title: 'New Method Step',
      desc: 'Description of this methodology phase.',
      checks: ['Deliverable 1', 'Deliverable 2']
    });
    renderProcessSteps();
  });

  // --------------------------------------------------------------------------
  // 12. Credentials Timeline & Skills
  // --------------------------------------------------------------------------
  const timelineListContainer = document.getElementById('timelineListContainer');
  const addTimelineBtn = document.getElementById('addTimelineBtn');

  function renderTimelineList() {
    if (!timelineListContainer) return;
    const timeline = portfolioData.credentials?.timeline || [];
    timelineListContainer.innerHTML = '';

    timeline.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'repeater-item';
      div.innerHTML = `
        <div class="repeater-item-header">
          <span class="repeater-badge">Timeline #${index + 1}</span>
          <button type="button" class="repeater-delete-btn" data-index="${index}">Delete</button>
        </div>
        <div class="form-grid-2">
          <div class="dash-form-group">
            <label class="dash-label">Year / Duration</label>
            <input type="text" class="dash-input tl-year-input" value="${item.year || ''}" placeholder="2024 — Present">
          </div>
          <div class="dash-form-group">
            <label class="dash-label">Role / Degree Title</label>
            <input type="text" class="dash-input tl-role-input" value="${item.role || ''}">
          </div>
        </div>
        <div class="dash-form-group">
          <label class="dash-label">Institution / Organization</label>
          <input type="text" class="dash-input tl-org-input" value="${item.org || ''}">
        </div>
        <div class="dash-form-group">
          <label class="dash-label">Details / Focus</label>
          <textarea class="dash-input dash-textarea tl-detail-input" rows="2">${item.detail || ''}</textarea>
        </div>
      `;
      div.querySelector('.repeater-delete-btn').addEventListener('click', () => {
        portfolioData.credentials.timeline.splice(index, 1);
        renderTimelineList();
      });
      timelineListContainer.appendChild(div);
    });
  }

  addTimelineBtn?.addEventListener('click', () => {
    if (!portfolioData.credentials) portfolioData.credentials = {};
    if (!portfolioData.credentials.timeline) portfolioData.credentials.timeline = [];
    portfolioData.credentials.timeline.push({
      year: '2024 — Present',
      role: 'UI/UX Designer',
      org: 'Design Studio',
      detail: 'Focused on interaction design and research.'
    });
    renderTimelineList();
  });

  const skillGroupsContainer = document.getElementById('skillGroupsContainer');
  const addSkillGroupBtn = document.getElementById('addSkillGroupBtn');

  function renderSkillGroups() {
    if (!skillGroupsContainer) return;
    const skills = portfolioData.credentials?.skills || [];
    skillGroupsContainer.innerHTML = '';

    skills.forEach((group, index) => {
      const div = document.createElement('div');
      div.className = 'repeater-item';
      div.innerHTML = `
        <div class="repeater-item-header">
          <span class="repeater-badge">Skill Category #${index + 1}</span>
          <button type="button" class="repeater-delete-btn" data-index="${index}">Delete</button>
        </div>
        <div class="dash-form-group">
          <label class="dash-label">Category Title</label>
          <input type="text" class="dash-input skill-title-input" value="${group.title || ''}">
        </div>
        <div class="dash-form-group">
          <label class="dash-label">Skill Badges (Comma-separated)</label>
          <textarea class="dash-input dash-textarea skill-badges-input" rows="2">${(group.badges || []).join(', ')}</textarea>
        </div>
      `;
      div.querySelector('.repeater-delete-btn').addEventListener('click', () => {
        portfolioData.credentials.skills.splice(index, 1);
        renderSkillGroups();
      });
      skillGroupsContainer.appendChild(div);
    });
  }

  addSkillGroupBtn?.addEventListener('click', () => {
    if (!portfolioData.credentials) portfolioData.credentials = {};
    if (!portfolioData.credentials.skills) portfolioData.credentials.skills = [];
    portfolioData.credentials.skills.push({
      title: 'New Skill Discipline',
      colorClass: 'bullet-navy',
      badges: ['Skill 1', 'Skill 2', 'Skill 3']
    });
    renderSkillGroups();
  });

  // --------------------------------------------------------------------------
  // 13. Save All Changes to LocalStorage & Notify Live Portfolio
  // --------------------------------------------------------------------------
  const saveAllBtn = document.getElementById('saveAllBtn');

  function gatherDashboardState() {
    // 1. General
    portfolioData.general = {
      brandName: document.getElementById('brandNameInput').value.trim(),
      brandMonogram: document.getElementById('brandMonogramInput').value.trim(),
      roleTag: document.getElementById('roleTagInput').value.trim(),
      contactEmail: document.getElementById('contactEmailInput').value.trim(),
      location: document.getElementById('locationInput').value.trim(),
      availabilityText: document.getElementById('availabilityTextInput').value.trim(),
      isAvailable: document.getElementById('isAvailableSelect').value === 'true',
      socials: []
    };

    socialsListContainer.querySelectorAll('.repeater-item').forEach(item => {
      const name = item.querySelector('.social-name-input')?.value.trim();
      const url = item.querySelector('.social-url-input')?.value.trim();
      if (name && url) {
        portfolioData.general.socials.push({ name, url });
      }
    });

    // 2. Hero
    const metrics = [];
    metricsListContainer.querySelectorAll('.repeater-item').forEach(item => {
      const val = item.querySelector('.metric-val-input')?.value.trim();
      const lbl = item.querySelector('.metric-lbl-input')?.value.trim();
      if (val || lbl) metrics.push({ value: val, label: lbl });
    });

    const marquee = document.getElementById('marqueeItemsInput').value
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    portfolioData.hero = {
      badgeText: document.getElementById('heroBadgeInput').value.trim(),
      headline: document.getElementById('heroHeadlineInput').value.trim(),
      leadText: document.getElementById('heroLeadInput').value.trim(),
      portraitImage: document.getElementById('heroPortraitUrlInput').value.trim() || 'assets/images/janette-portrait.jpg',
      floatingBadge: {
        subtitle: document.getElementById('floatingSubInput').value.trim(),
        title: document.getElementById('floatingTitleInput').value.trim()
      },
      metrics: metrics,
      marqueeItems: marquee
    };

    // 3. About
    const values = [];
    valuesListContainer.querySelectorAll('.repeater-item').forEach(item => {
      values.push({
        num: item.querySelector('.val-num-input')?.value.trim(),
        title: item.querySelector('.val-title-input')?.value.trim(),
        desc: item.querySelector('.val-desc-input')?.value.trim()
      });
    });

    const pillars = [];
    pillarsListContainer.querySelectorAll('.repeater-item').forEach((item, i) => {
      const tags = item.querySelector('.pillar-tags-input')?.value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      pillars.push({
        id: `pillar-${i}`,
        type: i === 0 ? 'navy' : i === 1 ? 'rose' : 'periwinkle',
        title: item.querySelector('.pillar-title-input')?.value.trim(),
        subtitle: item.querySelector('.pillar-sub-input')?.value.trim(),
        desc: item.querySelector('.pillar-desc-input')?.value.trim(),
        tags: tags
      });
    });

    portfolioData.about = {
      eyebrow: document.getElementById('aboutEyebrowInput').value.trim(),
      profileBadge: document.getElementById('aboutBadgeInput').value.trim(),
      title: document.getElementById('aboutTitleInput').value.trim(),
      subtitle: document.getElementById('aboutSubtitleInput').value.trim(),
      headline: document.getElementById('aboutHeadlineInput').value.trim(),
      bioParagraphs: [
        document.getElementById('aboutBio1Input').value.trim(),
        document.getElementById('aboutBio2Input').value.trim()
      ],
      values: values,
      pillars: pillars
    };

    // 4. Philosophy
    const steps = [];
    processStepsContainer.querySelectorAll('.repeater-item').forEach((item, i) => {
      const checks = item.querySelector('.step-checks-input')?.value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      steps.push({
        num: item.querySelector('.step-num-input')?.value.trim() || `0${i + 1}`,
        title: item.querySelector('.step-title-input')?.value.trim(),
        desc: item.querySelector('.step-desc-input')?.value.trim(),
        checks: checks
      });
    });

    portfolioData.philosophy = {
      eyebrow: 'How I Think & Build',
      title: document.getElementById('philTitleInput').value.trim(),
      subtitle: document.getElementById('philSubtitleInput').value.trim(),
      steps: steps,
      manifesto: {
        label: document.getElementById('manifestoLabelInput').value.trim(),
        quote: document.getElementById('manifestoQuoteInput').value.trim(),
        author: document.getElementById('manifestoAuthorInput').value.trim()
      }
    };

    // 5. Credentials
    const timeline = [];
    timelineListContainer.querySelectorAll('.repeater-item').forEach(item => {
      timeline.push({
        year: item.querySelector('.tl-year-input')?.value.trim(),
        role: item.querySelector('.tl-role-input')?.value.trim(),
        org: item.querySelector('.tl-org-input')?.value.trim(),
        detail: item.querySelector('.tl-detail-input')?.value.trim()
      });
    });

    const skills = [];
    skillGroupsContainer.querySelectorAll('.repeater-item').forEach((item, i) => {
      const badges = item.querySelector('.skill-badges-input')?.value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      skills.push({
        title: item.querySelector('.skill-title-input')?.value.trim(),
        colorClass: i === 0 ? 'bullet-navy' : i === 1 ? 'bullet-rose' : 'bullet-periwinkle',
        badges: badges
      });
    });

    portfolioData.credentials = {
      eyebrow: 'Technical & Creative Foundation',
      title: 'Background & Tooling',
      subtitle: 'A cohesive toolkit combining Figma craftsmanship with modern web programming principles.',
      timeline: timeline,
      skills: skills
    };

    // 6. Visibility
    portfolioData.sectionsVisibility = {
      hero: document.getElementById('toggleHero').checked,
      about: document.getElementById('toggleAbout').checked,
      work: document.getElementById('toggleWork').checked,
      philosophy: document.getElementById('togglePhilosophy').checked,
      credentials: document.getElementById('toggleCredentials').checked,
      contact: document.getElementById('toggleContact').checked
    };
  }

  saveAllBtn?.addEventListener('click', async () => {
    gatherDashboardState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolioData));
    
    const saveBtn = document.getElementById('saveAllBtn');
    const origText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span>Syncing to Convex...</span>';

    const savedToCloud = await saveToConvex(portfolioData);
    saveBtn.disabled = false;
    saveBtn.innerHTML = origText;

    const statusIndicator = document.getElementById('saveStatusIndicator');
    if (savedToCloud) {
      if (statusIndicator) {
        statusIndicator.innerHTML = '<span class="status-dot-green"></span> Synced to Convex Cloud';
      }
      showToast('Changes published live to Convex Cloud backend!');
    } else {
      showToast('Saved locally & to browser storage. Deploy Convex functions to sync cloud.');
    }
  });

  // --------------------------------------------------------------------------
  // 14. Export JSON & Import JSON
  // --------------------------------------------------------------------------
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const importJsonBtn = document.getElementById('importJsonBtn');
  const jsonFileInput = document.getElementById('jsonFileInput');

  exportJsonBtn?.addEventListener('click', () => {
    gatherDashboardState();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(portfolioData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'portfolio-data.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('portfolio-data.json downloaded to your computer.');
  });

  importJsonBtn?.addEventListener('click', () => {
    jsonFileInput?.click();
  });

  jsonFileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          portfolioData = parsed;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolioData));
          initDashboard();
          showToast('JSON backup imported and applied!');
        } catch (err) {
          alert('Invalid JSON file format.');
        }
      };
      reader.readAsText(file);
    }
  });

  // --------------------------------------------------------------------------
  // 15. Reset to Factory Defaults
  // --------------------------------------------------------------------------
  const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');
  resetDefaultsBtn?.addEventListener('click', async () => {
    if (confirm('Are you sure you want to reset all portfolio content to factory defaults? Any unsaved custom edits will be reverted.')) {
      localStorage.removeItem(STORAGE_KEY);
      try {
        const res = await fetch('../data/portfolio-data.json');
        portfolioData = await res.json();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolioData));
        initDashboard();
        showToast('Reset to factory defaults.');
      } catch (err) {
        showToast('Error resetting defaults.');
      }
    }
  });

  // Initial Boot
  loadPortfolioData();
});
