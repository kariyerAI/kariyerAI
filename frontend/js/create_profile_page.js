// create_profile_page.js - Fixed Version

// Global variables for this page
let userSkills = [];
let userExperiences = [];

// Initialize profile creation page
function initializeProfilePage() {
  console.log("Initializing profile creation page...");
  
  setupFileUpload();
  setupSkillsManagement();
  setupExperienceManagement();
  setupFormValidation();
}

// Setup file upload functionality
function setupFileUpload() {
  const fileUploadArea = document.getElementById('fileUploadArea');
  const fileInput = document.getElementById('cvFile');
  const selectFileButton = document.getElementById('selectFileButton');
  const uploadStatus = document.getElementById('uploadStatus');

  if (!fileUploadArea || !fileInput || !selectFileButton) {
    console.error("File upload elements not found");
    return;
  }

  // Click to select file
  selectFileButton.addEventListener('click', () => {
    fileInput.click();
  });

  // Drag and drop
  fileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadArea.classList.add('drag-over');
  });

  fileUploadArea.addEventListener('dragleave', () => {
    fileUploadArea.classList.remove('drag-over');
  });

  fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadArea.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0], uploadStatus);
    }
  });

  // File input change
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileUpload(e.target.files[0], uploadStatus);
    }
  });
}

// Handle file upload and analysis
async function handleFileUpload(file, statusElement) {
  console.log("Handling file upload:", file.name);
  
  if (!statusElement) {
    console.error("Status element not found");
    return;
  }

  // Validate file
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  if (file.size > maxSize) {
    statusElement.innerHTML = '<span style="color: red;">❌ Dosya boyutu 5MB\'dan büyük olamaz</span>';
    return;
  }

  if (!allowedTypes.includes(file.type)) {
    statusElement.innerHTML = '<span style="color: red;">❌ Sadece PDF, DOC, DOCX dosyaları desteklenir</span>';
    return;
  }

  statusElement.innerHTML = '<span style="color: blue;">📄 Dosya yükleniyor...</span>';

  try {
    let text = '';
    
    if (file.type === 'application/pdf') {
      text = await extractTextFromPDF(file);
    } else {
      // For DOC/DOCX files, you might need a different approach
      statusElement.innerHTML = '<span style="color: orange;">⚠️ DOC/DOCX dosyaları şu anda tam desteklenmiyor. PDF kullanın.</span>';
      return;
    }

    if (!text || text.trim().length < 50) {
      statusElement.innerHTML = '<span style="color: orange;">⚠️ CV\'den yeterli metin çıkarılamadı</span>';
      return;
    }

    statusElement.innerHTML = '<span style="color: blue;">🤖 AI analiz ediyor...</span>';
    
    // Send to backend for AI analysis
    const analysisResult = await analyzeCV(text);
    
    if (analysisResult.success) {
      fillFormWithAnalysis(analysisResult.data);
      statusElement.innerHTML = '<span style="color: green;">✅ CV başarıyla analiz edildi ve form dolduruldu!</span>';
    } else {
      statusElement.innerHTML = `<span style="color: red;">❌ ${analysisResult.message}</span>`;
    }

  } catch (error) {
    console.error("File upload error:", error);
    statusElement.innerHTML = '<span style="color: red;">❌ Dosya işlenirken hata oluştu</span>';
  }
}

// Extract text from PDF using PDF.js
async function extractTextFromPDF(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async function(e) {
      try {
        const typedArray = new Uint8Array(e.target.result);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\n';
        }

        resolve(fullText);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("File reading failed"));
    reader.readAsArrayBuffer(file);
  });
}

