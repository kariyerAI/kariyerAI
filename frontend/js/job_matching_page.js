export function initializeJobMatching() {
  loadJobListings()
  setupJobFilters()
}

export function loadJobListings() {
  const jobs = [
    {
      id: 1,
      title: "Senior Frontend Developer",
      company: "TechCorp",
      location: "İstanbul, Türkiye",
      salary: "15.000 - 25.000 TL",
      type: "Tam Zamanlı",
      posted: "2 gün önce",
      matchScore: 95,
      requiredSkills: ["React", "TypeScript", "Node.js", "GraphQL"],
      missingSkills: ["GraphQL"],
      description:
        "Deneyimli frontend developer arayışımızda. Modern web teknolojileri ile çalışacak, kullanıcı deneyimini ön planda tutan projeler geliştireceksiniz.",
      benefits: ["Esnek çalışma", "Sağlık sigortası", "Eğitim desteği"],
      applicants: 45,
    },
    {
      id: 2,
      title: "Full Stack Developer",
      company: "StartupXYZ",
      location: "Ankara, Türkiye",
      salary: "12.000 - 18.000 TL",
      type: "Tam Zamanlı",
      posted: "1 gün önce",
      matchScore: 88,
      requiredSkills: ["React", "Node.js", "MongoDB", "Docker"],
      missingSkills: ["MongoDB", "Docker"],
      description:
        "Hızla büyüyen startup'ımızda full stack developer olarak çalışacak, hem frontend hem backend geliştirme süreçlerinde yer alacaksınız.",
      benefits: ["Hisse senedi opsiyonu", "Uzaktan çalışma", "Genç ekip"],
      applicants: 23,
    },
  ]

  const jobsContainer = document.getElementById("jobListings")
  if (jobsContainer) {
    jobsContainer.innerHTML = jobs.map((job) => createJobCard(job)).join("")
  }
}

export function createJobCard(job) {
  const matchColor = job.matchScore >= 90 ? "green" : job.matchScore >= 80 ? "yellow" : "red"
  const matchText = job.matchScore >= 90 ? "Mükemmel Eşleşme" : job.matchScore >= 80 ? "İyi Eşleşme" : "Orta Eşleşme"

  return `
        <div class="card job-card">
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-start gap-4">
                    <div class="company-logo">
                        <i class="fas fa-building"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-semibold mb-1">${job.title}</h3>
                        <div class="flex items-center gap-4 text-gray-600">
                            <span><i class="fas fa-building mr-1"></i>${job.company}</span>
                            <span><i class="fas fa-map-marker-alt mr-1"></i>${job.location}</span>
                            <span><i class="fas fa-clock mr-1"></i>${job.posted}</span>
                        </div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="match-indicator ${matchColor}"></div>
                        <span class="text-sm font-medium">%${job.matchScore} Eşleşme</span>
                    </div>
                    <span class="badge badge-${matchColor}">${matchText}</span>
                </div>
            </div>
            
            <p class="text-gray-700 mb-4">${job.description}</p>
            
            <div class="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                    <h4 class="font-medium mb-2">Gerekli Beceriler</h4>
                    <div class="flex flex-wrap gap-2">
                        ${job.requiredSkills
                          .map(
                            (skill) => `
                            <span class="skill-badge ${job.missingSkills.includes(skill) ? "missing" : "have"}">
                                ${skill} ${job.missingSkills.includes(skill) ? "❌" : ""}
                            </span>
                        `,
                          )
                          .join("")}
                    </div>
                </div>
                <div>
                    <h4 class="font-medium mb-2">Yan Haklar</h4>
                    <div class="flex flex-wrap gap-2">
                        ${job.benefits.map((benefit) => `<span class="benefit-badge">${benefit}</span>`).join("")}
                    </div>
                </div>
            </div>
            
            <div class="flex items-center justify-between pt-4 border-t">
                <div class="flex items-center gap-6 text-sm text-gray-600">
                    <span><i class="fas fa-dollar-sign mr-1"></i>${job.salary}</span>
                    <span><i class="fas fa-users mr-1"></i>${job.applicants} başvuru</span>
                    <span class="badge badge-outline">${job.type}</span>
                </div>
                <div class="flex items-center gap-2">
                    <button class="btn btn-outline btn-small">
                        <i class="fas fa-heart mr-2"></i>Kaydet
                    </button>
                    ${
                      job.missingSkills.length > 0
                        ? `
                        <a href="../html/learning_path.html" class="btn btn-outline btn-small">
                            <i class="fas fa-trending-up mr-2"></i>Eksikleri Gider
                        </a>
                    `
                        : ""
                    }
                    <button class="btn btn-primary btn-small">
                        <i class="fas fa-external-link-alt mr-2"></i>Başvur
                    </button>
                </div>
            </div>
            
            ${
              job.missingSkills.length > 0
                ? `
                <div class="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p class="text-sm text-orange-800">
                        <strong>Eksik Beceriler:</strong> ${job.missingSkills.join(", ")} becerilerini öğrenerek bu pozisyon için daha uygun hale gelebilirsiniz.
                    </p>
                </div>
            `
                : ""
            }
        </div>
    `
}

export function setupJobFilters() {
  const searchInput = document.getElementById("jobSearch")
  const locationFilter = document.getElementById("locationFilter")
  const experienceFilter = document.getElementById("experienceFilter")
  const filterBtn = document.getElementById("filterBtn")

  if (filterBtn) {
    filterBtn.addEventListener("click", applyJobFilters)
  }

  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        applyJobFilters()
      }
    })
  }
}

export function applyJobFilters() {
  const searchTerm = document.getElementById("jobSearch")?.value || ""
  const location = document.getElementById("locationFilter")?.value || ""
  const experience = document.getElementById("experienceFilter")?.value || ""

  //showNotification("Filtreler uygulanıyor...", "info")

  setTimeout(() => {
   // showNotification("Filtreler uygulandı!", "success")
    loadJobListings()
  }, 1000)
}
