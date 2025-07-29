export function initializeLearningPath() {
  loadSkillTrees()
  setupSkillTreeNavigation()
  loadAchievements()
}

export function loadSkillTrees() {
  const skillTrees = {
    sql: {
      name: "SQL",
      description: "Veritabanı yönetimi ve sorgulama",
      totalModules: 8,
      completedModules: 2,
      estimatedTime: "4-6 hafta",
      difficulty: "Orta",
      modules: [
        {
          id: 1,
          title: "SQL Temelleri",
          description: "Veritabanı kavramları ve temel SQL komutları",
          status: "completed",
          duration: "2 saat",
          xp: 100,
          type: "video",
        },
        {
          id: 2,
          title: "SELECT ve Filtreleme",
          description: "Veri sorgulama ve filtreleme teknikleri",
          status: "completed",
          duration: "3 saat",
          xp: 150,
          type: "interactive",
        },
        {
          id: 3,
          title: "JOIN İşlemleri",
          description: "Tablolar arası ilişkiler ve birleştirme",
          status: "current",
          duration: "4 saat",
          xp: 200,
          type: "project",
        },
      ],
    },
  }
  displaySkillTree(skillTrees.sql)
}

export function displaySkillTree(skillTree) {
  const container = document.getElementById("skillTreeContainer")
  if (!container) return

  container.innerHTML = `
        <div class="card mb-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold">${skillTree.name} Öğrenme Yolu</h2>
                    <p class="text-gray-600">${skillTree.description}</p>
                </div>
                <div class="text-right">
                    <span class="badge badge-outline mb-2">${skillTree.difficulty}</span>
                    <p class="text-sm text-gray-600">Tahmini süre: ${skillTree.estimatedTime}</p>
                </div>
            </div>
            <div class="mt-4">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm text-gray-600">İlerleme: ${skillTree.completedModules}/${skillTree.totalModules} modül tamamlandı</span>
                    <span class="text-sm font-medium">%${Math.round((skillTree.completedModules / skillTree.totalModules) * 100)}</span>
                </div>
                <div class="progress">
                    <div class="progress-bar" style="width: ${(skillTree.completedModules / skillTree.totalModules) * 100}%"></div>
                </div>
            </div>
        </div>
        
        <div class="modules-container">
            ${skillTree.modules.map((module, index) => createModuleCard(module, index)).join("")}
        </div>
    `
}

export function createModuleCard(module, index) {
  const statusIcons = {
    completed: "fa-check-circle text-green-500",
    current: "fa-play-circle text-blue-500",
    available: "fa-circle text-gray-400",
    locked: "fa-lock text-gray-300",
  }

  const statusColors = {
    completed: "green",
    current: "blue",
    available: "gray",
    locked: "gray",
  }

  return `
        <div class="card module-card ${module.status === "current" ? "current-module" : ""}">
            <div class="flex items-start gap-4">
                <div class="flex flex-col items-center">
                    <div class="module-status-indicator ${statusColors[module.status]}">
                        <i class="fas ${statusIcons[module.status]}"></i>
                    </div>
                    ${index < 2 ? '<div class="module-connector"></div>' : ""}
                </div>
                
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-lg font-semibold">${module.title}</h3>
                        <div class="flex items-center gap-2">
                            <i class="fas ${getModuleTypeIcon(module.type)}"></i>
                            <span class="badge badge-outline">${module.type}</span>
                        </div>
                    </div>
                    
                    <p class="text-gray-600 mb-4">${module.description}</p>
                    
                    <div class="flex items-center gap-6 text-sm text-gray-500 mb-4">
                        <span><i class="fas fa-clock mr-1"></i>${module.duration}</span>
                        <span><i class="fas fa-star mr-1"></i>+${module.xp} XP</span>
                    </div>
                    
                    <div class="flex items-center gap-3">
                        ${getModuleActionButton(module)}
                    </div>
                </div>
            </div>
        </div>
    `
}

export function getModuleTypeIcon(type) {
  const icons = {
    video: "fa-video",
    interactive: "fa-code",
    project: "fa-file-alt",
    quiz: "fa-bolt",
  }
  return icons[type] || "fa-book-open"
}

export function getModuleActionButton(module) {
  switch (module.status) {
    case "completed":
      return '<button class="btn btn-outline btn-small"><i class="fas fa-check-circle mr-2"></i>Tamamlandı</button>'
    case "current":
      return '<button class="btn btn-primary btn-small"><i class="fas fa-play mr-2"></i>Devam Et</button>'
    case "available":
      return '<button class="btn btn-primary btn-small"><i class="fas fa-arrow-right mr-2"></i>Başla</button>'
    case "locked":
      return '<button class="btn btn-outline btn-small" disabled><i class="fas fa-lock mr-2"></i>Kilitli</button>'
    default:
      return ""
  }
}

export function setupSkillTreeNavigation() {
  console.log("Beceri ağacı navigasyonu ayarlandı.")
}

export function loadAchievements() {
  console.log("Başarılar yüklendi.")
}