// Send CV text to backend for AI analysis
async function analyzeCV(cvText) {
  try {
    const response = await fetch(`${window.KariyerAI.BACKEND_URL}/analyze-cv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cvText })
    });

    return await response.json();
  } catch (error) {
    console.error("CV analysis error:", error);
    return {
      success: false,
      message: "CV analizi sırasında hata oluştu"
    };
  }
}

// Fill form with AI analysis results
function fillFormWithAnalysis(data) {
  console.log("Filling form with analysis:", data);

  // Basic info
  if (data.firstName) document.getElementById('firstName').value = data.firstName;
  if (data.lastName) document.getElementById('lastName').value = data.lastName;
  if (data.email) document.getElementById('email').value = data.email;
  if (data.phone) document.getElementById('phone').value = data.phone;
  if (data.location) document.getElementById('location').value = data.location;

  // Professional info
  if (data.currentTitle) document.getElementById('currentTitle').value = data.currentTitle;
  if (data.summary) document.getElementById('summary').value = data.summary;
  if (data.experienceLevel) document.getElementById('experienceLevel').value = data.experienceLevel;

  // Skills
  if (data.skills && Array.isArray(data.skills)) {
    userSkills = [...data.skills];
    renderSkills();
  }

  // Experiences
  if (data.experiences && Array.isArray(data.experiences)) {
    userExperiences = [...data.experiences];
    renderExperiences();
  }

  // Education
  if (data.education) {
    if (data.education.university) document.getElementById('university').value = data.education.university;
    if (data.education.degree) document.getElementById('degree').value = data.education.degree;
    if (data.education.graduationYear) document.getElementById('graduationYear').value = data.education.graduationYear;
    if (data.education.gpa) document.getElementById('gpa').value = data.education.gpa;
  }
}

// Setup skills management
function setupSkillsManagement() {
  const skillInput = document.getElementById('skillInput');
  const addSkillBtn = document.getElementById('addSkillBtn');

  if (!skillInput || !addSkillBtn) {
    console.error("Skill management elements not found");
    return;
  }

  addSkillBtn.addEventListener('click', addSkill);
  
  skillInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  });
}

// Add skill
function addSkill() {
  const skillInput = document.getElementById('skillInput');
  const skill = skillInput.value.trim();

  if (skill && !userSkills.includes(skill)) {
    userSkills.push(skill);
    skillInput.value = '';
    renderSkills();
  }
}

// Remove skill
function removeSkill(skill) {
  userSkills = userSkills.filter(s => s !== skill);
  renderSkills();
}

// Render skills
function renderSkills() {
  const container = document.getElementById('skillsContainer');
  if (!container) return;

  container.innerHTML = userSkills.map(skill => `
    <div class="skill-tag">
      <span>${skill}</span>
      <button type="button" onclick="removeSkill('${skill}')" class="skill-remove">×</button>
    </div>
  `).join('');
}

// Setup experience management
function setupExperienceManagement() {
  const addExperienceBtn = document.getElementById('addExperienceBtn');
  
  if (!addExperienceBtn) {
    console.error("Add experience button not found");
    return;
  }

  addExperienceBtn.addEventListener('click', addExperience);
}

// Add experience
function addExperience() {
  const experience = {
    id: Date.now(),
    company: '',
    position: '',
    duration: '',
    description: ''
  };

  userExperiences.push(experience);
  renderExperiences();
}

// Remove experience
function removeExperience(id) {
  userExperiences = userExperiences.filter(exp => exp.id !== id);
  renderExperiences();
}

// Render experiences
function renderExperiences() {
  const container = document.getElementById('experienceContainer');
  if (!container) return;

  container.innerHTML = userExperiences.map(exp => `
    <div class="experience-item card mb-4">
      <div class="flex justify-between items-start mb-4">
        <h4 class="font-semibold">İş Deneyimi</h4>
        <button type="button" onclick="removeExperience(${exp.id})" class="text-red-500 hover:text-red-700">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      <div class="grid md:grid-cols-2 gap-4">
        <div class="form-group">
          <label class="form-label">Şirket</label>
          <input type="text" class="form-input" value="${exp.company}" 
                 onchange="updateExperience(${exp.id}, 'company', this.value)" placeholder="Şirket adı">
        </div>
        <div class="form-group">
          <label class="form-label">Pozisyon</label>
          <input type="text" class="form-input" value="${exp.position}" 
                 onchange="updateExperience(${exp.id}, 'position', this.value)" placeholder="Pozisyon">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Süre</label>
        <input type="text" class="form-input" value="${exp.duration}" 
               onchange="updateExperience(${exp.id}, 'duration', this.value)" placeholder="ör. 2020-2022">
      </div>
      <div class="form-group">
        <label class="form-label">Açıklama</label>
        <textarea class="form-textarea" onchange="updateExperience(${exp.id}, 'description', this.value)" 
                  placeholder="İş tanımı ve sorumluluklarınız...">${exp.description}</textarea>
      </div>
    </div>
  `).join('');
}

// Update experience
function updateExperience(id, field, value) {
  const experience = userExperiences.find(exp => exp.id === id);
  if (experience) {
    experience[field] = value;
  }
}

// Setup form validation
function setupFormValidation() {
  const form = document.querySelector('form') || document;
  
  // Add validation classes and listeners as needed
  const requiredFields = ['firstName', 'lastName', 'email'];
  
  requiredFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('blur', () => validateField(field));
    }
  });
}

// Validate individual field
function validateField(field) {
  const value = field.value.trim();
  let isValid = true;
  let message = '';

  switch (field.id) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      isValid = emailRegex.test(value);
      message = isValid ? '' : 'Geçerli bir e-posta adresi girin';
      break;
    case 'firstName':
    case 'lastName':
      isValid = value.length >= 2;
      message = isValid ? '' : 'En az 2 karakter olmalı';
      break;
  }

  // Visual feedback
  if (isValid) {
    field.classList.remove('error');
    field.classList.add('valid');
  } else {
    field.classList.remove('valid');
    field.classList.add('error');
  }

  return isValid;
}

// Fixed completeProfile function in create_profile_page.js

// Complete profile function (called by button)
async function completeProfile() {
  console.log("Completing profile...");

  // Collect all form data
  const profileData = {
    firstName: document.getElementById('firstName')?.value || '',
    lastName: document.getElementById('lastName')?.value || '',
    email: document.getElementById('email')?.value || '',
    phone: document.getElementById('phone')?.value || '',
    location: document.getElementById('location')?.value || '',
    currentTitle: document.getElementById('currentTitle')?.value || '',
    experienceLevel: document.getElementById('experienceLevel')?.value || '',
    summary: document.getElementById('summary')?.value || '',
    skills: userSkills,
    experiences: userExperiences,
    university: document.getElementById('university')?.value || '',
    degree: document.getElementById('degree')?.value || '',
    graduationYear: document.getElementById('graduationYear')?.value || '',
    gpa: document.getElementById('gpa')?.value || ''
  };
  localStorage.setItem("kariyerAI_user", JSON.stringify(profileData));
  window.KariyerAI.currentUser = profileData;
  console.log("✅ User saved with ID:", profileData.id);
  // Basic validation
  if (!profileData.firstName || !profileData.lastName || !profileData.email) {
    alert('Lütfen zorunlu alanları doldurun (Ad, Soyad, E-posta)');
    return;
  }

  // Check password fields
  const password = document.getElementById('loginPassword')?.value || '';
  const confirmPassword = document.getElementById('confirmPassword')?.value || '';

  if (!password) {
    alert('Lütfen şifre oluşturun');
    return;
  }

  if (password !== confirmPassword) {
    alert('Şifreler eşleşmiyor');
    return;
  }

  try {
    // Show loading
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Kaydediliyor...';
    button.disabled = true;

    // **FIRST**: Save to localStorage immediately
    window.KariyerAI.currentUser = profileData;
    window.KariyerAI.saveUserData();
    console.log("Profile saved to localStorage:", profileData);

    // **THEN**: Try to save to backend (but don't block on it)
    try {
      const response = await fetch(`${window.KariyerAI.BACKEND_URL}/save-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      });

      const result = await response.json();
      if (result.success && result.data && result.data.length > 0) {
          profileData.id = result.data[0].id;  // ✅ ID artık mevcut
          localStorage.setItem("kariyerAI_user", JSON.stringify(profileData));
          window.KariyerAI.currentUser = profileData;
          console.log("✅ User saved with ID:", profileData.id);
      }

      console.log("Backend save result:", result);
      
      if (result.success) {
        console.log("Profile saved to backend successfully");
      } else {
        console.warn("Backend save failed, but continuing with localStorage data:", result.message);
      }
    } catch (backendError) {
      console.warn("Backend not available, but profile is saved locally:", backendError);
    }

    // Show success message
    alert('Profil başarıyla oluşturuldu!');
    
    // **IMPORTANT**: Add delay before redirect to ensure data is saved
    setTimeout(() => {
      // Redirect to dashboard with success parameter
      window.location.href = '../html/dashboard_page.html?profileCreated=true';
    }, 500);

  } catch (error) {
    console.error("Profile completion error:", error);
    alert('Profil oluşturulurken hata oluştu. Lütfen tekrar deneyin.');
  } finally {
    // Reset button
    const button = event.target;
    if (button) {
      button.textContent = originalText;
      button.disabled = false;
    }
  }
}

// Make functions available globally
window.removeSkill = removeSkill;
window.removeExperience = removeExperience;
window.updateExperience = updateExperience;
window.completeProfile = completeProfile;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeProfilePage);