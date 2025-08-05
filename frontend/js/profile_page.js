// profile_page.js - User Profile Display & Edit

// Global variables
let isEditMode = false;
let originalUserData = null;

// Initialize profile page
function initializeProfilePage() {
    console.log("Initializing profile page...");
    
    // Load user data if available
    if (window.KariyerAI && typeof window.KariyerAI.loadUserData === 'function') {
        window.KariyerAI.loadUserData();
    }
    
    loadUserProfile();
    setupProfileEventListeners();
}

// Load and display user profile information
function loadUserProfile() {
    let user = null;
    
    // Get user data from KariyerAI global object
    if (window.KariyerAI?.currentUser) {
        user = window.KariyerAI.currentUser;
        console.log("User loaded from KariyerAI global:", user);
    }
    
    // Fallback: Try to load from localStorage
    if (!user) {
        try {
            const userData = localStorage.getItem("kariyerAI_user");
            if (userData) {
                user = JSON.parse(userData);
                if (window.KariyerAI) {
                    window.KariyerAI.currentUser = user;
                }
                console.log("User loaded from localStorage:", user);
            }
        } catch (error) {
            console.error("Error reading from localStorage:", error);
        }
    }
    
    if (!user) {
        console.log("No user data found");
        showNoProfileMessage();
        return;
    }
    
    // Display user information
    displayPersonalInfo(user);
    displayProfessionalInfo(user);
    displayEducationInfo(user);
    displaySkills(user.skills || []);
    displayExperiences(user.experiences || []);
    
    // Only fetch fresh data from backend if we don't have skills/experiences locally
    if (user.email && (!user.skills || user.skills.length === 0) && (!user.experiences || user.experiences.length === 0)) {
        console.log('📌 [Profile] Loading fresh data from backend (no local data)');
        fetchFreshProfileData(user.email).then(freshData => {
            if (freshData) {
                console.log('📌 [Profile] Backend data received:', {
                    backendSkills: freshData.skills?.length || 0,
                    backendExperiences: freshData.experiences?.length || 0,
                    localSkills: (user.skills || []).length,
                    localExperiences: (user.experiences || []).length
                });
                
                // Update display with backend data (authoritative source)
                displaySkills(freshData.skills || []);
                displayExperiences(freshData.experiences || []);
                
                // Update localStorage with fresh backend data
                const updatedUser = { 
                    ...user, 
                    skills: freshData.skills || [], 
                    experiences: freshData.experiences || []
                };
                if (window.KariyerAI) {
                    window.KariyerAI.currentUser = updatedUser;
                    window.KariyerAI.saveUserData();
                }
            }
        }).catch(error => {
            console.log('📌 [Profile] Backend fetch failed, using localStorage data:', error);
            // If backend fails, keep using localStorage data (already displayed)
        });
    } else {
        console.log('📌 [Profile] Using existing local data, no backend fetch needed');
    }
    
    console.log("Profile loaded successfully");
}

// Fetch fresh profile data from backend
function fetchFreshProfileData(email) {
    return new Promise((resolve, reject) => {
        const backendUrl = window.KariyerAI?.BACKEND_URL || 'http://127.0.0.1:5000';
        
        console.log('📌 [Profile] Fetching fresh data for email:', email);
        
        fetch(`${backendUrl}/get-profile/${encodeURIComponent(email)}?by=email`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.data) {
                console.log('📌 [Profile] Fresh data received:', {
                    skills: data.data.skills?.length || 0,
                    experiences: data.data.experiences?.length || 0
                });
                resolve(data.data);
            } else {
                reject('Backend returned no data');
            }
        })
        .catch(error => {
            console.log('📌 [Profile] Backend fetch failed:', error);
            reject(error);
        });
    });
}

