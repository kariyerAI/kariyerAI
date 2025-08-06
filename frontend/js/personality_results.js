// personality_results.js - LLM-powered personality analysis results

let personalityData = null;

// Initialize personality results page
function initializePersonalityResults() {
    console.log("Initializing personality results...");
    
    // Load user data
    if (window.KariyerAI && typeof window.KariyerAI.loadUserData === 'function') {
        window.KariyerAI.loadUserData();
    }
    
    loadPersonalityResults();
}

// Load personality analysis results
async function loadPersonalityResults() {
    try {
        const user = getUserData();
        
        if (!user) {
            redirectToLogin();
            return;
        }
        
        // Check if user has personality assessment
        if (!user.personality_assessment || !user.personality_assessment.personality_type) {
            redirectToPersonalityTest();
            return;
        }
        
        personalityData = user.personality_assessment;
        
        // Display basic personality type first
        displayPersonalityType(personalityData.personality_type);
        
        // Generate detailed LLM analysis
        await generateLLMAnalysis(user, personalityData);
        
    } catch (error) {
        console.error("Error loading personality results:", error);
        showErrorMessage();
    }
}

// Get user data from various sources
function getUserData() {
    // Try from global object first
    if (window.KariyerAI?.currentUser) {
        return window.KariyerAI.currentUser;
    }
    
    // Try from localStorage
    try {
        const userData = localStorage.getItem("kariyerAI_user");
        if (userData) {
            return JSON.parse(userData);
        }
    } catch (error) {
        console.error("Error reading from localStorage:", error);
    }
    
    return null;
}

// Display personality type
function displayPersonalityType(personalityType) {
    const displayElement = document.getElementById('personalityTypeDisplay');
    if (displayElement) {
        displayElement.textContent = personalityType;
    }
}

