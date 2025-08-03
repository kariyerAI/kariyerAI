// Kişilik ve Öğrenme Stili Değerlendirmesi JavaScript

let currentQuestion = 0;
let responses = [];
let currentUser = null;

// Değerlendirme soruları
const assessmentQuestions = [
    // Extraversion vs Introversion
    {
        id: 1,
        text: "Büyük bir projede çalışırken hangi yaklaşımı tercih edersiniz?",
        options: [
            { value: "E", text: "Ekip toplantıları düzenleyip herkesle brainstorm yaparım" },
            { value: "I", text: "Önce kendi başıma plan yapar, sonra ekiple paylaşırım" },
            { value: "E", text: "Sürekli ekip üyeleriyle konuşarak ilerlerim" },
            { value: "I", text: "Belirli aralıklarla rapor vererek sessizce çalışırım" }
        ],
        dimension: "extraversion"
    },
    {
        id: 2,
        text: "Yeni bir teknoloji öğrenirken hangi yöntemi tercih edersiniz?",
        options: [
            { value: "S", text: "Adım adım tutorial takip ederim" },
            { value: "N", text: "Genel konseptleri öğrenip denemeler yaparım" },
            { value: "S", text: "Örneklerle ve pratik uygulamalarla öğrenirim" },
            { value: "N", text: "Teoriyi anlamaya odaklanır, sonra uygularım" }
        ],
        dimension: "sensing"
    },
    {
        id: 3,
        text: "Ekip çatışması yaşandığında nasıl yaklaşırsınız?",
        options: [
            { value: "T", text: "Objektif verilere bakarak mantıklı çözüm ararım" },
            { value: "F", text: "Herkesin duygularını dikkate alarak çözüm bulurum" },
            { value: "T", text: "Prosedürlere uygun şekilde sorunu çözerim" },
            { value: "F", text: "İnsani ilişkileri korumaya odaklanırım" }
        ],
        dimension: "thinking"
    },
    {
        id: 4,
        text: "Proje deadline'ları konusunda hangi yaklaşımı benimsersiniz?",
        options: [
            { value: "J", text: "Her şeyi önceden planlar, zamanında teslim ederim" },
            { value: "P", text: "Esnek planlar yapar, son ana kadar iyileştirme yaparım" },
            { value: "J", text: "Checklist oluşturup sistematik şekilde ilerlerim" },
            { value: "P", text: "Spontane çözümlerle deadline'ı yakalarım" }
        ],
        dimension: "judging"
    },
    {
        id: 5,
        text: "İş ortamında nasıl bir atmosfer size daha verimli geliyor?",
        options: [
            { value: "E", text: "Açık ofis, sürekli etkileşim halinde" },
            { value: "I", text: "Sessiz, kendi alanım olan" },
            { value: "E", text: "Ekiple sürekli iletişim kurabileceğim" },
            { value: "I", text: "Derinde düşünebileceğim sakin ortam" }
        ],
        dimension: "extraversion"
    },
    {
        id: 6,
        text: "Problem çözerken hangi yaklaşımı kullanırsınız?",
        options: [
            { value: "S", text: "Geçmiş deneyimlere ve kanıtlanmış yöntemlere dayanırım" },
            { value: "N", text: "Yaratıcı çözümler bulup yeni yaklaşımlar denerim" },
            { value: "S", text: "Detaylı analiz yapıp somut verilerle ilerlerim" },
            { value: "N", text: "Büyük resmi görüp inovatif çözümler üretirim" }
        ],
        dimension: "sensing"
    },
    {
        id: 7,
        text: "Karar verirken en çok hangi faktör etkili oluyor?",
        options: [
            { value: "T", text: "Mantık, analiz ve objektif kriterler" },
            { value: "F", text: "İnsanlar üzerindeki etkisi ve değerler" },
            { value: "T", text: "Maliyet-fayda analizi ve verimlilik" },
            { value: "F", text: "Ekip motivasyonu ve insan faktörü" }
        ],
        dimension: "thinking"
    },
    {
        id: 8,
        text: "Çalışma tarzınızı nasıl tanımlarsınız?",
        options: [
            { value: "J", text: "Planlı, organize ve sistematik" },
            { value: "P", text: "Esnek, adapte olabilen ve spontane" },
            { value: "J", text: "Hedef odaklı ve disiplinli" },
            { value: "P", text: "Yaratıcı ve çok seçenekli" }
        ],
        dimension: "judging"
    },
    {
        id: 9,
        text: "Öğrenme tercihiniz nedir?",
        options: [
            { value: "visual", text: "Görseller, diagramlar ve şemalarla" },
            { value: "auditory", text: "Dinleme, tartışma ve açıklamalarla" },
            { value: "kinesthetic", text: "Yaparak, deneyerek ve pratik yaparak" },
            { value: "reading", text: "Okuma, yazma ve not tutarak" }
        ],
        dimension: "learning_style"
    },
    {
        id: 10,
        text: "Stres altında nasıl performans gösterirsiniz?",
        options: [
            { value: "high", text: "Stres beni motive eder, daha iyi performans gösteririm" },
            { value: "medium", text: "Orta düzeyde stresi yönetebilirim" },
            { value: "low", text: "Stressiz ortamda daha verimli çalışırım" },
            { value: "variable", text: "Stres türüne göre değişir" }
        ],
        dimension: "stress_tolerance"
    },
    {
        id: 11,
        text: "Takım çalışmasında hangi rolü üstlenirsiniz?",
        options: [
            { value: "leader", text: "Lider - Yönlendiren ve koordine eden" },
            { value: "collaborator", text: "İşbirlikçi - Destekleyen ve uyum sağlayan" },
            { value: "specialist", text: "Uzman - Teknik bilgi ve deneyim sunan" },
            { value: "independent", text: "Bağımsız - Kendi alanında çalışan" }
        ],
        dimension: "team_role"
    },
    {
        id: 12,
        text: "Feedback alma konusunda hangi yaklaşımı tercih edersiniz?",
        options: [
            { value: "direct", text: "Doğrudan, açık ve net feedback" },
            { value: "constructive", text: "Yapıcı, çözüm odaklı feedback" },
            { value: "detailed", text: "Detaylı, spesifik örneklerle feedback" },
            { value: "supportive", text: "Destekleyici, motive edici feedback" }
        ],
        dimension: "feedback_preference"
    },
    {
        id: 13,
        text: "Yeni bir iş projesine başlarken ilk ne yaparsınız?",
        options: [
            { value: "plan", text: "Detaylı plan ve timeline oluştururum" },
            { value: "research", text: "Araştırma yapıp benzer projeleri incelerim" },
            { value: "team", text: "Ekip üyeleriyle brainstorm yaparım" },
            { value: "experiment", text: "Hızlı prototype yapıp test ederim" }
        ],
        dimension: "work_approach"
    },
    {
        id: 14,
        text: "Hangi tür görevlerde daha başarılı oluyorsunuz?",
        options: [
            { value: "analytical", text: "Analitik düşünme gerektiren görevler" },
            { value: "creative", text: "Yaratıcı çözümler gerektiren görevler" },
            { value: "people", text: "İnsan ilişkileri gerektiren görevler" },
            { value: "technical", text: "Teknik uzmanlık gerektiren görevler" }
        ],
        dimension: "strength_area"
    },
    {
        id: 15,
        text: "Öğrenme motivasyonunuz nedir?",
        options: [
            { value: "growth", text: "Kişisel gelişim ve büyüme" },
            { value: "achievement", text: "Başarı ve tanınma" },
            { value: "mastery", text: "Uzmanlık ve mükemmellik" },
            { value: "impact", text: "Etki yaratma ve katkı sunma" }
        ],
        dimension: "motivation"
    },
    {
        id: 16,
        text: "Zor bir teknik problemi çözerken hangi yaklaşımı izlersiniz?",
        options: [
            { value: "systematic", text: "Sistematik şekilde adım adım analiz ederim" },
            { value: "intuitive", text: "Sezgisel yaklaşımla farklı açılardan bakarım" },
            { value: "collaborative", text: "Ekip üyeleriyle birlikte çözüm ararım" },
            { value: "experimental", text: "Deneme yanılma ile çözüm bulurum" }
        ],
        dimension: "problem_solving"
    },
    {
        id: 17,
        text: "İletişim tarzınızı nasıl tanımlarsınız?",
        options: [
            { value: "direct", text: "Doğrudan ve net" },
            { value: "diplomatic", text: "Diplomatik ve nazik" },
            { value: "detailed", text: "Detaylı ve açıklayıcı" },
            { value: "casual", text: "Rahat ve samimi" }
        ],
        dimension: "communication_style"
    },
    {
        id: 18,
        text: "Başarınızı nasıl ölçmeyi tercih edersiniz?",
        options: [
            { value: "metrics", text: "Sayısal veriler ve metriklere göre" },
            { value: "feedback", text: "İnsanlardan aldığım feedback'e göre" },
            { value: "goals", text: "Belirlediğim hedeflere ulaşmaya göre" },
            { value: "learning", text: "Ne kadar yeni şey öğrendiğime göre" }
        ],
        dimension: "success_metric"
    },
    {
        id: 19,
        text: "Çalışma ortamında en önemli faktör sizin için nedir?",
        options: [
            { value: "autonomy", text: "Özerklik ve bağımsızlık" },
            { value: "collaboration", text: "İş birliği ve ekip ruhu" },
            { value: "stability", text: "İstikrar ve güvenlik" },
            { value: "challenge", text: "Meydan okuma ve yenilik" }
        ],
        dimension: "work_value"
    },
    {
        id: 20,
        text: "Kariyerinizde hangi gelişim yolunu tercih edersiniz?",
        options: [
            { value: "technical", text: "Teknik uzmanlık derinleştirme" },
            { value: "leadership", text: "Liderlik ve yönetim becerileri" },
            { value: "entrepreneurial", text: "Girişimcilik ve inovasyon" },
            { value: "specialization", text: "Belirli bir alanda uzmanlaşma" }
        ],
        dimension: "career_path"
    }
];

