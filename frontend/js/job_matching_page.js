let savedMissingSkills = new Set();
let userSkillsSet = new Set();

// ✅ Sayfa yüklendiğinde çalışır (tek sefer)
if (!window.jobPageLoaded) {
    window.jobPageLoaded = true;
    document.addEventListener('DOMContentLoaded', async () => {
        console.log("Job Matching Page Loaded");

        let user = JSON.parse(localStorage.getItem("kariyerAI_user")) || {};
        let userId = user.id || "guest";

        // Kullanıcının mevcut becerilerini al
        userSkillsSet = new Set((user.skills || []).map(s => s.toLowerCase()));

        // Eksik becerileri DB'den çek
        try {
            const resp = await fetch(`http://127.0.0.1:5000/api/missing_skills/${userId}`);
            const data = await resp.json();
            if (data.success && data.data.length > 0) {
                savedMissingSkills = new Set(data.data.map(item => item.skill.toLowerCase()));
            }
        } catch (err) {
            console.error("Eksik beceriler alınamadı:", err);
        }

        // İş ilanlarını yükle
        loadJobListings();
    });
}

// ✅ İş ilanlarını yükle
async function loadJobListings() {
    const container = document.getElementById('jobListings');
    const countElement = document.getElementById('jobCount');
    container.innerHTML = `<p class="text-center text-gray-500">İş ilanları yükleniyor...</p>`;

    let user = JSON.parse(localStorage.getItem("kariyerAI_user")) || {};
    let userSkills = (user.skills || []).map(s => s.toLowerCase());
    let userTitle = (user.current_title || user.currentTitle || user.title || "").trim();
    let userLocation = (user.location || "Turkey").toLowerCase();

    try {
        const params = new URLSearchParams({ title: userTitle, location: userLocation });
        const response = await fetch(`http://127.0.0.1:5000/api/jobs?${params.toString()}`);
        if (!response.ok) throw new Error(`API isteği başarısız: ${response.status}`);

        const data = await response.json();
        if (!data.jobs || data.jobs.length === 0) {
            container.innerHTML = `<p class="text-center text-gray-500">Hiç iş ilanı bulunamadı.</p>`;
            countElement.textContent = "0";
            return;
        }

        container.innerHTML = "";
        data.jobs.forEach(job => {
            const title = job.title || "İlan Başlığı Yok";
            const company = job.company?.name || "Şirket Bilgisi Yok";
            const description = (job.description || "Açıklama bulunamadı.").substring(0, 200) + "...";
            const location = job.location_city || job.location_country || "Konum Belirtilmemiş";
            const url = job.url || "#";

            let jobRequirements = (job.requirements || []).map(r => r.toLowerCase().trim());
            let matchedSkills = jobRequirements.filter(skill => userSkillsSet.has(skill));
            let missingSkills = jobRequirements.filter(skill => !userSkillsSet.has(skill));
            // ✅ Eşleşme oranını hesapla
            let totalSkills = jobRequirements.length;
            let matchPercentage = totalSkills > 0 ? Math.round((matchedSkills.length / totalSkills) * 100) : 0;


            let skillsHTML = `
                <div class="skills-container mt-2">
                    <strong>✅ Eşleşen Yetenekler:</strong>
                    <div class="skills-list">
                    ${matchedSkills.length > 0
                        ? matchedSkills.map(skill => `<span class="skill-badge skill-have">${capitalizeWords(skill)}</span>`).join('')
                        : '<span class="skill-badge skill-none">Yok</span>'}
                    </div>
                    <strong class="mt-2 block">❌ Eksik Yetenekler:</strong>
                    <div class="skills-list">
                    ${missingSkills.length > 0
                      ?missingSkills.map(skill => {
                      const isAlreadySaved = savedMissingSkills.has(skill);
                      return `
                          <div class="skill-badge skill-missing">
                              <span>
                                  ${capitalizeWords(skill)}
                                  ${isAlreadySaved ? `
                                      <span class="tooltip-icon" data-tooltip="Bu beceri zaten Eksik Bilgiler tablonuzda kayıtlı">
                                          <i class="fas fa-exclamation-circle"></i>
                                      </span>` : ''}
                              </span>
                              <div class="action-buttons">
                                  <button class="action-btn learn-btn save-missing-btn" data-skill="${skill}">
                                      <i class="fas fa-book-open"></i> Öğrenmek İstiyorum
                                  </button>
                                  <button class="action-btn know-btn know-skill-btn" data-skill="${skill}">
                                      <i class="fas fa-check-circle"></i> Biliyorum
                                  </button>
                              </div>
                          </div>
                      `;
                  }).join('')

                      : '<span class="skill-badge skill-none">Yok</span>'}

                    </div>
                </div>
            `;

            const card = document.createElement("div");
            card.classList.add("job-card");
            card.innerHTML = `
                <div class="company-logo"><i class="fas fa-building"></i></div>
                <div class="flex-1">
                <div class="flex justify-between items-center">
                    <h3 class="job-title text-lg font-bold text-gray-800">${title}</h3>
                    <span class="match-score">${matchPercentage}% Eşleşme</span>
                </div>

                    <p class="company-name text-blue-600 font-medium mt-1">${company}</p>
                    <p class="text-sm text-gray-600 mt-1"><i class="fas fa-map-marker-alt"></i> ${location}</p>
                    <p class="text-gray-700 mt-3">${description}</p>
                    <div class="skills-section mt-3">${skillsHTML}</div>
                    <a href="${url}" target="_blank" class="btn-view mt-3 inline-block">İlanı Görüntüle</a>
                </div>
            `;
            container.appendChild(card);
        });

        countElement.textContent = data.jobs.length;

    } catch (error) {
        console.error("Job API error:", error);
        container.innerHTML = `<p class="text-center text-red-500">İş ilanları alınırken hata oluştu.</p>`;
    }
}