// Generate detailed LLM analysis
async function generateLLMAnalysis(user, personalityData) {
    try {
        showLoadingState();
        
        // Prepare user context for LLM
        const userContext = {
            personalityType: personalityData.personality_type,
            responses: personalityData.responses || {},
            skills: user.skills || [],
            experiences: user.experiences || [],
            currentTitle: user.currentTitle || user.current_title,
            location: user.location,
            firstName: user.firstName || user.first_name
        };
        
        console.log("Sending personality analysis request to LLM...");
        
        // Send request to backend for LLM analysis
        const response = await fetch(`${window.KariyerAI.BACKEND_URL}/api/personality-analysis`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_context: userContext,
                analysis_type: 'detailed_personality_report'
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const analysisResult = await response.json();
        console.log("LLM analysis received:", analysisResult);
        
        // Display the LLM-generated results
        displayAnalysisResults(analysisResult);
        
    } catch (error) {
        console.error("Error generating LLM analysis:", error);
        
        // Fallback to basic display if LLM fails
        displayFallbackResults(personalityData);
    }
}

// Display LLM-generated analysis results
function displayAnalysisResults(analysis) {
    hideLoadingState();
    showResultsContent();
    
    // Display personality overview
    const overviewElement = document.getElementById('personalityOverview');
    if (overviewElement && analysis.personality_overview) {
        overviewElement.innerHTML = `<p>${analysis.personality_overview}</p>`;
    }
    
    // Display personality traits
    const traitsElement = document.getElementById('personalityTraits');
    if (traitsElement && analysis.personality_traits) {
        traitsElement.innerHTML = analysis.personality_traits.map(trait => `
            <div class="mb-3">
                <div class="flex justify-between items-center mb-1">
                    <span class="font-medium">${trait.name}</span>
                    <span class="text-sm text-gray-600">${trait.score}%</span>
                </div>
                <div class="trait-bar">
                    <div class="trait-progress" style="width: ${trait.score}%"></div>
                </div>
                <p class="text-sm text-gray-600 mt-1">${trait.description}</p>
            </div>
        `).join('');
    }
    
    // Display career fit
    const careerElement = document.getElementById('careerFit');
    if (careerElement && analysis.career_fit) {
        careerElement.innerHTML = `
            <div class="mb-3">
                <h4 class="font-semibold mb-2">Uygun Kariyer Alanları:</h4>
                <div class="flex flex-wrap gap-2 mb-3">
                    ${analysis.career_fit.suitable_careers.map(career => 
                        `<span class="badge-blue">${career}</span>`
                    ).join('')}
                </div>
                <p class="text-sm text-gray-600">${analysis.career_fit.explanation}</p>
            </div>
        `;
    }
    
    // Display strengths
    const strengthsElement = document.getElementById('personalityStrengths');
    if (strengthsElement && analysis.strengths) {
        strengthsElement.innerHTML = analysis.strengths.map(strength => `
            <div class="strength-item">
                <h5 class="font-semibold text-green-700">${strength.title}</h5>
                <p class="text-sm text-gray-600">${strength.description}</p>
            </div>
        `).join('');
    }
    
    // Display weaknesses/development areas
    const weaknessesElement = document.getElementById('personalityWeaknesses');
    if (weaknessesElement && analysis.development_areas) {
        weaknessesElement.innerHTML = analysis.development_areas.map(area => `
            <div class="weakness-item">
                <h5 class="font-semibold text-yellow-700">${area.title}</h5>
                <p class="text-sm text-gray-600">${area.description}</p>
            </div>
        `).join('');
    }
    
    // Display recommendations
    const recommendationsElement = document.getElementById('personalityRecommendations');
    if (recommendationsElement && analysis.recommendations) {
        recommendationsElement.innerHTML = `
            <div class="space-y-4">
                ${analysis.recommendations.map(rec => `
                    <div class="border-l-4 border-blue-500 pl-4">
                        <h4 class="font-semibold text-blue-700 mb-2">${rec.category}</h4>
                        <p class="text-gray-700">${rec.suggestion}</p>
                        ${rec.action_items ? `
                            <ul class="mt-2 text-sm text-gray-600">
                                ${rec.action_items.map(item => `<li class="ml-4">• ${item}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// Display fallback results if LLM fails
function displayFallbackResults(personalityData) {
    hideLoadingState();
    showResultsContent();
    
    // Basic personality type display
    const overviewElement = document.getElementById('personalityOverview');
    if (overviewElement) {
        overviewElement.innerHTML = `
            <p>Kişilik tipiniz: <strong>${personalityData.personality_type}</strong></p>
            <p class="mt-2 text-gray-600">Detaylı analiz şu anda hazırlanamıyor. Lütfen daha sonra tekrar deneyin.</p>
        `;
    }
    
    // Show basic traits if available
    const traitsElement = document.getElementById('personalityTraits');
    if (traitsElement && personalityData.traits) {
        traitsElement.innerHTML = Object.entries(personalityData.traits).map(([trait, score]) => `
            <div class="mb-3">
                <div class="flex justify-between items-center mb-1">
                    <span class="font-medium">${trait}</span>
                    <span class="text-sm text-gray-600">${score}%</span>
                </div>
                <div class="trait-bar">
                    <div class="trait-progress" style="width: ${score}%"></div>
                </div>
            </div>
        `).join('');
    }
    
    // Show retry button
    const recommendationsElement = document.getElementById('personalityRecommendations');
    if (recommendationsElement) {
        recommendationsElement.innerHTML = `
            <div class="text-center">
                <p class="text-gray-600 mb-4">Kişiselleştirilmiş öneriler hazırlanamadı.</p>
                <button onclick="loadPersonalityResults()" class="btn btn-primary">
                    <i class="fas fa-refresh"></i>
                    Tekrar Dene
                </button>
            </div>
        `;
    }
}

// Show loading state
function showLoadingState() {
    const loadingElement = document.getElementById('loadingState');
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
}

// Hide loading state
function hideLoadingState() {
    const loadingElement = document.getElementById('loadingState');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// Show results content
function showResultsContent() {
    const resultsElement = document.getElementById('resultsContent');
    if (resultsElement) {
        resultsElement.style.display = 'block';
    }
}

// Show error message
function showErrorMessage() {
    hideLoadingState();
    
    const container = document.querySelector('.container');
    if (container) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                <h3 class="text-xl font-semibold mb-2">Bir Hata Oluştu</h3>
                <p class="text-gray-600 mb-6">Kişilik analizi sonuçları yüklenirken bir sorun oluştu.</p>
                <div class="space-x-4">
                    <button onclick="loadPersonalityResults()" class="btn btn-primary">
                        <i class="fas fa-refresh"></i>
                        Tekrar Dene
                    </button>
                    <a href="../html/dashboard_page.html" class="btn btn-outline">
                        <i class="fas fa-home"></i>
                        Dashboard'a Dön
                    </a>
                </div>
            </div>
        `;
    }
}

// Redirect to login if no user
function redirectToLogin() {
    alert('Oturum bilgisi bulunamadı. Giriş sayfasına yönlendiriliyorsunuz.');
    window.location.href = '../html/login_page.html';
}

// Redirect to personality test if not completed
function redirectToPersonalityTest() {
    alert('Kişilik testi henüz tamamlanmamış. Test sayfasına yönlendiriliyorsunuz.');
    window.location.href = '../html/personality_assessment.html';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure main.js has loaded
    setTimeout(() => {
        initializePersonalityResults();
    }, 100);
});

// Export functions for external use
window.personalityResultsFunctions = {
    initializePersonalityResults,
    loadPersonalityResults,
    generateLLMAnalysis
};