// Kullanıcı bilgilerini yükle
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
});

function loadUserData() {
    if (window.KariyerAI?.currentUser) {
        currentUser = window.KariyerAI.currentUser;
    } else {
        try {
            const userData = localStorage.getItem("kariyerAI_user");
            if (userData) {
                currentUser = JSON.parse(userData);
            }
        } catch (error) {
            console.error("User data loading error:", error);
        }
    }
}

function startAssessment() {
    document.getElementById('assessmentIntro').classList.add('hidden');
    document.getElementById('assessmentSection').classList.remove('hidden');
    loadQuestion(0);
}

function loadQuestion(questionIndex) {
    const question = assessmentQuestions[questionIndex];
    const container = document.getElementById('questionContainer');
    
    container.innerHTML = `
        <div class="question-card">
            <div class="question-number">Soru ${questionIndex + 1} / ${assessmentQuestions.length}</div>
            <div class="question-text">${question.text}</div>
            <div class="answer-options">
                ${question.options.map((option, index) => `
                    <div class="answer-option" onclick="selectAnswer(${questionIndex}, '${option.value}', ${index})">
                        <input type="radio" name="question_${questionIndex}" value="${option.value}" id="option_${questionIndex}_${index}">
                        <label for="option_${questionIndex}_${index}" class="answer-text">${option.text}</label>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    updateProgress();
    updateNavigationButtons();
}

