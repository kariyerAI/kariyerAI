document.addEventListener("DOMContentLoaded", () => {
    loadJobListings();
});

async function loadJobListings() {
    const container = document.getElementById('jobListings');
    if (!container) return;

    container.innerHTML = `
        <div class="text-center py-6">
            <i class="fas fa-spinner fa-spin text-gray-400 text-2xl mb-2"></i>
            <p class="text-gray-500">İş ilanları yükleniyor...</p>
        </div>
    `;

    const url = 'https://active-jobs-db.p.rapidapi.com/active-ats-7d?limit=3&offset=0&location_filter=%22Turkey%22%20OR%20%22T%C3%BCrkiye%22&description_type=text';
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': 'b84e009c49msh26a908b66f0cb05p173c7djsnf5c4852650bc',
            'x-rapidapi-host': 'active-jobs-db.p.rapidapi.com'
        }
    };

    try {
        const response = await fetch(url, options);
        const textData = await response.text();
        console.log("Raw Response:", textData);

        let data;
        try {
            data = JSON.parse(textData);
        } catch (e) {
            container.innerHTML = `<p class="text-red-500 text-center">API'den geçersiz veri geldi.</p>`;
            return;
        }

        const jobs = data.jobs || [];
        if (jobs.length === 0) {
            container.innerHTML = `<p class="text-gray-500 text-center">Hiç iş ilanı bulunamadı.</p>`;
            return;
        }

        const userData = JSON.parse(localStorage.getItem("kariyerAI_user") || "{}");
        const userSkills = userData.skills || [];

        container.innerHTML = jobs.map(job => {
            const matchScore = calculateMatchScore(job, userSkills);

            return `
                <div class="p-5 mb-4 border rounded-lg bg-white shadow hover:bg-gray-50 transition">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="text-lg font-semibold">${job.title || 'Başlık Yok'}</h3>
                        <span class="px-3 py-1 text-white text-sm rounded-full ${matchScore >= 60 ? 'bg-green-500' : 'bg-yellow-500'}">
                            Eşleşme: ${matchScore}%
                        </span>
                    </div>
                    <p class="text-blue-600 mb-1"><strong>Şirket:</strong> ${job.company?.name || 'Bilinmiyor'}</p>
                    <p class="text-sm text-gray-700 mb-1"><strong>Konum:</strong> ${job.location_city || 'Belirtilmemiş'}, ${job.location_country || ''}</p>
                    <p class="text-sm text-gray-700 mb-1"><strong>Çalışma Türü:</strong> ${(job.employment_type || []).join(', ') || 'Belirtilmemiş'}</p>
                    <p class="text-sm text-gray-700 mb-2"><strong>Kategori:</strong> ${(job.categories || []).map(c => c.name).join(', ') || 'Yok'}</p>
                    <div class="text-sm text-gray-700 job-desc">${job.description || 'Açıklama Yok'}</div>
                    <a href="${job.url}" target="_blank" 
                        class="text-sm text-blue-500 underline mt-3 inline-block">
                        İlanı Görüntüle
                    </a>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error("Job API error:", error);
        container.innerHTML = `<p class="text-red-500 text-center">İş ilanları alınırken hata oluştu.</p>`;
    }
}

function calculateMatchScore(job, userSkills) {
    if (!userSkills || userSkills.length === 0) return 0;
    const text = ((job.description || '') + ' ' + (job.title || '')).toLowerCase();
    let matchCount = 0;

    userSkills.forEach(skill => {
        if (text.includes(skill.toLowerCase())) {
            matchCount++;
        }
    });

    return Math.round((matchCount / userSkills.length) * 100);
}

function calculateMatchScore(job, userSkills) {
    if (!userSkills || userSkills.length === 0) return 0;

    const text = ((job.description_text || '') + ' ' + (job.title || '')).toLowerCase();
    let matchCount = 0;

    userSkills.forEach(skill => {
        if (text.includes(skill.toLowerCase())) {
            matchCount++;
        }
    });

    const score = Math.round((matchCount / userSkills.length) * 100);
    return score;
}
