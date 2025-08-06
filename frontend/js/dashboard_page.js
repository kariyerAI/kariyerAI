// Initialize dashboard
function initializeDashboard() {
  console.log("Initializing dashboard...");
  
  // First ensure user data is loaded from localStorage
  if (window.KariyerAI && typeof window.KariyerAI.loadUserData === 'function') {
    window.KariyerAI.loadUserData();
  }
  
  loadUserProfile();
  setupDashboardEventListeners();
}

// Load user profile information
function loadUserProfile() {
  let user = null;
  const activeEmail = localStorage.getItem("currentEmail"); // olabilir ama zorunlu değil

  // Method 1: From window.KariyerAI global object
  if (window.KariyerAI?.currentUser) {
      user = window.KariyerAI.currentUser;
      console.log("User loaded from KariyerAI global:", user);
  }

  
  // Method 2: Direct from localStorage
  if (!user) {
    try {
      const userData = localStorage.getItem("kariyerAI_user");
      if (userData) {
        const parsed = JSON.parse(userData);
        if (!activeEmail || parsed.email === activeEmail) {   
          user = parsed;
          if (window.KariyerAI) {
            window.KariyerAI.currentUser = user;
          }
          console.log("User loaded from localStorage:", user);
        }
      }
    } catch (error) {
      console.error("Error reading from localStorage:", error);
    }
  }

  // Method 3: URL param check
  if (!user) {
    const urlParams = new URLSearchParams(window.location.search);
    const profileCreated = urlParams.get('profileCreated');
    if (profileCreated === 'true') {
      setTimeout(() => {
        loadUserProfile();
      }, 500);
      return;
    }
  }

  if (!user) {
    console.log("No user data found in any location");
    showNoUserDataMessage();
    return;
  }

  updateElement('userDisplayName', user.firstName || user.first_name || 'Kullanıcı');
  updateElement('userDisplayTitle', user.currentTitle || user.current_title || 'Pozisyon');
  
  const fullName = `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim();
  updateElement('userFullName', fullName || 'Kullanıcı Adı');
  updateElement('userCurrentTitle', user.currentTitle || user.current_title || 'Pozisyon');
  updateElement('userLocation', user.location || 'Lokasyon');
  
  const skillCount = (user.skills || []).length;
  updateElement('userSkillCount', `${skillCount} Beceri`);
  updateElement('userExperienceLevel', getExperienceLevelText(user.experienceLevel || user.experience_level));

  // Update avatar
  const avatar = document.getElementById('userProfileAvatar');
  if (avatar) {
    const firstLetter = (user.firstName || user.first_name || 'U').charAt(0).toUpperCase();
    avatar.textContent = firstLetter;
  }
  
  // Update welcome section with user's first name
  const welcomeName = document.getElementById('welcomeUserName');
  if (welcomeName) {
      welcomeName.textContent = user.firstName || user.first_name || 'Kullanıcı';
  }

  // Update dropdown user information
  updateDropdownUserInfo();

  
  console.log("User profile loaded successfully:", {
    name: fullName,
    title: user.currentTitle || user.current_title,
    skills: skillCount
  });

  renderUserSkills(user.skills);
  renderUserExperiences(user.experiences);
  checkPersonalityAssessment(user);
}

function checkPersonalityAssessment(user) {
  const hasPersonalityAssessment = user.personality_assessment && 
                                 user.personality_assessment.personality_type;
  
  if (!hasPersonalityAssessment) {
    showPersonalityTestNotification();
  } else {
    showPersonalizedRecommendations(user.personality_assessment);
  }
}

function showPersonalityTestNotification() {
  const notificationHtml = `
    <div class="card mb-6" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;">
      <div class="card-body text-center">
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">🧠</div>
        <h3 style="font-size: 1.3rem; margin-bottom: 1rem; color: white;">Kişilik Testinizi Tamamlayın!</h3>
        <p style="margin-bottom: 1.5rem; opacity: 0.9; color: white; font-size: 0.9rem;">
          Size özel simülasyonlar ve öneriler alabilmek için kişilik testinizi tamamlayın. 
          Sadece 5-7 dakika sürecek!
        </p>
        <a href="../html/personality_assessment.html" style="background: white; color: #667eea; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 0.5rem;">
          <i class="fas fa-brain"></i>
          Kişilik Testini Başlat
        </a>
      </div>
    </div>
  `;
  
  const statsGrid = document.querySelector('.stats-grid');
  if (statsGrid) {
    statsGrid.insertAdjacentHTML('beforebegin', notificationHtml);
  }
}

function showPersonalizedRecommendations(personalityAssessment) {
  const recommendationHtml = `
    <div class="card mb-6" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none;">
      <div class="card-body">
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
          <div style="font-size: 2rem;">✨</div>
          <div>
            <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem; color: white;">Kişiselleştirilmiş Deneyim Aktif</h3>
            <p style="margin: 0; opacity: 0.9; font-size: 0.9rem;">
              ${personalityAssessment.personality_type} kişiliğinize özel öneriler hazırlandı
            </p>
          </div>
        </div>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
          <a href="../html/interactive_simulation.html?personalized=true" style="background: rgba(255,255,255,0.2); color: white; padding: 0.5rem 1rem; border-radius: 6px; text-decoration: none; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-play"></i>
            Kişisel Simülasyon
          </a>
          <a href="../html/personality_assessment.html" style="background: rgba(255,255,255,0.2); color: white; padding: 0.5rem 1rem; border-radius: 6px; text-decoration: none; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-chart-bar"></i>
            Test Sonuçları
          </a>
        </div>
      </div>
    </div>
  `;
  
  const statsGrid = document.querySelector('.stats-grid');
  if (statsGrid) {
    statsGrid.insertAdjacentHTML('beforebegin', recommendationHtml);
  }
}

function renderUserSkills(skills) {
    const container = document.getElementById('userSkillsList');
    if (!container) return;

    if (!skills || skills.length === 0) {
        container.innerHTML = '<p class="text-gray-500">Beceri eklenmemiş</p>';
        return;
    }

    container.innerHTML = skills.map(skill => `
        <span class="badge-blue">${skill}</span>
    `).join('');
}

function renderUserExperiences(experiences) {
    const container = document.getElementById('userExperienceList');
    if (!container) return;

    if (!experiences || experiences.length === 0) {
        container.innerHTML = '<p class="text-gray-500">İş deneyimi eklenmemiş</p>';
        return;
    }

    container.innerHTML = experiences.map(exp => `
        <div class="experience-card">
            <h4>${exp.position} <span class="text-sm text-gray-500">(${exp.duration})</span></h4>
            <p class="company">${exp.company}</p>
            <p class="desc">${exp.description}</p>
        </div>
    `).join('');
}


// Show message when no user data is found
function showNoUserDataMessage() {
  const container = document.querySelector('.container');
  if (container) {
    // Create a notice for missing user data
    const notice = document.createElement('div');
    notice.className = 'card bg-yellow-50 border-yellow-200 mb-6';
    notice.innerHTML = `
      <div class="card-body text-center">
        <i class="fas fa-exclamation-triangle text-yellow-500 text-3xl mb-3"></i>
        <h3 class="text-lg font-semibold mb-2">Profil Bilgisi Bulunamadı</h3>
        <p class="text-gray-600 mb-4">Dashboard'ı kullanabilmek için önce profilinizi oluşturmanız gerekiyor.</p>
        <a href="../html/create_profile_page.html" class="btn btn-primary">
          <i class="fas fa-user-plus mr-2"></i>
          Profil Oluştur
        </a>
      </div>
    `;
    
    // Insert notice at the beginning of container
    const welcomeSection = container.querySelector('.mb-8');
    if (welcomeSection) {
      welcomeSection.after(notice);
    }
  }
}

// Get experience level text
function getExperienceLevelText(level) {
  const levels = {
    'junior': 'Junior (0-2 yıl)',
    'mid': 'Mid-Level (2-5 yıl)',
    'senior': 'Senior (5-8 yıl)',
    'lead': 'Lead/Principal (8+ yıl)'
  };
  return levels[level] || 'Belirtilmemiş';
}

// Update element text content safely
function updateElement(id, content) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = content;
  } else {
    console.warn(`Element with id '${id}' not found`);
  }
}


// Update progress bar
function updateProgressBar(id, current, total) {
  const progressBar = document.getElementById(id);
  if (progressBar) {
    const percentage = Math.min((current / total) * 100, 100);
    progressBar.style.width = `${percentage}%`;
  }
}


// Get task icon based on type
function getTaskIcon(type) {
  const icons = {
    'learning': 'fa-book-open',
    'project': 'fa-code',
    'job': 'fa-briefcase'
  };
  return icons[type] || 'fa-tasks';
}



// Setup dashboard event listeners
function setupDashboardEventListeners() {
  // Add click handlers for interactive elements
  const quickActionButtons = document.querySelectorAll('.btn[href]');
  quickActionButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      console.log('Navigation to:', button.getAttribute('href'));
    });
  });

  // Add notification bell click handler
  const notificationBell = document.querySelector('.notification-bell');
  if (notificationBell) {
    notificationBell.addEventListener('click', () => {
      alert('Bildirimler özelliği yakında eklenecek!');
    });
  }

  // Setup user dropdown functionality
  setupUserDropdown();
}

// Setup user dropdown functionality
function setupUserDropdown() {
  const dropdownBtn = document.getElementById('userDropdownBtn');
  const dropdownMenu = document.getElementById('userDropdownMenu');
  const logoutBtn = document.getElementById('logoutBtn');

  if (!dropdownBtn || !dropdownMenu || !logoutBtn) {
    console.log('User dropdown elements not found');
    return;
  }

  // Toggle dropdown on button click
  dropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
      closeDropdown();
    }
  });

  // Close dropdown on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  // Logout functionality
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleLogout();
  });

  // Update dropdown user info
  updateDropdownUserInfo();
}

// Toggle dropdown visibility
function toggleDropdown() {
  const dropdownBtn = document.getElementById('userDropdownBtn');
  const dropdownMenu = document.getElementById('userDropdownMenu');
  
  if (dropdownMenu.classList.contains('show')) {
    closeDropdown();
  } else {
    openDropdown();
  }
}

// Open dropdown
function openDropdown() {
  const dropdownBtn = document.getElementById('userDropdownBtn');
  const dropdownMenu = document.getElementById('userDropdownMenu');
  
  dropdownBtn.classList.add('active');
  dropdownMenu.classList.add('show');
}

// Close dropdown
function closeDropdown() {
  const dropdownBtn = document.getElementById('userDropdownBtn');
  const dropdownMenu = document.getElementById('userDropdownMenu');
  
  dropdownBtn.classList.remove('active');
  dropdownMenu.classList.remove('show');
}

// Update dropdown user information
function updateDropdownUserInfo() {
  const user = window.KariyerAI?.currentUser;
  if (!user) return;

  const dropdownUserName = document.getElementById('dropdownUserName');
  const dropdownUserEmail = document.getElementById('dropdownUserEmail');

  if (dropdownUserName) {
    const fullName = `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim();
    dropdownUserName.textContent = fullName || 'Kullanıcı';
  }

  if (dropdownUserEmail) {
    dropdownUserEmail.textContent = user.email || 'email@example.com';
  }
}

// Handle logout
function handleLogout() {
  if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
    console.log('Logging out user...');
    
    // Clear user data
    if (window.KariyerAI) {
      window.KariyerAI.currentUser = null;
      window.KariyerAI.saveUserData();
    }
    
    // Clear localStorage
    localStorage.removeItem('kariyerAI_user');
    localStorage.removeItem('currentEmail');
    
    // Redirect to login page
    window.location.href = '../html/login_page.html';
  }
}


// Refresh dashboard data
function refreshDashboard() {
  console.log('Refreshing dashboard...');
  loadUserProfile();
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Small delay to ensure main.js has loaded
  setTimeout(() => {
    initializeDashboard();
  }, 100);
});

// Export functions for external use
window.dashboardFunctions = {
  initializeDashboard,
  refreshDashboard,
  loadUserProfile,
};

