// Dashboard 
function initializePersonalizedDashboard() {
    const urlParams = new URLSearchParams(window.location.search);
    const isPersonalized = urlParams.get('personalized');
    
    if (isPersonalized) {
        showPersonalizedWelcome();
    }
    
    loadPersonalizedContent();
}

function loadPersonalizedContent() {
    const user = getCurrentUser();
    if (!user) return;
    
    if (user.personality_profile) {
        displayPersonalizedRecommendations(user.personality_profile);
        updateSimulationRecommendations(user.personality_profile);
        showPersonalityInsights(user.personality_profile);
    } else {
        showPersonalityTestSuggestion();
    }
    
    loadAdaptiveRecommendations(user);
}

function showPersonalizedWelcome() {
    const welcomeSection = document.querySelector('.mb-8');
    if (welcomeSection) {
        const personalizedMessage = document.createElement('div');
        personalizedMessage.className = 'bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg mb-6';
        personalizedMessage.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="text-4xl">🎉</div>
                <div>
                    <h2 class="text-xl font-bold mb-2">Kişilik Analizi Tamamlandı!</h2>
                    <p class="opacity-90">Artık size özel simülasyonlar ve öğrenme içerikleri hazırlayabiliriz.</p>
                </div>
            </div>
        `;
        welcomeSection.appendChild(personalizedMessage);
    }
}

function displayPersonalizedRecommendations(personalityProfile) {
    const mainContent = document.querySelector('.lg\\:col-span-2');
    if (!mainContent) return;
    
    const recommendationsCard = document.createElement('div');
    recommendationsCard.className = 'card mb-8';
    recommendationsCard.innerHTML = `
        <div class="card-header">
            <h3 class="flex items-center gap-2">
                <i class="fas fa-user-cog text-blue-500"></i>
                <span>Size Özel Öneriler</span>
            </h3>
        </div>
        <div class="p-6">
            <div class="grid md:grid-cols-2 gap-6">
                <div>
                    <h4 class="font-semibold mb-3 text-gray-800">Tercih Edilen Simülasyon Türleri</h4>
                    <ul id="personalizedSimulations" class="space-y-2">
                        <!-- Dinamik içerik -->
                    </ul>
                </div>
                <div>
                    <h4 class="font-semibold mb-3 text-gray-800">Öğrenme Önerileri</h4>
                    <ul id="personalizedLearning" class="space-y-2">
                        <!-- Dinamik içerik -->
                    </ul>
                </div>
            </div>
        </div>
    `;
    
    const statsGrid = document.querySelector('.stats-grid');
    if (statsGrid) {
        statsGrid.parentNode.insertBefore(recommendationsCard, statsGrid.nextSibling);
    }
    
    populatePersonalizedRecommendations(personalityProfile);
}

function populatePersonalizedRecommendations(personalityProfile) {
    const simulationsList = document.getElementById('personalizedSimulations');
    const learningList = document.getElementById('personalizedLearning');
    
    if (!simulationsList || !learningList) return;
    
    const simulationRecommendations = getSimulationRecommendations(personalityProfile.mbti_type);
    const learningRecommendations = getLearningRecommendations(personalityProfile.mbti_type, personalityProfile.preferences);
    
    simulationsList.innerHTML = simulationRecommendations.map(rec => `
        <li class="flex items-center gap-2">
            <i class="fas fa-play-circle text-blue-500"></i>
            <span>${rec}</span>
        </li>
    `).join('');
    
    learningList.innerHTML = learningRecommendations.learning_methods.map(method => `
        <li class="flex items-center gap-2">
            <i class="fas fa-lightbulb text-yellow-500"></i>
            <span>${method}</span>
        </li>
    `).join('');
}

function getSimulationRecommendations(mbtiType) {
    const recommendations = {
        'INTJ': ['Stratejik Planlama Senaryoları', 'Sistem Tasarımı Challenges', 'Long-term Vision Projects'],
        'INTP': ['Problem Solving Puzzles', 'Research & Analysis Tasks', 'Innovation Workshops'],
        'ENTJ': ['Leadership Scenarios', 'Team Management Challenges', 'Business Strategy Cases'],
        'ENTP': ['Brainstorming Sessions', 'Creative Problem Solving', 'Networking Simulations'],
        'INFJ': ['Mentoring Scenarios', 'Conflict Resolution Cases', 'Vision Communication Tasks'],
        'INFP': ['Creative Projects', 'Values-based Decisions', 'Team Harmony Scenarios'],
        'ENFJ': ['Team Building Exercises', 'Motivation Challenges', 'Public Speaking Tasks'],
        'ENFP': ['Collaboration Projects', 'Innovation Challenges', 'People Development Tasks'],
        'ISTJ': ['Process Optimization', 'Quality Assurance Tasks', 'Project Planning Scenarios'],
        'ISFJ': ['Customer Service Scenarios', 'Team Support Tasks', 'Detail-oriented Projects'],
        'ESTJ': ['Project Management', 'Efficiency Optimization', 'Team Coordination Tasks'],
        'ESFJ': ['Team Collaboration', 'Customer Relations', 'Event Organization Tasks'],
        'ISTP': ['Technical Problem Solving', 'Hands-on Challenges', 'Crisis Response Scenarios'],
        'ISFP': ['Creative Design Tasks', 'Individual Projects', 'Aesthetic Challenges'],
        'ESTP': ['Fast-paced Challenges', 'Crisis Management', 'Sales & Negotiation Tasks'],
        'ESFP': ['Interactive Presentations', 'Team Energy Boosting', 'Customer Engagement Tasks']
    };
    
    return recommendations[mbtiType] || ['Genel Problem Çözme', 'Takım Çalışması', 'İletişim Becerileri'];
}

function showPersonalityInsights(personalityProfile) {
    const sidebar = document.querySelector('.lg\\:col-span-1');
    if (!sidebar) return;
    
    const insightsCard = document.createElement('div');
    insightsCard.className = 'card mb-6';
    insightsCard.innerHTML = `
        <div class="card-header">
            <h3 class="flex items-center gap-2">
                <i class="fas fa-brain text-purple-500"></i>
                <span>Kişilik İçgörüleri</span>
            </h3>
        </div>
        <div class="p-6">
            <div class="text-center mb-4">
                <div class="personality-badge">${personalityProfile.mbti_type}</div>
                <p class="text-sm text-gray-600 mt-2">${personalityProfile.personality_description}</p>
            </div>
            
            <div class="space-y-3">
                <div class="personality-trait">
                    <span class="trait-label">Öğrenme Stili:</span>
                    <span class="trait-value">${getLearningSyleDisplay(personalityProfile.preferences.learning_style)}</span>
                </div>
                <div class="personality-trait">
                    <span class="trait-label">Çalışma Tarzı:</span>
                    <span class="trait-value">${getWorkStyleDisplay(personalityProfile.preferences.team_role)}</span>
                </div>
                <div class="personality-trait">
                    <span class="trait-label">İletişim:</span>
                    <span class="trait-value">${getCommunicationDisplay(personalityProfile.preferences.communication_style)}</span>
                </div>
            </div>
            
            <div class="mt-4 pt-4 border-t">
                <button class="btn btn-outline btn-sm w-full" onclick="showDetailedPersonalityReport()">
                    <i class="fas fa-chart-bar"></i>
                    Detaylı Rapor
                </button>
            </div>
        </div>
    `;
    
    sidebar.insertBefore(insightsCard, sidebar.firstChild);
}

function showPersonalityTestSuggestion() {
    const mainContent = document.querySelector('.lg\\:col-span-2');
    if (!mainContent) return;
    
    const suggestionCard = document.createElement('div');
    suggestionCard.className = 'card mb-8 border-2 border-dashed border-blue-300';
    suggestionCard.innerHTML = `
        <div class="p-8 text-center">
            <div class="text-6xl mb-4">🧠</div>
            <h3 class="text-xl font-bold mb-3">Kişilik ve Öğrenme Stili Testi</h3>
            <p class="text-gray-600 mb-6 max-w-md mx-auto">
                Size en uygun simülasyonları ve öğrenme içeriklerini belirlemek için 
                kısa bir kişilik testi yapmanızı öneriyoruz.
            </p>
            <div class="flex justify-center gap-4">
                <button class="btn btn-primary" onclick="startPersonalityTest()">
                    <i class="fas fa-play"></i>
                    Teste Başla
                </button>
                <button class="btn btn-outline" onclick="skipPersonalityTest()">
                    Şimdi Değil
                </button>
            </div>
        </div>
    `;
    
    const statsGrid = document.querySelector('.stats-grid');
    if (statsGrid) {
        statsGrid.parentNode.insertBefore(suggestionCard, statsGrid.nextSibling);
    }
}

async function loadAdaptiveRecommendations(user) {
    if (!user || !user.id) return;
    
    try {
        const response = await fetch(`http://127.0.0.1:5000/profile-analysis/${user.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                include_recommendations: true
            })
        });
        
        const result = await response.json();
        if (result.success && result.data.recommendations) {
            displayAdaptiveRecommendations(result.data.recommendations);
        }
    } catch (error) {
        console.error('Adaptive recommendations load error:', error);
    }
}