function selectAnswer(questionIndex, value, optionIndex) {
    // Önceki seçimi temizle
    document.querySelectorAll(`input[name="question_${questionIndex}"]`).forEach(input => {
        input.closest('.answer-option').classList.remove('selected');
    });
    
    // Yeni seçimi işaretle
    const selectedOption = document.getElementById(`option_${questionIndex}_${optionIndex}`);
    selectedOption.checked = true;
    selectedOption.closest('.answer-option').classList.add('selected');
    
    // Yanıtı kaydet
    responses[questionIndex] = {
        questionId: assessmentQuestions[questionIndex].id,
        dimension: assessmentQuestions[questionIndex].dimension,
        value: value
    };
    
    updateNavigationButtons();
}

function nextQuestion() {
    if (currentQuestion < assessmentQuestions.length - 1) {
        currentQuestion++;
        loadQuestion(currentQuestion);
    } else {
        completeAssessment();
    }
}

function previousQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        loadQuestion(currentQuestion);
    }
}

function updateProgress() {
    const progress = ((currentQuestion + 1) / assessmentQuestions.length) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `Soru ${currentQuestion + 1} / ${assessmentQuestions.length}`;
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.disabled = currentQuestion === 0;
    
    const hasAnswer = responses[currentQuestion] !== undefined;
    nextBtn.disabled = !hasAnswer;
    
    if (currentQuestion === assessmentQuestions.length - 1) {
        nextBtn.innerHTML = hasAnswer ? '<i class="fas fa-check"></i> Tamamla' : 'Lütfen Seçim Yapın';
    } else {
        nextBtn.innerHTML = 'Sonraki <i class="fas fa-arrow-right"></i>';
    }
}