// Display personal information
function displayPersonalInfo(user) {
    const firstName = user.firstName || user.first_name || '';
    const lastName = user.lastName || user.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const email = user.email || '';
    const phone = user.phone || '';
    const location = user.location || '';
    
    // Header information
    updateElement('profileFullName', fullName || 'Kullanıcı Adı');
    updateElement('profileCurrentTitle', user.currentTitle || user.current_title || 'Pozisyon');
    updateElement('profileLocation', location ? `📍 ${location}` : '📍 Lokasyon belirtilmemiş');
    updateElement('profileEmail', email ? `📧 ${email}` : '📧 E-posta belirtilmemiş');
    updateElement('profilePhone', phone ? `📞 ${phone}` : '📞 Telefon belirtilmemiş');
    
    // Profile avatar
    const avatar = document.getElementById('profileAvatar');
    if (avatar) {
        const firstLetter = (firstName || 'U').charAt(0).toUpperCase();
        avatar.textContent = firstLetter;
    }
    
    // Personal info card
    updateElement('personalFirstName', firstName || 'Belirtilmemiş');
    updateElement('personalLastName', lastName || 'Belirtilmemiş');
    updateElement('personalEmail', email || 'Belirtilmemiş');
    updateElement('personalPhone', phone || 'Belirtilmemiş');
    updateElement('personalLocation', location || 'Belirtilmemiş');
    
    // Profile summary
    updateElement('profileSummary', user.summary || 'Profil özeti eklenmemiş.');
    
    // Store original data for edit mode
    originalUserData = { ...user };
}

// Display professional information
function displayProfessionalInfo(user) {
    const currentTitle = user.currentTitle || user.current_title || 'Belirtilmemiş';
    const experienceLevel = getExperienceLevelText(user.experienceLevel || user.experience_level);
    const skillCount = (user.skills || []).length;
    const experienceCount = (user.experiences || []).length;
    
    updateElement('professionalTitle', currentTitle);
    updateElement('professionalLevel', experienceLevel);
    updateElement('professionalSkillCount', `${skillCount} beceri`);
    updateElement('professionalExperienceCount', `${experienceCount} deneyim`);
}

// Display education information
function displayEducationInfo(user) {
    updateElement('educationUniversity', user.university || 'Belirtilmemiş');
    updateElement('educationDegree', user.degree || 'Belirtilmemiş');
    updateElement('educationYear', user.graduationYear || user.graduation_year || 'Belirtilmemiş');
    updateElement('educationGPA', user.gpa || 'Belirtilmemiş');
}

// Display skills
function displaySkills(skills) {
    const container = document.getElementById('skillsList');
    if (!container) return;
    
    if (!skills || skills.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-code"></i>
                <p>Henüz beceri eklenmemiş</p>
                <a href="../html/create_profile_page.html" class="btn btn-primary btn-small mt-3">
                    Beceri Ekle
                </a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            ${skills.map((skill, index) => `
                <span class="skill-tag">
                    ${skill}
                    <i class="fas fa-times remove-skill" data-skill-index="${index}" title="Beceriyi kaldır"></i>
                </span>
            `).join('')}
        </div>
    `;
    
    // Add event listeners for remove buttons
    container.querySelectorAll('.remove-skill').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const skillIndex = parseInt(e.target.getAttribute('data-skill-index'));
            removeSkill(skillIndex);
        });
    });
}

// Display experiences
function displayExperiences(experiences) {
    const container = document.getElementById('experiencesList');
    if (!container) return;
    
    if (!experiences || experiences.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-building"></i>
                <p>Henüz iş deneyimi eklenmemiş</p>
                <a href="../html/create_profile_page.html" class="btn btn-primary btn-small mt-3">
                    Deneyim Ekle
                </a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = experiences.map((exp, index) => `
        <div class="experience-card">
            <i class="fas fa-times remove-experience" data-exp-index="${index}" title="Deneyimi kaldır"></i>
            <div class="experience-title font-semibold text-lg text-gray-800">${exp.position || 'Pozisyon'}</div>
            <div class="experience-company text-blue-600 font-medium">${exp.company || 'Şirket'}</div>
            <div class="experience-duration text-gray-500 text-sm mt-1">${exp.duration || 'Süre belirtilmemiş'}</div>
            ${exp.location ? `<div class="experience-location text-gray-500 text-sm"><i class="fas fa-map-marker-alt mr-1"></i>${exp.location}</div>` : ''}
            <div class="experience-description text-gray-700 mt-2 leading-relaxed">${exp.description || 'Açıklama eklenmemiş'}</div>
        </div>
    `).join('');
    
    // Add event listeners for remove buttons
    container.querySelectorAll('.remove-experience').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const expIndex = parseInt(e.target.getAttribute('data-exp-index'));
            removeExperience(expIndex);
        });
    });
}

// Show message when no profile data is found
function showNoProfileMessage() {
    const container = document.querySelector('.container');
    if (container) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-user-times text-gray-400 text-6xl mb-4"></i>
                <h2 class="text-2xl font-bold text-gray-700 mb-4">Profil Bulunamadı</h2>
                <p class="text-gray-600 mb-6">Henüz bir profil oluşturulmamış. Profilinizi oluşturarak başlayın.</p>
                <a href="../html/create_profile_page.html" class="btn btn-primary btn-large">
                    <i class="fas fa-user-plus mr-2"></i>
                    Profil Oluştur
                </a>
            </div>
        `;
    }
}

