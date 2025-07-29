export function initializeSkillAnalysis() {
  loadUserSkills()
  loadSkillGapsAnalysis()
  loadIndustryInsights()
}

export function loadUserSkills() {
  const userSkills = [
    {
      name: "JavaScript",
      level: 85,
      category: "Frontend",
      trend: "up",
      marketDemand: 95,
      jobCount: 1250,
      avgSalary: "18.000 TL",
      status: "strong",
    },
    {
      name: "React",
      level: 90,
      category: "Frontend",
      trend: "up",
      marketDemand: 92,
      jobCount: 980,
      avgSalary: "20.000 TL",
      status: "strong",
    },
    {
      name: "SQL",
      level: 30,
      category: "Database",
      trend: "stable",
      marketDemand: 90,
      jobCount: 1100,
      avgSalary: "17.000 TL",
      status: "critical",
    },
  ]

  const skillsContainer = document.getElementById("userSkillsAnalysis")
  if (skillsContainer) {
    skillsContainer.innerHTML = userSkills.map((skill) => createSkillAnalysisCard(skill)).join("")
  }
}

export function createSkillAnalysisCard(skill) {
  const statusColors = {
    strong: "green",
    developing: "blue",
    needs_improvement: "orange",
    critical: "red",
  }

  const statusTexts = {
    strong: "Güçlü",
    developing: "Gelişiyor",
    needs_improvement: "Geliştirilmeli",
    critical: "Kritik",
  }

  return `
        <div class="card skill-analysis-card">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                    <h4 class="font-semibold text-lg">${skill.name}</h4>
                    <span class="badge badge-outline">${skill.category}</span>
                    <span class="badge badge-${statusColors[skill.status]}">${statusTexts[skill.status]}</span>
                </div>
                <div class="flex items-center gap-2">
                    <i class="fas fa-trending-${skill.trend === "up" ? "up text-green-500" : skill.trend === "down" ? "down text-red-500" : "right text-gray-500"}"></i>
                    <span class="text-sm text-gray-600">${skill.jobCount} iş ilanı</span>
                </div>
            </div>
            
            <div class="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                    <p class="text-sm text-gray-600 mb-1">Seviyeniz</p>
                    <div class="flex items-center gap-2">
                        <div class="progress flex-1">
                            <div class="progress-bar" style="width: ${skill.level}%"></div>
                        </div>
                        <span class="text-sm font-medium">%${skill.level}</span>
                    </div>
                </div>
                <div>
                    <p class="text-sm text-gray-600 mb-1">Pazar Talebi</p>
                    <div class="flex items-center gap-2">
                        <div class="progress flex-1">
                            <div class="progress-bar" style="width: ${skill.marketDemand}%"></div>
                        </div>
                        <span class="text-sm font-medium">%${skill.marketDemand}</span>
                    </div>
                </div>
                <div>
                    <p class="text-sm text-gray-600 mb-1">Ortalama Maaş</p>
                    <p class="font-medium">${skill.avgSalary}</p>
                </div>
            </div>
            
            ${
              skill.status === "critical"
                ? `
                <div class="bg-red-50 border border-red-200 rounded p-3">
                    <p class="text-sm text-red-800">
                        <i class="fas fa-exclamation-circle mr-1"></i>
                        Bu beceri kritik seviyede. Hemen geliştirmeye başlamanızı öneriyoruz.
                    </p>
                </div>
            `
                : ""
            }
        </div>
    `
}

export function loadSkillGapsAnalysis() {
  console.log("Detaylı beceri eksikliği analizi yüklendi.")
}

export function loadIndustryInsights() {
  console.log("Sektör içgörüleri yüklendi.")
}
