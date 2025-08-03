function initializeSkillAnalysis() {
  loadUserSkills()
  loadMissingSkills();
  loadSkillGapsAnalysis()
  loadLLMIndustryInsights()
}

async function loadUserSkills() {
    let user = JSON.parse(localStorage.getItem("kariyerAI_user")) || {};
    let userId = user.id || null;

    if (!userId) return;

    try {
        // 1️⃣ Kullanıcı becerilerini getir
        const response = await fetch(`http://127.0.0.1:5000/get-profile/${userId}`);
        const data = await response.json();

        // 2️⃣ Kaydedilmiş skill seviyelerini getir
        const response2 = await fetch(`http://127.0.0.1:5000/api/get-skill-levels/${userId}`);
        const skillLevelsData = await response2.json();
        const savedLevels = skillLevelsData.success ? skillLevelsData.data : [];

        if (data.success && data.data.skills) {
            const userSkills = data.data.skills;

            document.getElementById("userSkillsAnalysis").innerHTML = userSkills.map(skill => {
                // Daha önce kaydedilen seviye varsa onu kullan, yoksa 50
                let saved = savedLevels.find(s => s.skill.toLowerCase() === skill.toLowerCase());
                let level = saved ? saved.level : 50;

                return `
                    <div class="card skill-analysis-card">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-semibold text-lg">${capitalizeWords(skill)}</h4>
                            <span id="skillValue-${skill}" class="text-sm font-medium">${level}%</span>
                        </div>
                        <input type="range" min="0" max="100" value="${level}"
                            class="w-full skill-slider"
                            data-skill="${skill}"
                            oninput="document.getElementById('skillValue-${skill}').textContent=this.value+'%'"
                        />
                    </div>
                `;
            }).join('');
        }

    } catch (error) {
        console.error("Beceriler yüklenemedi:", error);
    }
}




function loadSkillGapsAnalysis() {
  console.log("Detaylı beceri eksikliği analizi yüklendi.")
}

document.addEventListener('DOMContentLoaded', async () => {
    let user = JSON.parse(localStorage.getItem("kariyerAI_user")) || {};
    let userId = user.id || null;

    if (!userId) {
        document.getElementById('missingSkillsList').innerHTML = `<p>Kullanıcı bulunamadı.</p>`;
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:5000/api/missing_skills/${userId}`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            document.getElementById('missingSkillsList').innerHTML = data.data.map(item => `
                <div class="skill-gap-card">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <h4 class="font-semibold">${capitalizeWords(item.skill)}</h4>
                            <span class="badge badge-red">Eksik</span>
                        </div>
                        <a href="../html/learning_path_page.html" class="btn btn-primary btn-small">
                            <i class="fas fa-book-open mr-2"></i> Öğrenmeye Başla
                        </a>
                    </div>
                    <div class="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p class="text-gray-600">Kaydedildi</p>
                            <p class="font-medium">${new Date(item.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p class="text-gray-600">Durum</p>
                            <p class="font-medium">Geliştirilmeli</p>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            document.getElementById('missingSkillsList').innerHTML = `<p>Eksik beceri kaydı bulunamadı.</p>`;
        }
    } catch (error) {
        console.error("Eksik beceriler alınamadı:", error);
    }
});
function capitalizeWords(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .split(/\s+/) // birden fazla boşluğu da yakalar
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

async function loadMissingSkills() {
    let user = JSON.parse(localStorage.getItem("kariyerAI_user")) || {};
    let userId = user.id || null;

    if (!userId) {
        document.getElementById('missingSkillsList').innerHTML = `<p>Kullanıcı bulunamadı.</p>`;
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:5000/api/missing_skills/${userId}`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            document.getElementById('missingSkillsList').innerHTML = data.data.map(item => {
                let skillName = capitalizeWords(item.skill.trim());
                return `
                    <div class="skill-gap-card">
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center gap-3">
                                <h4 class="font-semibold">${skillName}</h4>
                                <span class="badge badge-red">Eksik</span>
                            </div>
                            <a href="../html/learning_path_page.html" class="btn btn-primary btn-small">
                                <i class="fas fa-book-open mr-2"></i> Öğrenmeye Başla
                            </a>
                        </div>
                        <div class="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p class="text-gray-600">Kaydedildi</p>
                                <p class="font-medium">${new Date(item.created_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p class="text-gray-600">Durum</p>
                                <p class="font-medium">Geliştirilmeli</p>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            document.getElementById('missingSkillsList').innerHTML = `<p>Eksik beceri kaydı bulunamadı.</p>`;
        }
    } catch (error) {
        console.error("Eksik beceriler alınamadı:", error);
        document.getElementById('missingSkillsList').innerHTML = `<p>Sunucu hatası.</p>`;
    }
}
// Slider değiştikçe değeri kaydet
document.addEventListener("input", async (e) => {
    if (e.target.classList.contains("skill-slider")) {
        let skill = e.target.dataset.skill;
        let level = e.target.value;

        let user = JSON.parse(localStorage.getItem("kariyerAI_user")) || {};
        let userId = user.id;

        await fetch("http://127.0.0.1:5000/api/save-skill-level", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, skill: skill, level: level })
        });
    }
});
async function loadLLMIndustryInsights() {
    let user = JSON.parse(localStorage.getItem("kariyerAI_user")) || {};
    let userId = user.id || null;

    if (!userId) {
        document.getElementById("llmIndustryInsights").innerHTML = `<p>Kullanıcı bulunamadı.</p>`;
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:5000/generate-industry-insights/${userId}`);
        const data = await response.json();

        if (data.success && data.insights) {
            const formatted = data.insights
                .replace(/##/g, "<h3>")
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/(?:\r\n|\r|\n)/g, "<br>")
                .replace(/(\d+\.\s)/g, "<br>👉 $1");

            document.getElementById("llmIndustryInsights").innerHTML = `
                <div class="industry-insight-box">
                    ${formatted}
                </div>
            `;
        } else {
            document.getElementById("llmIndustryInsights").innerHTML = `<p>İçgörü bulunamadı.</p>`;
        }
    } catch (error) {
        console.error("LLM içgörü hatası:", error);
        document.getElementById("llmIndustryInsights").innerHTML = `<p>Veri alınamadı.</p>`;
    }
}



document.addEventListener("DOMContentLoaded", () => {
    loadLLMIndustryInsights();
});