// Get experience level text
function getExperienceLevelText(level) {
    const levels = {
        'junior': 'Junior (0-2 yıl)',
        'mid': 'Mid-Level (2-5 yıl)',
        'senior': 'Senior (5-8 yıl)',
        'lead': 'Lead/Principal (8+ yıl)'
    };
    return levels[level] || 'Belirtilmemiş';
}

// Update element text content safely
function updateElement(id, content) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = content;
    } else {
        console.warn(`Element with id '${id}' not found`);
    }
}

// Setup profile event listeners
function setupProfileEventListeners() {
    // Edit toggle button
    const editToggleBtn = document.getElementById('editToggleBtn');
    if (editToggleBtn) {
        editToggleBtn.addEventListener('click', toggleEditMode);
    }
    
    // Save changes button
    const saveBtn = document.getElementById('saveChangesBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveProfileChanges);
    }
    
    // Cancel edit button
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelEdit);
    }
    
    // Share profile button
    const shareBtn = document.getElementById('shareProfileBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            // Create shareable link or copy to clipboard
            const profileUrl = window.location.href;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(profileUrl).then(() => {
                    showToast('Profil linki panoya kopyalandı!', 'success');
                }).catch(() => {
                    showToast('Link kopyalanamadı', 'error');
                });
            } else {
                showToast('Profil paylaşma özelliği bu tarayıcıda desteklenmiyor', 'info');
            }
        });
    }
    
    // Skills management event listeners
    setupSkillsEventListeners();
    
    // Experience management event listeners
    setupExperienceEventListeners();
}

// Toggle edit mode
function toggleEditMode() {
    isEditMode = !isEditMode;
    
    if (isEditMode) {
        enterEditMode();
    } else {
        exitEditMode();
    }
}

// Enter edit mode
function enterEditMode() {
    console.log('Entering edit mode');
    
    // Show/hide appropriate elements
    const editActions = document.getElementById('editActions');
    const editBtnText = document.getElementById('editBtnText');
    const editToggleBtn = document.getElementById('editToggleBtn');
    
    if (editActions) editActions.style.display = 'block';
    if (editBtnText) editBtnText.textContent = 'İptal';
    if (editToggleBtn) {
        editToggleBtn.innerHTML = '<i class="fas fa-times mr-2"></i><span id="editBtnText">İptal</span>';
        editToggleBtn.className = 'btn btn-outline';
    }
    
    // Populate edit fields with current values
    populateEditFields();
    
    // Show input fields, hide display values
    toggleFieldVisibility(true);
    
    showToast('Düzenleme modu aktif', 'info');
}