function displayAdaptiveRecommendations(recommendations) {
    const sidebar = document.querySelector('.lg\\:col-span-1');
    if (!sidebar) return;
    
    const adaptiveCard = document.createElement('div');
    adaptiveCard.className = 'card mb-6';
    adaptiveCard.innerHTML = `
        <div class="card-header">
            <h3 class="flex items-center gap-2">
                <i class="fas fa-robot text-green-500"></i>
                <span>AI Önerileri</span>
            </h3>
        </div>
        <div class="p-6">
            <div class="space-y-4">
                ${recommendations.skill_development.map(skill => `
                    <div class="skill-recommendation">
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-medium text-sm">${skill.skill || skill}</span>
                            <span class="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                ${skill.priority || 'Önemli'}
                            </span>
                        </div>
                        <div class="text-xs text-gray-600">
                            ${skill.estimated_time || '2-4 hafta'}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="mt-4 pt-4 border-t">
                <button class="btn btn-primary btn-sm w-full" onclick="startPersonalizedSimulation()">
                    <i class="fas fa-play"></i>
                    Özel Simülasyon Başlat
                </button>
            </div>
        </div>
    `;
    
    sidebar.appendChild(adaptiveCard);
}

function updateSimulationRecommendations(personalityProfile) {
    const simulationCards = document.querySelectorAll('[onclick*="simulation"]');
    simulationCards.forEach(card => {
        const difficulty = getRecommendedDifficulty(personalityProfile);
        const difficultyBadge = card.querySelector('.badge') || document.createElement('span');
        difficultyBadge.className = 'badge badge-primary';
        difficultyBadge.textContent = `${difficulty} Seviye`;
        
        if (!card.querySelector('.badge')) {
            card.appendChild(difficultyBadge);
        }
    });
}

function getRecommendedDifficulty(personalityProfile) {
    const complexityPref = personalityProfile.preferences.complexity_preference;
    const difficultyMap = {
        'low': 'Başlangıç',
        'medium': 'Orta',
        'high': 'İleri'
    };
    return difficultyMap[complexityPref] || 'Orta';
}

function getLearningSyleDisplay(style) {
    const displays = {
        'visual': 'Görsel Öğrenme',
        'auditory': 'İşitsel Öğrenme', 
        'kinesthetic': 'Uygulamalı Öğrenme',
        'reading': 'Okuma/Yazma'
    };
    return displays[style] || 'Karma';
}

function getWorkStyleDisplay(role) {
    const displays = {
        'leader': 'Lider',
        'collaborator': 'İşbirlikçi',
        'specialist': 'Uzman',
        'independent': 'Bağımsız'
    };
    return displays[role] || 'Esnek';
}

function getCommunicationDisplay(style) {
    const displays = {
        'direct': 'Doğrudan',
        'diplomatic': 'Diplomatik',
        'detailed': 'Detaylı',
        'casual': 'Samimi'
    };
    return displays[style] || 'Dengeli';
}

function startPersonalityTest() {
    window.location.href = '../html/personality_assessment.html';
}

function skipPersonalityTest() {
    const suggestionCard = document.querySelector('.border-dashed');
    if (suggestionCard) {
        suggestionCard.style.display = 'none';
    }
}

function showDetailedPersonalityReport() {
    alert('Detaylı kişilik raporu yakında hazır olacak!');
}

async function startPersonalizedSimulation() {
    const user = getCurrentUser();
    if (!user || !user.personality_profile) {
        startPersonalityTest();
        return;
    }
    
    try {
        const response = await fetch(`http://127.0.0.1:5000/adaptive-scenario/${user.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                personality_profile: user.personality_profile,
                preferred_difficulty: getRecommendedDifficulty(user.personality_profile).toLowerCase(),
                focus_areas: user.personality_profile.simulation_preferences?.preferred_scenarios || []
            })
        });
        
        const result = await response.json();
        if (result.success) {
            window.location.href = '../html/interactive_simulation.html?personalized=true';
        }
    } catch (error) {
        console.error('Personalized simulation start error:', error);
        window.location.href = '../html/interactive_simulation.html';
    }
}

