function initializeApp() {
  console.log("KariyerAI uygulaması başlatılıyor...");

  const userData = localStorage.getItem("kariyerAI_user");
  if (userData) {
    currentUser = JSON.parse(userData);
  }

  const currentPage = getCurrentPage();
  switch (currentPage) {
    case "onboarding_page":
      initializeHomePage();
      break;
    case "create_profile_page":
      initializeProfilePage();
      break;
    case "dashboard_page":
      initializeDashboard();
      break;
    case "job_matching":
      initializeJobMatching();
      break;
    case "skill_analysis":
      initializeSkillAnalysis();
      break;
    case "learning_path_page":
      initializeLearningPath();
      break;
    case "career_simulation":
      initializeCareerSimulation();
      break;
    case "ilerleme-takibi":
      initializeProgressTracking();
      break;
  }
}
// Dashboard Functions
// Dashboard Functions - Güncellenmiş versiyon
function initializeDashboard() {
  // Kullanıcı kontrolü
  loadUserData(); // Önce kullanıcı verilerini yükle
  
  if (!currentUser) {
    console.log("Kullanıcı oturumu bulunamadı, profil oluşturma sayfasına yönlendiriliyor...");
    window.location.href = "../html/create_profile_page.html";
    return;
  }

  console.log("Dashboard başlatılıyor, kullanıcı:", currentUser);
  
  // Kullanıcı bilgilerini güncelle
  updateUserWelcomeMessage();
  updateDashboardStats();
  loadRecentActivities();
  loadSkillGaps();
  loadUpcomingTasks();
}

// Kullanıcı karşılama mesajını güncelle
function updateUserWelcomeMessage() {
  const welcomeMessage = document.querySelector('h1');
  const userDescription = document.querySelector('p.text-gray-600');
  
  if (currentUser && welcomeMessage) {
    const firstName = currentUser.firstName || 'Kullanıcı';
    const currentTitle = currentUser.currentTitle || '';
    
    // Hoş geldin mesajını güncelle
    welcomeMessage.innerHTML = `Hoş geldin, ${firstName}! 👋`;
    
    // Alt açıklama metnini güncelle
    if (userDescription && currentTitle) {
      userDescription.textContent = `${currentTitle} olarak kariyerinde bugün hangi adımı atacaksın?`;
    } else if (userDescription) {
      userDescription.textContent = `Kariyerinde bugün hangi adımı atacaksın?`;
    }
    
    console.log(`Hoş geldin mesajı güncellendi: ${firstName}`);
  }
}