// Exit edit mode
function exitEditMode() {
    console.log('Exiting edit mode');
    
    // Show/hide appropriate elements
    const editActions = document.getElementById('editActions');
    const editToggleBtn = document.getElementById('editToggleBtn');
    
    if (editActions) editActions.style.display = 'none';
    if (editToggleBtn) {
        editToggleBtn.innerHTML = '<i class="fas fa-edit mr-2"></i><span id="editBtnText">Profili Düzenle</span>';
        editToggleBtn.className = 'btn btn-white';
    }
    
    // Hide input fields, show display values
    toggleFieldVisibility(false);
}

// Populate edit fields with current user data
function populateEditFields() {
    const user = window.KariyerAI?.currentUser;
    if (!user) return;
    
    setInputValue('editFirstName', user.firstName || user.first_name);
    setInputValue('editLastName', user.lastName || user.last_name);
    setInputValue('editEmail', user.email);
    setInputValue('editPhone', user.phone);
    setInputValue('editLocation', user.location);
    setInputValue('editCurrentTitle', user.currentTitle || user.current_title);
    setSelectValue('editExperienceLevel', user.experienceLevel || user.experience_level);
    setInputValue('editUniversity', user.university);
    setInputValue('editDegree', user.degree);
    setInputValue('editGraduationYear', user.graduationYear || user.graduation_year);
    setInputValue('editGPA', user.gpa);
    setInputValue('editSummary', user.summary);
}

// Toggle field visibility
function toggleFieldVisibility(showEditFields) {
    const displayFields = [
        'personalFirstName', 'personalLastName', 'personalEmail', 'personalPhone', 'personalLocation',
        'professionalTitle', 'professionalLevel', 'educationUniversity', 'educationDegree', 
        'educationYear', 'educationGPA', 'profileSummary'
    ];
    
    const editFields = [
        'editFirstName', 'editLastName', 'editEmail', 'editPhone', 'editLocation',
        'editCurrentTitle', 'editExperienceLevel', 'editUniversity', 'editDegree',
        'editGraduationYear', 'editGPA', 'editSummary'
    ];
    
    displayFields.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = showEditFields ? 'none' : 'block';
    });
    
    editFields.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = showEditFields ? 'block' : 'none';
    });
}

// Save profile changes
function saveProfileChanges() {
    // Validate required fields
    const firstName = getInputValue('editFirstName');
    const lastName = getInputValue('editLastName');
    const email = getInputValue('editEmail');
    
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
        showToast('Ad, Soyad ve E-posta alanları zorunludur!', 'error');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Geçerli bir e-posta adresi giriniz!', 'error');
        return;
    }
    
    const updatedUser = {
        ...originalUserData,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: getInputValue('editPhone').trim(),
        location: getInputValue('editLocation').trim(),
        currentTitle: getInputValue('editCurrentTitle').trim(),
        experienceLevel: getInputValue('editExperienceLevel'),
        university: getInputValue('editUniversity').trim(),
        degree: getInputValue('editDegree').trim(),
        graduationYear: getInputValue('editGraduationYear').trim(),
        gpa: getInputValue('editGPA').trim(),
        summary: getInputValue('editSummary').trim(),
        // lastUpdated sadece local olarak saklanır
        lastUpdated: new Date().toISOString()
    };
    
    // Update global user data
    if (window.KariyerAI) {
        window.KariyerAI.currentUser = updatedUser;
        window.KariyerAI.saveUserData();
    }
    
    // Save to backend if possible
    saveToBackendWithCallback(updatedUser, () => {
        console.log('📌 [Profile] Profile edit saved to backend successfully');
    });
    
    // Refresh display
    displayPersonalInfo(updatedUser);
    displayProfessionalInfo(updatedUser);
    displayEducationInfo(updatedUser);
    
    // Exit edit mode
    isEditMode = false;
    exitEditMode();
    
    showToast('Profil başarıyla güncellendi!', 'success');
}

