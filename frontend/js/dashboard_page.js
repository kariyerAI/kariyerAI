// dashboard_page.js - Fixed User Data Loading

// Initialize dashboard
function initializeDashboard() {
  console.log("Initializing dashboard...");
  
  // First ensure user data is loaded from localStorage
  if (window.KariyerAI && typeof window.KariyerAI.loadUserData === 'function') {
    window.KariyerAI.loadUserData();
  }
  
  loadUserProfile();
  loadDashboardStats();
  loadSkillGaps();
  loadUpcomingTasks();
  loadRecentActivities();
  setupDashboardEventListeners();
}

// Load user profile information
function loadUserProfile() {
  let user = null;
  const activeEmail = localStorage.getItem("currentEmail"); // 🔹 Login sonrası kaydedilen email

  // Method 1: From window.KariyerAI global object
  if (window.KariyerAI?.currentUser && window.KariyerAI.currentUser.email === activeEmail) {
    user = window.KariyerAI.currentUser;
    console.log("User loaded from KariyerAI global:", user);
  }
  
  // Method 2: Direct from localStorage
  if (!user) {
    try {
      const userData = localStorage.getItem("kariyerAI_user");
      if (userData) {
        const parsed = JSON.parse(userData);
        if (!activeEmail || parsed.email === activeEmail) {   // ✅ Email eşleşme kontrolü
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

  // --- (Alttaki kodların tamamı aynı kalır) ---



  // Update user display elements
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
  
  console.log("User profile loaded successfully:", {
    name: fullName,
    title: user.currentTitle || user.current_title,
    skills: skillCount
  });
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

// Load dashboard statistics
function loadDashboardStats() {
  // Get user data for personalized stats
  const user = window.KariyerAI?.currentUser;
  
  // Mock data for now - replace with real API calls
  const mockStats = {
    level: user ? 'Level 2' : 'Level 1',
    xp: user ? 250 : 0,
    xpForNextLevel: 500,
    jobMatches: user ? 12 : 0,
    completedCourses: user ? 3 : 0,
    weeklyXP: user ? 75 : 0,
    weeklyGoal: 300,
    dailyStreak: user ? 3 : 0
  };

  // Update level progress
  updateElement('userLevel', mockStats.level);
  updateProgressBar('xpProgress', mockStats.xp, mockStats.xpForNextLevel);
  
  const xpText = document.querySelector('#xpProgress + p');
  if (xpText) {
    xpText.textContent = `${mockStats.xp} / ${mockStats.xpForNextLevel} XP`;
  }

  // Update other stats
  updateElement('jobMatches', mockStats.jobMatches.toString());
  updateElement('completedCourses', mockStats.completedCourses.toString());
  updateElement('weeklyGoalText', `${mockStats.weeklyXP}/${mockStats.weeklyGoal} XP`);
  updateElement('dailyStreak', `${mockStats.dailyStreak} gün`);
  
  updateProgressBar('weeklyProgressBar', mockStats.weeklyXP, mockStats.weeklyGoal);
}

// Update progress bar
function updateProgressBar(id, current, total) {
  const progressBar = document.getElementById(id);
  if (progressBar) {
    const percentage = Math.min((current / total) * 100, 100);
    progressBar.style.width = `${percentage}%`;
  }
}

// Load skill gaps
function loadSkillGaps() {
  const container = document.getElementById('skillGaps');
  if (!container) return;

  // Show loading
  container.innerHTML = `
    <div class="text-center py-6">
      <i class="fas fa-spinner fa-spin text-gray-400 text-2xl mb-2"></i>
      <p class="text-gray-500">Beceri analizi yapılıyor...</p>
    </div>
  `;

  // Check if user has skills to analyze
  const user = window.KariyerAI?.currentUser;
  const userSkills = user?.skills || [];

  setTimeout(() => {
    if (userSkills.length === 0) {
      container.innerHTML = `
        <div class="text-center py-6">
          <i class="fas fa-info-circle text-blue-400 text-2xl mb-2"></i>
          <p class="text-gray-500">Beceri analizi için önce profilinize beceriler ekleyin</p>
          <a href="../html/create_profile_page.html" class="btn btn-outline btn-small mt-3">
            Beceri Ekle
          </a>
        </div>
      `;
      return;
    }

    // Mock skill gaps data based on user skills
    const mockSkillGaps = [
      { skill: 'React.js', priority: 'high', demand: 85, gap: 70 },
      { skill: 'Python', priority: 'medium', demand: 72, gap: 45 },
      { skill: 'AWS', priority: 'high', demand: 68, gap: 80 },
      { skill: 'Docker', priority: 'medium', demand: 55, gap: 60 }
    ];

    container.innerHTML = mockSkillGaps.map(gap => `
      <div class="skill-gap-item mb-4 p-4 border rounded-lg hover:bg-gray-50">
        <div class="flex justify-between items-center mb-2">
          <div class="flex items-center gap-2">
            <span class="font-medium">${gap.skill}</span>
            <span class="badge ${gap.priority === 'high' ? 'badge-red' : 'badge-orange'}">
              ${gap.priority === 'high' ? 'Yüksek' : 'Orta'} Öncelik
            </span>
          </div>
          <span class="text-sm text-gray-600">${gap.demand}% Talep</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Eksiklik:</span>
          <div class="flex-1 bg-gray-200 rounded-full h-2">
            <div class="bg-orange-500 h-2 rounded-full" style="width: ${gap.gap}%"></div>
          </div>
          <span class="text-sm font-medium">${gap.gap}%</span>
        </div>
      </div>
    `).join('');
  }, 1500);
}

// Load upcoming tasks
function loadUpcomingTasks() {
  const container = document.getElementById('upcomingTasks');
  if (!container) return;

  // Show loading
  container.innerHTML = `
    <div class="text-center py-6">
      <i class="fas fa-spinner fa-spin text-gray-400 text-2xl mb-2"></i>
      <p class="text-gray-500">Görevler yükleniyor...</p>
    </div>
  `;

  // Mock tasks data
  setTimeout(() => {
    const mockTasks = [
      {
        id: 1,
        title: 'React.js Temelleri Kursu',
        type: 'learning',
        priority: 'high',
        dueDate: '2 gün içinde',
        xp: 100
      },
      {
        id: 2,
        title: 'Portfolio Projesini Güncelle',
        type: 'project',
        priority: 'medium',
        dueDate: '1 hafta içinde',
        xp: 150
      },
      {
        id: 3,
        title: 'İş Başvurusu Yap',
        type: 'job',
        priority: 'high',
        dueDate: '3 gün içinde',
        xp: 50
      }
    ];

    container.innerHTML = mockTasks.map(task => `
      <div class="task-item mb-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
        <div class="flex justify-between items-start mb-2">
          <div class="flex items-center gap-2">
            <i class="fas ${getTaskIcon(task.type)} text-blue-500"></i>
            <span class="font-medium">${task.title}</span>
          </div>
          <span class="badge ${task.priority === 'high' ? 'badge-red' : 'badge-orange'}">
            ${task.priority === 'high' ? 'Acil' : 'Normal'}
          </span>
        </div>
        <div class="flex justify-between items-center text-sm text-gray-600">
          <span>${task.dueDate}</span>
          <span class="text-blue-600 font-medium">+${task.xp} XP</span>
        </div>
      </div>
    `).join('');
  }, 1200);
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

// Load recent activities
function loadRecentActivities() {
  const container = document.getElementById('recentActivities');
  if (!container) return;

  // Show loading
  container.innerHTML = `
    <div class="text-center py-6">
      <i class="fas fa-spinner fa-spin text-gray-400 text-2xl mb-2"></i>
      <p class="text-gray-500">Aktiviteler yükleniyor...</p>
    </div>
  `;

  // Mock activities data
  setTimeout(() => {
    const user = window.KariyerAI?.currentUser;
    const mockActivities = user ? [
      {
        id: 1,
        action: 'Profil oluşturuldu',
        detail: `${user.firstName || 'Kullanıcı'} profili`,
        time: 'Az önce',
        icon: 'fa-user-check',
        color: 'text-green-500'
      },
      {
        id: 2,
        action: 'Beceriler eklendi',
        detail: `${(user.skills || []).length} beceri`,
        time: '5 dakika önce',
        icon: 'fa-plus-circle',
        color: 'text-blue-500'
      },
      {
        id: 3,
        action: 'İş deneyimi güncellendi',
        detail: `${(user.experiences || []).length} deneyim`,
        time: '10 dakika önce',
        icon: 'fa-briefcase',
        color: 'text-purple-500'
      }
    ] : [
      {
        id: 1,
        action: 'Hoş geldiniz!',
        detail: 'KariyerAI\'ya katıldınız',
        time: 'Az önce',
        icon: 'fa-hand-wave',
        color: 'text-yellow-500'
      }
    ];

    container.innerHTML = mockActivities.map(activity => `
      <div class="activity-item mb-3 p-3 border-l-4 border-gray-200 bg-gray-50 rounded-r-lg">
        <div class="flex items-center gap-3">
          <i class="fas ${activity.icon} ${activity.color}"></i>
          <div class="flex-1">
            <p class="text-sm font-medium">${activity.action}</p>
            <p class="text-xs text-gray-600">${activity.detail}</p>
          </div>
          <span class="text-xs text-gray-500">${activity.time}</span>
        </div>
      </div>
    `).join('');
  }, 800);
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

  // Add user avatar click handler
  const userAvatar = document.querySelector('.user-avatar');
  if (userAvatar) {
    userAvatar.addEventListener('click', () => {
      alert('Kullanıcı menüsü yakında eklenecek!');
    });
  }
}

// Debug function to check user data
function debugUserData() {
  console.log("=== User Data Debug ===");
  console.log("window.KariyerAI:", window.KariyerAI);
  console.log("window.KariyerAI.currentUser:", window.KariyerAI?.currentUser);
  
  try {
    const localStorageData = localStorage.getItem("kariyerAI_user");
    console.log("localStorage data:", localStorageData);
    if (localStorageData) {
      console.log("Parsed localStorage:", JSON.parse(localStorageData));
    }
  } catch (error) {
    console.error("Error reading localStorage:", error);
  }
  console.log("========================");
}

// Refresh dashboard data
function refreshDashboard() {
  console.log('Refreshing dashboard...');
  debugUserData(); // Add debug info
  loadUserProfile();
  loadDashboardStats();
  loadSkillGaps();
  loadUpcomingTasks();
  loadRecentActivities();
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
  loadDashboardStats,
  debugUserData
};

// Add this right after DOM loads in dashboard
console.log("=== Debug Info ===");
console.log("localStorage data:", localStorage.getItem("kariyerAI_user"));
console.log("window.KariyerAI:", window.KariyerAI);
console.log("currentUser:", window.KariyerAI?.currentUser);