// Kullanıcı profilini navbar'da güncelle
function updateUserProfile() {
  const userAvatar = document.querySelector('.user-avatar');
  
  if (currentUser && userAvatar) {
    // Eğer kullanıcının profil fotoğrafı varsa onu göster
    if (currentUser.profilePhoto) {
      userAvatar.innerHTML = `<img src="${currentUser.profilePhoto}" alt="Profil" class="w-8 h-8 rounded-full">`;
    } else {
      // İlk harflerle avatar oluştur
      const initials = getInitials(currentUser.firstName, currentUser.lastName);
      userAvatar.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
          ${initials}
        </div>
      `;
    }
  }
}

// İsim ve soyisimden baş harfleri al
function getInitials(firstName, lastName) {
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return first + last || 'U'; // Eğer isim yoksa 'U' (User) kullan
}

// Dashboard istatistiklerini kullanıcı verilerine göre güncelle
function updateDashboardStats() {
  // Kullanıcının gerçek verilerini kullan
  const userXP = currentUser.xp || 150; // Yeni kullanıcı için başlangıç XP
  const userLevel = getUserLevel(userXP);
  const nextLevelXP = getNextLevelXP(userXP);
  const userSkillsCount = currentUser.skills ? currentUser.skills.length : 0;
  const completedCourses = currentUser.completedCourses || 0;
  
  // Dinamik iş eşleştirme sayısı (beceri sayısına ve lokasyona göre)
  const baseJobMatches = Math.min(Math.max(userSkillsCount * 3, 2), 30);
  const locationMultiplier = getLocationJobMultiplier(currentUser.location);
  const jobMatches = Math.round(baseJobMatches * locationMultiplier);
  
  const stats = {
    xp: userXP,
    level: userLevel,
    nextLevelXp: nextLevelXP,
    jobMatches: jobMatches,
    completedCourses: completedCourses,
    skillsLearned: userSkillsCount,
  };

  console.log("Dashboard istatistikleri güncelleniyor:", stats);

  // Stat display'lerini güncelle
  updateElement("userLevel", stats.level);
  updateElement("jobMatches", stats.jobMatches);
  updateElement("completedCourses", stats.completedCourses);

  // Progress bar'ı güncelle
  const xpProgress = document.getElementById("xpProgress");
  if (xpProgress) {
    const progressBar = xpProgress.querySelector(".progress-bar");
    const xpText = xpProgress.parentElement.querySelector(".text-xs.text-gray-500");
    
    if (progressBar && stats.nextLevelXp > 0) {
      const progressPercent = (stats.xp / stats.nextLevelXp) * 100;
      progressBar.style.width = `${Math.min(progressPercent, 100)}%`;
    }
    
    if (xpText) {
      xpText.textContent = `${stats.xp} / ${stats.nextLevelXp} XP`;
    }
  }

  // Haftalık progress güncelle
  updateWeeklyProgress(stats.xp);

  // Yeni badge'ler varsa göster
  if (stats.xp > 0 && stats.xp % 500 === 0) {
    showNotification(`Tebrikler! ${stats.level} seviyesine ulaştınız! 🎉`, "success");
  }
}
// XP'ye göre seviye hesapla
function getUserLevel(xp) {
  if (xp < 500) return "Başlangıç";
  if (xp < 1500) return "Junior";
  if (xp < 3000) return "Mid-Level";
  if (xp < 5000) return "Senior";
  return "Expert";
}

// Bir sonraki seviye için gerekli XP'yi hesapla
function getNextLevelXP(currentXP) {
  const levels = [500, 1500, 3000, 5000, 10000];
  for (let levelXP of levels) {
    if (currentXP < levelXP) {
      return levelXP;
    }
  }
  return levels[levels.length - 1]; // Max level
}

// initializeDashboard fonksiyonunu çağırdığımızda kullanıcı profil bilgilerini de güncelle
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
  setupEventListeners();
  loadUserData();
  setupAnimations();
  
  // Dashboard sayfasındaysak kullanıcı profilini güncelle
  if (getCurrentPage() === "dashboard") {
    updateUserProfile();
  }
});


// Load Recent Activities
function loadRecentActivities() {
  const activities = [
    { type: "course", title: "React Hooks Eğitimi Tamamlandı", time: "2 saat önce", xp: 150 },
    { type: "skill", title: "TypeScript becerisi eklendi", time: "1 gün önce", xp: 100 },
    { type: "job", title: "5 yeni iş eşleştirmesi", time: "2 gün önce", xp: 0 },
    { type: "achievement", title: "Frontend Master rozetini kazandınız", time: "3 gün önce", xp: 200 },
  ]

  const activitiesContainer = document.getElementById("recentActivities")
  if (activitiesContainer) {
    activitiesContainer.innerHTML = activities
      .map(
        (activity) => `
            <div class="flex items-start gap-3 p-3 border rounded-lg">
                <div class="activity-icon ${activity.type}">
                    <i class="fas ${getActivityIcon(activity.type)}"></i>
                </div>
                <div class="flex-1">
                    <p class="font-medium text-sm">${activity.title}</p>
                    <p class="text-xs text-gray-500">${activity.time}</p>
                    ${activity.xp > 0 ? `<span class="badge">+${activity.xp} XP</span>` : ""}
                </div>
            </div>
        `,
      )
      .join("")
  }
}

// Get Activity Icon
function getActivityIcon(type) {
  const icons = {
    course: "fa-book-open",
    skill: "fa-star",
    job: "fa-briefcase",
    achievement: "fa-trophy",
  }
  return icons[type] || "fa-circle"
}

// Load Skill Gaps
function loadSkillGaps() {
  const skillGaps = [
    { skill: "Node.js", importance: "Yüksek", jobs: 15, progress: 0 },
    { skill: "SQL", importance: "Orta", jobs: 8, progress: 30 },
    { skill: "Docker", importance: "Orta", jobs: 6, progress: 0 },
  ]

  const skillGapsContainer = document.getElementById("skillGaps")
  if (skillGapsContainer) {
    skillGapsContainer.innerHTML = skillGaps
      .map(
        (gap) => `
            <div class="flex items-center justify-between p-4 border rounded-lg">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <h4 class="font-medium">${gap.skill}</h4>
                        <span class="badge ${gap.importance === "Yüksek" ? "badge-danger" : "badge-secondary"}">${gap.importance}</span>
                    </div>
                    <p class="text-sm text-gray-600">${gap.jobs} iş ilanında gerekli</p>
                    ${
                      gap.progress > 0
                        ? `
                        <div class="progress mt-2">
                            <div class="progress-bar" style="width: ${gap.progress}%"></div>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">%${gap.progress} tamamlandı</p>
                    `
                        : ""
                    }
                </div>
                <a href="../html/learning_path_page.html" class="btn btn-small btn-primary">
                    ${gap.progress > 0 ? "Devam Et" : "Başla"}
                </a>
            </div>
        `,
      )
      .join("")
  }
}

// Load Upcoming Tasks
function loadUpcomingTasks() {
  const tasks = [
    { title: "JavaScript ES6+ Quiz", type: "quiz", deadline: "Bugün", difficulty: "Kolay" },
    { title: "React Project: Todo App", type: "project", deadline: "3 gün", difficulty: "Orta" },
    { title: "API Integration Senaryosu", type: "scenario", deadline: "1 hafta", difficulty: "Zor" },
  ]

  const tasksContainer = document.getElementById("upcomingTasks")
  if (tasksContainer) {
    tasksContainer.innerHTML = tasks
      .map(
        (task) => `
            <div class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div class="flex items-center gap-3">
                    <div class="task-indicator ${task.type}"></div>
                    <div>
                        <h4 class="font-medium">${task.title}</h4>
                        <p class="text-sm text-gray-600">${task.deadline} • ${task.difficulty}</p>
                    </div>
                </div>
                <button class="btn btn-small">
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `,
      )
      .join("")
  }
}