async function completeAssessment() {
    document.getElementById('assessmentSection').classList.add('hidden');
    document.getElementById('resultsSection').classList.remove('hidden');
    
    // Analiz yap
    const analysis = analyzeResponses(responses);
    
    // Sonuçları görüntüle
    displayResults(analysis);
    
    // Sonuç mesajını güncelle
    updateResultsMessage(analysis);
    
    // Button'ı güncelle
    const dashboardButton = document.querySelector('button[onclick="goToPersonalizedDashboard()"]');
    if (dashboardButton) {
        dashboardButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sonuçlar kaydediliyor...';
        dashboardButton.disabled = true;
    }
    
    // Backend'e gönder
    try {
        await saveAssessmentResults(analysis);
    } catch (error) {
        console.error("Assessment save error:", error);
        // Hata olsa bile yönlendir
        if (dashboardButton) {
            dashboardButton.innerHTML = '<i class="fas fa-play"></i> Simülasyonu Başlat';
            dashboardButton.disabled = false;
        }
    }
}

// Sonuç mesajını güncelle
function updateResultsMessage(analysis) {
    const personalityDesc = document.getElementById('personalityDescription');
    if (personalityDesc) {
        const originalText = personalityDesc.textContent;
        personalityDesc.innerHTML = `
            ${originalText}
            <div style="background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                <p style="margin: 0; font-size: 0.9rem; opacity: 0.9;">
                    <i class="fas fa-magic" style="margin-right: 0.5rem;"></i>
                    Bu sonuçlara göre size özel simülasyon senaryoları hazırlanacak!
                </p>
            </div>
        `;
    }
}

function analyzeResponses(responses) {
    const scores = {
        extraversion: 0,
        sensing: 0,
        thinking: 0,
        judging: 0
    };
    
    const preferences = {
        learning_style: {},
        stress_tolerance: {},
        team_role: {},
        feedback_preference: {},
        work_approach: {},
        strength_area: {},
        motivation: {},
        problem_solving: {},
        communication_style: {},
        success_metric: {},
        work_value: {},
        career_path: {}
    };
    
    // MBTI boyutları için skorlama
    responses.forEach(response => {
        if (response.dimension in scores) {
            if (response.value === 'E' || response.value === 'S' || 
                response.value === 'T' || response.value === 'J') {
                scores[response.dimension]++;
            }
        } else if (response.dimension in preferences) {
            if (!preferences[response.dimension][response.value]) {
                preferences[response.dimension][response.value] = 0;
            }
            preferences[response.dimension][response.value]++;
        }
    });
    
    // MBTI tipi belirleme
    const mbtiType = 
        (scores.extraversion >= 2 ? 'E' : 'I') +
        (scores.sensing >= 2 ? 'S' : 'N') +
        (scores.thinking >= 2 ? 'T' : 'F') +
        (scores.judging >= 2 ? 'J' : 'P');
    
    // Tercih edilen özellikleri belirleme
    const dominantPreferences = {};
    Object.keys(preferences).forEach(key => {
        const prefs = preferences[key];
        const maxKey = Object.keys(prefs).reduce((a, b) => prefs[a] > prefs[b] ? a : b, Object.keys(prefs)[0]);
        dominantPreferences[key] = maxKey;
    });
    
    return {
        mbti_type: mbtiType,
        scores: scores,
        preferences: dominantPreferences,
        personality_description: getPersonalityDescription(mbtiType),
        learning_recommendations: getLearningRecommendations(mbtiType, dominantPreferences),
        simulation_preferences: getSimulationPreferences(mbtiType, dominantPreferences)
    };
}

function displayResults(analysis) {
    // Kişilik tipi
    document.getElementById('personalityTitle').textContent = `Kişilik Tipiniz: ${analysis.mbti_type}`;
    document.getElementById('personalityDescription').textContent = analysis.personality_description;
    
    // Trait skorları
    const traitsContainer = document.getElementById('traitScores');
    const traits = [
        { name: 'Dışadönüklük', key: 'extraversion', value: analysis.scores.extraversion * 25 },
        { name: 'Deneyime Açıklık', key: 'sensing', value: (4 - analysis.scores.sensing) * 25 },
        { name: 'Mantık Odaklılık', key: 'thinking', value: analysis.scores.thinking * 25 },
        { name: 'Düzenlilik', key: 'judging', value: analysis.scores.judging * 25 }
    ];
    
    traitsContainer.innerHTML = traits.map(trait => `
        <div class="trait-card">
            <div class="trait-name">${trait.name}</div>
            <div class="trait-bar">
                <div class="trait-fill" style="width: ${trait.value}%; background: linear-gradient(90deg, #3b82f6, #1d4ed8);"></div>
            </div>
            <div class="trait-percentage">${trait.value}%</div>
        </div>
    `).join('');
}

