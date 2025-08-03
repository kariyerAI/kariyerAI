document.addEventListener('DOMContentLoaded', () => {
    console.log("Job Matching Page Loaded");
    loadJobListings();
});

async function loadJobListings() {
    const container = document.getElementById('jobListings');
    const countElement = document.getElementById('jobCount');
    container.innerHTML = `<p class="text-center text-gray-500">İş ilanları yükleniyor...</p>`;

    // Kullanıcı bilgilerini al
    let user = JSON.parse(localStorage.getItem("kariyerAI_user")) || {};
    let userSkills = (user.skills || []).map(s => s.toLowerCase());
    let userTitle = (user.current_title || user.currentTitle || user.title || "").trim();
    let userLocation = (user.location || "Turkey").toLowerCase();

    console.log("DEBUG → Title:", userTitle);
    console.log("DEBUG → Location:", userLocation);


    try {
        // API çağrısı
        const params = new URLSearchParams({
            title: userTitle,
            location: userLocation
        });
        const response = await fetch(`http://127.0.0.1:5000/api/jobs?${params.toString()}`);

        if (!response.ok) throw new Error(`API isteği başarısız: ${response.status}`);

        const data = await response.json();
        console.log("Job API response:", data);

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

            // ✅ Anahtar kelimeler
            let keywords = [];
            const words = (title + " " + description).toLowerCase().split(/[\s,.;]+/);
            userSkills.forEach(skill => {
                if (words.includes(skill)) keywords.push(skill);
            });
            keywords = [...new Set(keywords)];

            // ✅ Eşleşme skoru
            let score = 0;
            let wordsInTitle = title.toLowerCase().split(" ");
            if (userTitle && wordsInTitle.some(word => userTitle.includes(word))) {
                score += 30;
            }
            if (userSkills.length > 0) {
                let matched = userSkills.filter(skill => textContainsWord(title + " " + description, skill)).length;
                score += Math.min((matched / userSkills.length) * 70, 70);
            }
            score = Math.min(Math.round(score), 100);

            // ✅ Kullanıcı becerileri karşılaştırma
            let jobText = (title + " " + description).toLowerCase().replace(/[^\w\s]/g, ' ');

            // ✅ Daha güvenilir eşleşme (regex word boundary)
            // Kullanıcı becerileri karşılaştırma
            let jobRequirements = (job.requirements || []).map(r => r.toLowerCase().trim());
            let userSkillSet = new Set(userSkills.map(s => s.toLowerCase().trim()));

            let matchedSkills = jobRequirements.filter(skill => userSkillSet.has(skill));
            let missingSkills = jobRequirements.filter(skill => !userSkillSet.has(skill));

            let skillsHTML = `
                <div class="skills-container mt-2">
                    <strong>✅ Eşleşen Yetenekler:</strong>
                    <div class="skills-list">
                        ${matchedSkills.length > 0
                            ? matchedSkills.map(skill => `<span class="skill-badge skill-have">${skill}</span>`).join('')
                            : '<span class="skill-badge skill-none">Yok</span>'}
                    </div>
                    <strong class="mt-2 block">❌ Eksik Yetenekler:</strong>
                    <div class="skills-list">
                        ${missingSkills.length > 0
                            ? missingSkills.map(skill => `<span class="skill-badge skill-missing">${skill}</span>`).join('')
                            : '<span class="skill-badge skill-none">Yok</span>'}
                    </div>
                </div>
            `;


            // ✅ HTML kart tasarımı
            const card = document.createElement("div");
            card.classList.add("job-card");
            card.innerHTML = `
                <div class="company-logo">
                    <i class="fas fa-building"></i>
                </div>
                <div class="flex-1">
                    <div class="flex justify-between items-center">
                        <h3 class="job-title text-lg font-bold text-gray-800">${title}</h3>
                        <span class="match-score">${score}% Eşleşme</span>
                    </div>
                    <p class="company-name text-blue-600 font-medium mt-1">${company}</p>
                    <p class="text-sm text-gray-600 mt-1"><i class="fas fa-map-marker-alt"></i> ${location}</p>
                    <p class="text-gray-700 mt-3">${description}</p>
                    <div class="keywords mt-2">${keywords.map(k => `<span class="keyword-badge">${k}</span>`).join(" ")}</div>
                    <div class="skills-section mt-3">
                        ${skillsHTML}
                    </div>
                    <a href="${url}" target="_blank" class="btn-view mt-3 inline-block">
                        İlanı Görüntüle
                    </a>
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
function normalizeText(text) {
    return (text || "").toLowerCase().trim();
}

function textContainsWord(text, word) {
    let normalizedText = normalizeText(text);
    let normalizedWord = normalizeText(word);
    let words = normalizedText.split(/\s+/); // kelimelere ayır
    return words.includes(normalizedWord);
}