function getCurrentUser() {
    if (window.KariyerAI?.currentUser) {
        return window.KariyerAI.currentUser;
    }
    
    try {
        const userData = localStorage.getItem("kariyerAI_user");
        if (userData) {
            return JSON.parse(userData);
        }
    } catch (error) {
        console.error("User data loading error:", error);
    }
    
    return null;
}

const personalizedStyles = `
<style>
    .personality-badge {
        display: inline-block;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-weight: bold;
        font-size: 1.2rem;
    }
    
    .personality-trait {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
    }
    
    .trait-label {
        font-weight: 600;
        color: #374151;
        font-size: 0.875rem;
    }
    
    .trait-value {
        font-weight: 500;
        color: #6b7280;
        font-size: 0.875rem;
    }
    
    .skill-recommendation {
        background: #f8fafc;
        padding: 0.75rem;
        border-radius: 6px;
        border-left: 3px solid #3b82f6;
    }
</style>
`;

if (!document.querySelector('#personalizedStyles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'personalizedStyles';
    styleElement.innerHTML = personalizedStyles;
    document.head.appendChild(styleElement);
}

window.initializePersonalizedDashboard = initializePersonalizedDashboard;
window.startPersonalityTest = startPersonalityTest;
window.skipPersonalityTest = skipPersonalityTest;
window.showDetailedPersonalityReport = showDetailedPersonalityReport;
window.startPersonalizedSimulation = startPersonalizedSimulation;