function getPersonalityDescription(mbtiType) {
    const descriptions = {
        'INTJ': 'Stratejik düşünür, bağımsız ve kararlı. Sistemli yaklaşımlarla complex problemleri çözmeyi seviyor.',
        'INTP': 'Yenilikçi düşünür, esnek ve uyumlu. Teorik konseptleri anlama ve yaratıcı çözümler üretme konusunda güçlü.',
        'ENTJ': 'Doğal lider, organize ve hedef odaklı. Büyük resmi görme ve ekipleri yönlendirme konusunda başarılı.',
        'ENTP': 'Yaratıcı vizyoner, enerjik ve çok yönlü. Yeni fikirleri keşfetme ve insanları motive etme konusunda yetenekli.',
        'INFJ': 'İlham verici ve kararlı idealist. İnsanları anlama ve uzun vadeli vizyonlar geliştirme konusunda güçlü.',
        'INFP': 'Uyumlu ve esnek, değerlerini önemseyen. Yaratıcı çözümler bulma ve ekip uyumunu koruma konusunda başarılı.',
        'ENFJ': 'Karizmatik lider, sıcak ve empatik. İnsanları geliştirme ve motive etme konusunda doğal yetenek.',
        'ENFP': 'Coşkulu ve yaratıcı, esnek ve spontane. Yeni olanakları keşfetme ve insanlarla bağ kurma konusunda güçlü.',
        'ISTJ': 'Güvenilir ve sistematik, detay odaklı. Planlama ve organize etme konusunda mükemmel, istikrarlı performans.',
        'ISFJ': 'Koruyucu ve destekleyici, pratik ve sorumlu. Ekip uyumunu koruma ve detaylı çalışma konusunda başarılı.',
        'ESTJ': 'Organize lider, pratik ve kararlı. Projeleri yönetme ve sonuç odaklı çalışma konusunda güçlü.',
        'ESFJ': 'Sosyal ve destekleyici, uyumlu ve organize. İnsan ilişkilerini yönetme ve ekip moralini yüksek tutma konusunda yetenekli.',
        'ISTP': 'Praktik problem çözücü, esnek ve gözlemci. Teknik konularda hızlı çözümler bulma konusunda başarılı.',
        'ISFP': 'Sanatçı ruh, uyumlu ve esnek. Yaratıcı yaklaşımlar ve uyumlu çalışma ortamı yaratma konusunda güçlü.',
        'ESTP': 'Enerjik problem çözücü, pratik ve sosyal. Hızlı adaptasyon ve kriz yönetimi konusunda doğal yetenek.',
        'ESFP': 'Coşkulu performer, esnek ve spontane. Ekip motivasyonu ve yaratıcı çözümler konusunda başarılı.'
    };
    
    return descriptions[mbtiType] || 'Benzersiz bir kişilik profiliniz var, çok yönlü yeteneklere sahipsiniz.';
}

function getLearningRecommendations(mbtiType, preferences) {
    const recommendations = {
        learning_methods: [],
        content_types: [],
        pace: '',
        environment: ''
    };
    
    // Learning style bazlı öneriler
    const learningStyle = preferences.learning_style;
    if (learningStyle === 'visual') {
        recommendations.learning_methods.push('Diagramlar ve görsel materyaller');
        recommendations.content_types.push('İnfografik ve video içerikler');
    } else if (learningStyle === 'auditory') {
        recommendations.learning_methods.push('Ses kayıtları ve tartışmalar');
        recommendations.content_types.push('Podcast ve webinar içerikler');
    } else if (learningStyle === 'kinesthetic') {
        recommendations.learning_methods.push('Hands-on pratik yapma');
        recommendations.content_types.push('İnteraktif simülasyonlar');
    } else {
        recommendations.learning_methods.push('Yazılı materyaller ve notlar');
        recommendations.content_types.push('Detaylı dökümanlar');
    }
    
    return recommendations;
}