function capitalizeWords(str) {
    if (!str) return '';
    return str.toLowerCase().split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

// ✅ Butonlar için click event
document.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const skill = btn.getAttribute("data-skill");
    if (!skill) return;

    let user = JSON.parse(localStorage.getItem("kariyerAI_user")) || {};
    let userId = user.id || "guest";

    // 📌 Eksik beceriye ekleme
    if (btn.classList.contains("save-missing-btn")) {
        if (savedMissingSkills.has(skill)) {
            alert(`"${capitalizeWords(skill)}" zaten eksik bilgilerde.`);
            return;
        }
        const confirmSave = confirm(`"${capitalizeWords(skill)}" becerisini eksik bilgiler listesine eklemek ister misiniz?`);
        if (confirmSave) {
            try {
                const response = await fetch("http://127.0.0.1:5000/api/missing_skills", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user_id: userId, skill: skill })
                });
                if (response.ok) {
                    savedMissingSkills.add(skill);
                    btn.innerHTML = '<i class="fas fa-check"></i>';
                    btn.classList.add("saved-btn");
                    alert(`"${capitalizeWords(skill)}" eksik bilgiler tablosuna eklendi.`);
                }
            } catch (err) { console.error("Kaydetme hatası:", err); }
        }
    }

  // 📌 Beceriyi biliyorum → profile.skills'e ekleme
  if (btn.classList.contains("know-skill-btn")) {
      if (userSkillsSet.has(skill)) {
          alert(`"${capitalizeWords(skill)}" zaten profilinizde mevcut.`);
          return;
      }
      const confirmAdd = confirm(`"${capitalizeWords(skill)}" becerisini bildiğinizden emin misiniz? Profilinize eklensin mi?`);
      if (confirmAdd) {
          try {
              let updatedSkills = [...userSkillsSet, skill];

              // 1️⃣ Profili güncelle
              const response = await fetch(`http://127.0.0.1:5000/update-skills/${userId}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ skills: updatedSkills })
              });

              if (response.ok) {
                  // ✅ LocalStorage güncelle
                  userSkillsSet.add(skill);
                  user.skills = updatedSkills;
                  localStorage.setItem("kariyerAI_user", JSON.stringify(user));

                  // 2️⃣ skill_levels tablosuna varsayılan %50 olarak ekle
                  await fetch(`http://127.0.0.1:5000/save-skill-level`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                          user_id: userId,
                          skill: skill,
                          level: 50
                      })
                  });

                  alert(`"${capitalizeWords(skill)}" profilinize eklendi.`);
                  loadJobListings(); // ✅ Sayfayı yeniden render et
              }
          } catch (err) {
              console.error("Profil beceri ekleme hatası:", err);
          }
      }
  }
}
);
function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast-message toast-${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 100);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}