// Cancel edit
function cancelEdit() {
    isEditMode = false;
    exitEditMode();
    showToast('Düzenleme iptal edildi', 'info');
}

// Save to backend
function saveToBackend(userData) {
    const backendUrl = window.KariyerAI?.BACKEND_URL || 'http://127.0.0.1:5000';
    
    // Check if userData is valid
    if (!userData) {
        console.error('❌ [Frontend] userData is null or undefined');
        showToast('Kullanıcı verisi bulunamadı!', 'error');
        return;
    }
    
    // Show loading indicator
    showToast('Profil kaydediliyor...', 'info');
    
    // Prepare data for backend (convert field names)
    const backendData = {
        firstName: userData.firstName || userData.first_name,
        lastName: userData.lastName || userData.last_name,
        email: userData.email,
        phone: userData.phone,
        location: userData.location,
        currentTitle: userData.currentTitle || userData.current_title,
        experienceLevel: userData.experienceLevel || userData.experience_level,
        summary: userData.summary,
        skills: userData.skills || [],
        experiences: userData.experiences || [],
        university: userData.university,
        degree: userData.degree,
        graduationYear: userData.graduationYear || userData.graduation_year,
        gpa: userData.gpa
    };
    
    console.log('📌 [Frontend] Saving to backend:', {
        skills: backendData.skills.length,
        experiences: backendData.experiences.length
    });
    
    // Validate required fields on frontend too
    if (!backendData.firstName || !backendData.lastName || !backendData.email) {
        console.error('❌ [Frontend] Missing required fields!');
        showToast('Gerekli alanlar eksik: Ad, Soyad, E-posta zorunludur!', 'error');
        return;
    }
    
    fetch(`${backendUrl}/save-profile`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(backendData)
    })
    .then(response => {
        console.log('📌 [Frontend] Backend response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('📌 [Frontend] Backend response data:', data);
        if (data.success) {
            console.log('Profile saved to backend successfully');
            showToast('Profil backend\'e kaydedildi!', 'success');
            
            // Update local user data with backend user_id if received
            if (data.user_id && window.KariyerAI?.currentUser) {
                window.KariyerAI.currentUser.id = data.user_id;
                window.KariyerAI.saveUserData();
            }
        } else {
            console.error('❌ [Frontend] Backend save failed:', data.message);
            showToast('Backend kayıt hatası: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error saving to backend:', error);
        showToast('Backend bağlantı hatası. Veriler yerel olarak kaydedildi.', 'error');
    });
}

// Save to backend with callback
function saveToBackendWithCallback(userData, onSuccess) {
    const backendUrl = window.KariyerAI?.BACKEND_URL || 'http://127.0.0.1:5000';
    
    // Check if userData is valid
    if (!userData) {
        console.error('❌ [Frontend] userData is null or undefined');
        showToast('Kullanıcı verisi bulunamadı!', 'error');
        return;
    }
    
    // Prepare data for backend (convert field names)
    const backendData = {
        firstName: userData.firstName || userData.first_name,
        lastName: userData.lastName || userData.last_name,
        email: userData.email,
        phone: userData.phone,
        location: userData.location,
        currentTitle: userData.currentTitle || userData.current_title,
        experienceLevel: userData.experienceLevel || userData.experience_level,
        summary: userData.summary,
        skills: userData.skills || [],
        experiences: userData.experiences || [],
        university: userData.university,
        degree: userData.degree,
        graduationYear: userData.graduationYear || userData.graduation_year,
        gpa: userData.gpa
    };
    
    console.log('📌 [Frontend] Saving to backend with callback:', {
        skills: backendData.skills.length,
        experiences: backendData.experiences.length,
        skillsData: backendData.skills,
        experiencesData: backendData.experiences,
        userDataSkills: userData.skills,
        userDataExperiences: userData.experiences,
        userDataKeys: Object.keys(userData)
    });
    
    console.log('📌 [Frontend] JSON being sent to backend:', JSON.stringify(backendData, null, 2));
    
    // Validate required fields on frontend too
    if (!backendData.firstName || !backendData.lastName || !backendData.email) {
        console.error('❌ [Frontend] Missing required fields!');
        showToast('Gerekli alanlar eksik: Ad, Soyad, E-posta zorunludur!', 'error');
        return;
    }
    
    fetch(`${backendUrl}/save-profile`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(backendData)
    })
    .then(response => {
        console.log('📌 [Frontend] Backend response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('📌 [Frontend] Backend response data:', data);
        if (data.success) {
            console.log('Profile saved to backend successfully');
            
            // Update local user data with backend user_id if received
            if (data.user_id && window.KariyerAI?.currentUser) {
                window.KariyerAI.currentUser.id = data.user_id;
                window.KariyerAI.saveUserData();
            }
            
            // Call success callback
            if (onSuccess) {
                onSuccess(data);
            }
        } else {
            console.error('❌ [Frontend] Backend save failed:', data.message);
            showToast('Backend kayıt hatası: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error saving to backend:', error);
        showToast('Backend bağlantı hatası. Veriler yerel olarak kaydedildi.', 'error');
    });
}

// Helper function to get input value
function getInputValue(id) {
    const input = document.getElementById(id);
    return input ? input.value : '';
}

// Helper function to set input value safely
function setInputValue(id, value) {
    const input = document.getElementById(id);
    if (input && value) {
        input.value = value;
    }
}

// Helper function to set select value safely
function setSelectValue(id, value) {
    const select = document.getElementById(id);
    if (select && value) {
        select.value = value;
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    toast.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: 500;
            max-width: 300px;
            word-wrap: break-word;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        ">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle'} mr-2"></i>
            ${message}
        </div>
    `;
    document.body.appendChild(toast);
    
    // Show toast with animation
    const toastElement = toast.firstElementChild;
    setTimeout(() => {
        toastElement.style.opacity = '1';
        toastElement.style.transform = 'translateX(0)';
    }, 100);
    
    // Hide and remove toast
    setTimeout(() => {
        toastElement.style.opacity = '0';
        toastElement.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, type === 'error' ? 5000 : 3000); // Error messages stay longer
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initializeProfilePage();
    }, 100);
});

// Remove skill
function removeSkill(skillIndex) {
    const user = window.KariyerAI?.currentUser;
    if (!user || !user.skills || skillIndex < 0 || skillIndex >= user.skills.length) {
        showToast('Beceri kaldırılamadı!', 'error');
        return;
    }
    
    const skillName = user.skills[skillIndex];
    
    if (confirm(`"${skillName}" becerisini kaldırmak istediğinizden emin misiniz?`)) {
        // Remove skill from array
        const updatedSkills = [...user.skills];
        updatedSkills.splice(skillIndex, 1);
        
        // Update user object properly
        const updatedUser = {
            ...user,
            skills: updatedSkills
        };
        
        // Update global data
        if (window.KariyerAI) {
            window.KariyerAI.currentUser = updatedUser;
            window.KariyerAI.saveUserData();
        }
        
        // Refresh display immediately
        displaySkills(updatedSkills);
        displayProfessionalInfo(updatedUser);
        
        // Save to backend
        saveToBackendWithCallback({
            ...updatedUser,
            skills: updatedSkills,  // Explicitly ensure skills are included
            experiences: updatedUser.experiences || []  // Explicitly ensure experiences are included
        }, () => {
            console.log('📌 [RemoveSkill] Backend save confirmed');
        });
        
        showToast('Beceri kaldırıldı!', 'success');
    }
}

// Remove experience
function removeExperience(expIndex) {
    const user = window.KariyerAI?.currentUser;
    if (!user || !user.experiences || expIndex < 0 || expIndex >= user.experiences.length) {
        showToast('Deneyim kaldırılamadı!', 'error');
        return;
    }
    
    const experience = user.experiences[expIndex];
    
    if (confirm(`"${experience.position}" deneyimini kaldırmak istediğinizden emin misiniz?`)) {
        // Remove experience from array
        const updatedExperiences = [...user.experiences];
        updatedExperiences.splice(expIndex, 1);
        
        // Update user object properly
        const updatedUser = {
            ...user,
            experiences: updatedExperiences
        };
        
        // Update global data
        if (window.KariyerAI) {
            window.KariyerAI.currentUser = updatedUser;
            window.KariyerAI.saveUserData();
        }
        
        // Refresh display immediately
        displayExperiences(updatedExperiences);
        displayProfessionalInfo(updatedUser);
        
        // Save to backend
        saveToBackendWithCallback({
            ...updatedUser,
            skills: updatedUser.skills || [],  // Explicitly ensure skills are included
            experiences: updatedExperiences  // Explicitly ensure experiences are included
        }, () => {
            console.log('📌 [RemoveExperience] Backend save confirmed');
        });
        
        showToast('Deneyim kaldırıldı!', 'success');
    }
}

// ===========================================
// SKILLS MANAGEMENT
// ===========================================

// Setup skills event listeners
function setupSkillsEventListeners() {
    const addSkillBtn = document.getElementById('addSkillBtn');
    const saveSkillBtn = document.getElementById('saveSkillBtn');
    const cancelSkillBtn = document.getElementById('cancelSkillBtn');
    const newSkillInput = document.getElementById('newSkillInput');
    const addSkillForm = document.getElementById('addSkillForm');
    
    if (addSkillBtn) {
        addSkillBtn.addEventListener('click', () => {
            addSkillForm.style.display = 'block';
            newSkillInput.focus();
        });
    }
    
    if (saveSkillBtn) {
        saveSkillBtn.addEventListener('click', addNewSkill);
    }
    
    if (cancelSkillBtn) {
        cancelSkillBtn.addEventListener('click', () => {
            addSkillForm.style.display = 'none';
            newSkillInput.value = '';
        });
    }
    
    if (newSkillInput) {
        newSkillInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addNewSkill();
            }
            if (e.key === 'Escape') {
                addSkillForm.style.display = 'none';
                newSkillInput.value = '';
            }
        });
    }
}

// Add new skill
function addNewSkill() {
    const newSkillInput = document.getElementById('newSkillInput');
    const skillName = newSkillInput.value.trim();
    
    if (!skillName) {
        showToast('Beceri adı boş olamaz!', 'error');
        return;
    }
    
    const user = window.KariyerAI?.currentUser;
    if (!user) {
        showToast('Kullanıcı bilgisi bulunamadı!', 'error');
        return;
    }
    
    const currentSkills = user.skills || [];
    
    // Check if skill already exists
    if (currentSkills.some(skill => skill.toLowerCase() === skillName.toLowerCase())) {
        showToast('Bu beceri zaten mevcut!', 'error');
        return;
    }
    
    // Add skill to user data
    const updatedSkills = [...currentSkills, skillName];
    
    // Update user object properly
    const updatedUser = {
        ...user,
        skills: updatedSkills
    };
    
    // Update global data
    if (window.KariyerAI) {
        window.KariyerAI.currentUser = updatedUser;
        window.KariyerAI.saveUserData();
    }
    
    // Refresh display immediately
    displaySkills(updatedSkills);
    displayProfessionalInfo(updatedUser);
    
    console.log('📌 [AddSkill] About to save user with skills:', updatedUser.skills);
    console.log('📌 [AddSkill] Updated user object:', updatedUser);
    
    // Save to backend and wait for confirmation - make sure to use updated user object
    saveToBackendWithCallback({
        ...updatedUser,
        skills: updatedSkills,  // Explicitly ensure skills are included
        experiences: updatedUser.experiences || []  // Explicitly ensure experiences are included
    }, () => {
        console.log('📌 [AddSkill] Backend save confirmed, skill should be persisted');
    });
    
    // Hide form and clear input
    document.getElementById('addSkillForm').style.display = 'none';
    newSkillInput.value = '';
    
    showToast('Beceri başarıyla eklendi!', 'success');
}

// ===========================================
// EXPERIENCE MANAGEMENT
// ===========================================

// Setup experience event listeners
function setupExperienceEventListeners() {
    const addExperienceBtn = document.getElementById('addExperienceBtn');
    const saveExperienceBtn = document.getElementById('saveExperienceBtn');
    const cancelExperienceBtn = document.getElementById('cancelExperienceBtn');
    const addExperienceForm = document.getElementById('addExperienceForm');
    
    if (addExperienceBtn) {
        addExperienceBtn.addEventListener('click', () => {
            addExperienceForm.style.display = 'block';
            document.getElementById('newExpPosition').focus();
        });
    }
    
    if (saveExperienceBtn) {
        saveExperienceBtn.addEventListener('click', addNewExperience);
    }
    
    if (cancelExperienceBtn) {
        cancelExperienceBtn.addEventListener('click', () => {
            addExperienceForm.style.display = 'none';
            clearExperienceForm();
        });
    }
}

// Add new experience
function addNewExperience() {
    const position = document.getElementById('newExpPosition').value.trim();
    const company = document.getElementById('newExpCompany').value.trim();
    const duration = document.getElementById('newExpDuration').value.trim();
    const location = document.getElementById('newExpLocation').value.trim();
    const description = document.getElementById('newExpDescription').value.trim();
    
    if (!position || !company) {
        showToast('Pozisyon ve şirket alanları zorunludur!', 'error');
        return;
    }
    
    const user = window.KariyerAI?.currentUser;
    if (!user) {
        showToast('Kullanıcı bilgisi bulunamadı!', 'error');
        return;
    }
    
    const newExperience = {
        position,
        company,
        duration: duration || 'Belirtilmemiş',
        location: location || '',
        description: description || 'Açıklama eklenmemiş'
    };
    
    const currentExperiences = user.experiences || [];
    const updatedExperiences = [...currentExperiences, newExperience];
    
    // Update user object properly
    const updatedUser = {
        ...user,
        experiences: updatedExperiences
    };
    
    // Update global data
    if (window.KariyerAI) {
        window.KariyerAI.currentUser = updatedUser;
        window.KariyerAI.saveUserData();
    }
    
    // Refresh display immediately
    displayExperiences(updatedExperiences);
    displayProfessionalInfo(updatedUser);
    
    console.log('📌 [AddExperience] About to save user with experiences:', updatedUser.experiences.length);
    console.log('📌 [AddExperience] Updated user object:', updatedUser);
    
    // Save to backend and wait for confirmation - make sure to use updated user object
    const dataToSend = {
        ...updatedUser,
        skills: updatedUser.skills || [],  // Explicitly ensure skills are included
        experiences: updatedExperiences  // Explicitly ensure experiences are included
    };
    
    console.log('📌 [AddExperience] Data to send to backend:', dataToSend);
    
    saveToBackendWithCallback(dataToSend, () => {
        console.log('📌 [AddExperience] Backend save confirmed, experience should be persisted');
    });
    
    // Hide form and clear inputs
    document.getElementById('addExperienceForm').style.display = 'none';
    clearExperienceForm();
    
    showToast('Deneyim başarıyla eklendi!', 'success');
}

// Clear experience form
function clearExperienceForm() {
    document.getElementById('newExpPosition').value = '';
    document.getElementById('newExpCompany').value = '';
    document.getElementById('newExpDuration').value = '';
    document.getElementById('newExpLocation').value = '';
    document.getElementById('newExpDescription').value = '';
}

// Export functions for external use
window.profilePageFunctions = {
    initializeProfilePage,
    loadUserProfile,
    addNewSkill,
    removeSkill,
    addNewExperience,
    removeExperience
};