function getSimulationPreferences(mbtiType, preferences) {
    const simPrefs = {
        preferred_scenarios: [],
        difficulty_preference: 'medium',
        interaction_style: 'mixed',
        feedback_type: 'balanced'
    };
    
    // MBTI tipine göre senaryo tercihleri
    if (mbtiType.includes('T')) {
        simPrefs.preferred_scenarios.push('technical_challenges', 'data_analysis', 'logical_problem_solving');
        simPrefs.feedback_type = 'analytical';
    } else {
        simPrefs.preferred_scenarios.push('team_collaboration', 'customer_interaction', 'empathy_scenarios');
        simPrefs.feedback_type = 'supportive';
    }
    
    if (mbtiType.includes('E')) {
        simPrefs.interaction_style = 'collaborative';
        simPrefs.preferred_scenarios.push('presentations', 'team_meetings', 'networking');
    } else {
        simPrefs.interaction_style = 'independent';
        simPrefs.preferred_scenarios.push('deep_work', 'research', 'individual_projects');
    }
    
    return simPrefs;
}

async function saveAssessmentResults(analysis) {
    try {
        // Kullanıcı kontrolü
        if (!currentUser || !currentUser.id) {
            console.error('User not loaded or missing ID');
            showNotification("Kullanıcı bilgisi bulunamadı", "error");
            return;
        }
        
        console.log('Saving assessment for user:', currentUser.id);
        console.log('Assessment data:', analysis);
        
        const response = await fetch('http://127.0.0.1:5000/save-personality-assessment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                assessment_results: {
                    responses: responses,
                    analysis: analysis,
                    personality_type: analysis.mbti_type,
                    learning_style: analysis.preferences.learning_style,
                    timestamp: new Date().toISOString()
                }
            })
        });
        
        const result = await response.json();
        console.log('Backend response:', result);
        
        if (result.success) {
            console.log('Assessment results saved successfully');
            
            // Local storage'a da kaydet
            if (currentUser) {
                currentUser.personality_assessment = {
                    responses: responses,
                    analysis: analysis,
                    personality_type: analysis.mbti_type,
                    learning_style: analysis.preferences.learning_style,
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem('kariyerAI_user', JSON.stringify(currentUser));
                if (window.KariyerAI) {
                    window.KariyerAI.currentUser = currentUser;
                }
            }
        } else {
            showNotification(`Kayıt hatası: ${result.message}`, "error");
        }
    } catch (error) {
        console.error('Assessment save error:', error);
        showNotification("Bağlantı hatası - test sonuçları yerel olarak kaydedildi", "warning");
    }
    
    // Her durumda localStorage'a da kaydet (backend hatası olsa bile)
    try {
        const assessmentData = {
            responses: responses,
            analysis: analysis,
            personality_type: analysis.mbti_type,
            learning_style: analysis.preferences.learning_style,
            timestamp: new Date().toISOString()
        };
        
        if (currentUser) {
            currentUser.personality_assessment = assessmentData;
            localStorage.setItem('kariyerAI_user', JSON.stringify(currentUser));
        } else {
            // Geçici kayıt
            localStorage.setItem('personality_assessment_temp', JSON.stringify(assessmentData));
        }
        
        if (window.KariyerAI && currentUser) {
            window.KariyerAI.currentUser = currentUser;
        }
    } catch (storageError) {
        console.error('Storage save error:', storageError);
    }
    
    // Test tamamlandıktan sonra otomatik olarak simülasyona yönlendir
    setTimeout(() => {
        goToPersonalizedDashboard();
    }, 1500); // 1.5 saniye sonra otomatik yönlendir
}

function goToPersonalizedDashboard() {
    // Kişiselleştirilmiş simülasyona yönlendir
    showNotification("Kişilik testi tamamlandı! Simülasyona yönlendiriliyorsunuz...", "success");
    
    // Eğer kullanıcı yoksa bile localStorage'a test sonuçlarını kaydet
    if (!currentUser) {
        const userData = localStorage.getItem("kariyerAI_user");
        if (userData) {
            try {
                currentUser = JSON.parse(userData);
            } catch (error) {
                console.error("User data parse error:", error);
                // Geçici kullanıcı oluştur
                currentUser = {
                    id: 'temp_' + Date.now(),
                    temp_user: true
                };
            }
        } else {
            // Geçici kullanıcı oluştur
            currentUser = {
                id: 'temp_' + Date.now(),
                temp_user: true
            };
        }
    }
    
    setTimeout(() => {
        window.location.href = '../html/interactive_simulation.html?personalized=true';
    }, 2000);
}

// Yardımcı fonksiyonlar
function showNotification(message, type = 'info') {
    // Basit notification sistemi
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 1000;
        font-weight: 600;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
