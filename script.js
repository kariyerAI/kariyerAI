// Global Variables
let currentUser = null
let skills = []
let experiences = []

// DOM Content Loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
  setupEventListeners()
  loadUserData()
  setupAnimations()
})

// Initialize Application
function initializeApp() {
  console.log("KariyerAI uygulaması başlatılıyor...")

  // Check if user is logged in
  const userData = localStorage.getItem("kariyerAI_user")
  if (userData) {
    currentUser = JSON.parse(userData)
  }

  // Initialize page-specific functionality
  const currentPage = getCurrentPage()
  switch (currentPage) {
    case "index":
      initializeHomePage()
      break
    case "profil-olustur":
      initializeProfilePage()
      break
    case "dashboard":
      initializeDashboard()
      break
    case "is-eslestirme":
      initializeJobMatching()
      break
    case "beceri-analizi":
      initializeSkillAnalysis()
      break
    case "ogrenme-yol-haritasi":
      initializeLearningPath()
      break
    case "kariyer-simulasyonu":
      initializeCareerSimulation()
      break
    case "ilerleme-takibi":
      initializeProgressTracking()
      break
  }
}

// Get Current Page
function getCurrentPage() {
  const path = window.location.pathname
  const page = path.split("/").pop().replace(".html", "") || "index"
  return page
}

// Setup Event Listeners
function setupEventListeners() {
  // Mobile menu toggle
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle")
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener("click", toggleMobileMenu)
  }

  // Modal close
  const closeModal = document.querySelector(".close")
  if (closeModal) {
    closeModal.addEventListener("click", closeModalHandler)
  }

  // Window click to close modal
  window.addEventListener("click", (event) => {
    const modal = document.getElementById("demoModal")
    if (event.target === modal) {
      modal.style.display = "none"
    }
  })

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()
      const target = document.querySelector(this.getAttribute("href"))
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    })
  })
}

// Load User Data
function loadUserData() {
  const userData = localStorage.getItem("kariyerAI_user")
  if (userData) {
    currentUser = JSON.parse(userData)
    skills = currentUser.skills || []
    experiences = currentUser.experiences || []
  }
}

// Save User Data
function saveUserData() {
  if (currentUser) {
    currentUser.skills = skills
    currentUser.experiences = experiences
    currentUser.lastUpdated = new Date().toISOString()
    localStorage.setItem("kariyerAI_user", JSON.stringify(currentUser))
  }
}

// Setup Animations
function setupAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible")
      }
    })
  }, observerOptions)

  // Observe elements with animation classes
  document.querySelectorAll(".fade-in, .slide-in-left, .slide-in-right").forEach((el) => {
    observer.observe(el)
  })
}

// Home Page Functions
function initializeHomePage() {
  // Add animation classes to elements
  const featureCards = document.querySelectorAll(".feature-card")
  featureCards.forEach((card, index) => {
    card.classList.add("fade-in")
    card.style.animationDelay = `${index * 0.1}s`
  })

  const steps = document.querySelectorAll(".step")
  steps.forEach((step, index) => {
    step.classList.add("slide-in-left")
    step.style.animationDelay = `${index * 0.2}s`
  })
}

// Show Demo Modal
function showDemo() {
  const modal = document.getElementById("demoModal")
  if (modal) {
    modal.style.display = "block"
  }
}

// Close Modal Handler
function closeModalHandler() {
  const modal = document.getElementById("demoModal")
  if (modal) {
    modal.style.display = "none"
  }
}

// Toggle Mobile Menu
function toggleMobileMenu() {
  const nav = document.querySelector(".nav")
  if (nav) {
    nav.classList.toggle("mobile-active")
  }
}

// Profile Page Functions
function initializeProfilePage() {
  setupFileUpload()
  setupSkillsInput()
  setupExperienceManagement()
}

// Setup File Upload
function setupFileUpload() {
  const fileUpload = document.querySelector(".file-upload")
  const fileInput = document.getElementById("cvFile")

  if (fileUpload && fileInput) {
    fileUpload.addEventListener("click", () => fileInput.click())

    fileUpload.addEventListener("dragover", function (e) {
      e.preventDefault()
      this.classList.add("dragover")
    })

    fileUpload.addEventListener("dragleave", function (e) {
      e.preventDefault()
      this.classList.remove("dragover")
    })

    fileUpload.addEventListener("drop", function (e) {
      e.preventDefault()
      this.classList.remove("dragover")
      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFileUpload(files[0])
      }
    })

    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0])
      }
    })
  }
}

// Gemini API konfigürasyonu
const GEMINI_API_KEY = 'AIzaSyBfJAn7qJ_gKyLR4xBvTguQzY7nb_GtLjM'; 
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';



// Handle File Upload - Hata yönetimi geliştirildi
async function handleFileUpload(file) {
  console.log('Dosya yükleme başladı:', file.name, file.type);
  updateUploadStatus("CV yükleniyor...", "info");

  if (file.type === "application/pdf" || file.type.includes("document") || file.type === "text/plain") {
    updateUploadStatus("CV başarıyla yüklendi! AI analizi başlatılıyor...", "info");
    showNotification("CV başarıyla yüklendi! AI analizi başlatılıyor...", "success");

    try {
      console.log('Dosya okunuyor...');
      const fileText = await extractTextFromFile(file);
      console.log('Dosya başarıyla okundu, uzunluk:', fileText.length);

      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('AI analizi başlatılıyor...');
      const analysisResult = await analyzeWithGemini(fileText);
      console.log('Analiz sonucu:', analysisResult);

      showNotification("CV analizi tamamlandı! Profil bilgileri otomatik dolduruldu.", "success");
      updateUploadStatus("CV analizi tamamlandı! Profil bilgileri otomatik dolduruldu.", "success");

      populateFormFromCV(analysisResult);
      console.log('🧪 AI Analiz sonucu:', analysisResult);

    } catch (error) {
      console.error('CV analizi hatası detayı:', error);
      const msg = `Analiz hatası: ${error.message}. Lütfen geçerli bir CV dosyası yükleyin.`;
      showNotification(msg, "error");
      updateUploadStatus(msg, "error");
    }

  } else {
    const msg = "Lütfen geçerli bir CV dosyası yükleyin (PDF, DOC, DOCX, TXT)";
    showNotification(msg, "error");
    updateUploadStatus(msg, "error");
  }
}


function updateUploadStatus(message, type = "info") {
  const statusDiv = document.getElementById("uploadStatus");
  statusDiv.textContent = message;
  statusDiv.style.color = type === "error" ? "red" : "green";
}


async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    text += strings.join(' ') + '\n';
  }
  return text;
}


// extractTextFromFile fonksiyonun şöyle olabilir:

async function extractTextFromFile(file) {
  if (file.type === "application/pdf") {
    return extractTextFromPDF(file);
  } else if (file.type === "text/plain") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  } else {
    throw new Error("Sadece PDF ve düz metin dosyaları destekleniyor.");
  }
}


// Gemini AI ile CV analizi - Hata yönetimi geliştirildi
async function analyzeWithGemini(cvText) {
  console.log('CV analizi başlatılıyor...');


const prompt = `
Lütfen aşağıdaki CV metnini dikkatlice analiz et ve aşağıdaki JSON yapısına uygun şekilde, **sadece** JSON olarak yanıt ver:
Örnek JSON yapısı:

{
  "firstName": "ad",
  "lastName": "soyad",
  "email": "email@domain.com",
  "phone": "telefon",
  "location": "şehir, ülke",
  "currentTitle": "mevcut pozisyon",
  "summary": "kısa özet",
  "experienceLevel": "junior | mid | senior | lead",
  "skills": ["beceri1", "beceri2"],
  "experiences": [{"company": "şirket", "position": "pozisyon", "duration": "2022-2024", "description": "açıklama"}],
  "education": {
    "university": "üniversite",
    "degree": "bölüm",
    "graduationYear": "2022",
    "gpa": "3.5/4.0"
  }
}

Aşağıdaki metni kullanarak yukarıdaki örneğe göre bir çıktı ver. Staj ve iş sürelerini dikkat ederek experienceLevel alanını doldur. 

${cvText}
`


  try {
    console.log('Gemini API çağrısı yapılıyor...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 saniye timeout

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1000
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Hatası:', response.status, errorText);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Yanıtı alındı:', data);
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Geçersiz API yanıtı');
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
    
    const parsedData = JSON.parse(cleanedResponse);
    console.log('CV analizi tamamlandı:', parsedData);
    
    return parsedData;
    
  } catch (error) {
    console.error('Gemini API hatası detayı:', error);
    
  }
}



// Populate Form from CV - Hata korumalı versiyon
function populateFormFromCV(extractedData) {
  console.log('Form doldurma başladı:', extractedData);

  try {
    // Temel bilgileri doldur
    const basicFields = ['firstName', 'lastName', 'email', 'phone', 'location', 'currentTitle', 'summary'];
    basicFields.forEach(field => {
      const input = document.getElementById(field);
      if (input && extractedData[field]) {
        if(input.tagName.toLowerCase() === 'textarea') {
          input.value = extractedData[field];
        } else {
          input.value = extractedData[field];
        }
        console.log(`${field} dolduruldu:`, extractedData[field]);
      }
    });

    // Deneyim seviyesi doldur (select)
    if (extractedData.experienceLevel) {
      const level = extractedData.experienceLevel.toLowerCase().trim();
      const validOptions = ["junior", "mid", "senior", "lead"];
      if (validOptions.includes(level)) {
        const select = document.getElementById("experienceLevel");
        if (select) {
          select.value = level;
          console.log("Deneyim seviyesi dolduruldu:", level);
        }
      } else {
        console.warn("Bilinmeyen deneyim seviyesi:", level);
      }
    }

    // GPA doldur (opsiyonel, education içinde olabilir)
    if (extractedData.education && extractedData.education.gpa) {
      const gpaInput = document.getElementById("gpa");
      if (gpaInput) {
        gpaInput.value = extractedData.education.gpa;
        console.log("GPA dolduruldu:", extractedData.education.gpa);
      }
    }

    // Becerileri ekle
    if (extractedData.skills && Array.isArray(extractedData.skills) && extractedData.skills.length > 0) {
      skills = [...extractedData.skills];
      updateSkillsDisplay();
      console.log('Beceriler eklendi:', skills);
    } else {
      skills = [];
      console.log('Beceri bulunamadı, boş array');
    }

    // Deneyimleri ekle
    if (extractedData.experiences && Array.isArray(extractedData.experiences) && extractedData.experiences.length > 0) {
experiences = extractedData.experiences.map((exp, index) => ({
  id: Date.now() + index,
  position: exp.position || '',          // API ile birebir uyumlu
  company: exp.company || '',
  location: exp.location || '',
  duration: exp.duration || '',         
  description: exp.description || '',            
  matchScore: exp.matchScore || 0,   
  requiredSkills: exp.requiredSkills || [],  
  missingSkills: exp.missingSkills || [],    
  benefits: exp.benefits || [],       
  salary: exp.salary || '',
  applicants: exp.applicants || 0,
  type: exp.type || ''
}));



      updateExperienceDisplay();
      console.log('Deneyimler eklendi:', experiences);
    } else {
      experiences = [];
      console.log('Deneyim bulunamadı, boş array');
    }

    // Eğitim bilgilerini doldur
    if (extractedData.education && typeof extractedData.education === 'object') {
      const educationFields = {
        'university': extractedData.education.university || '',
        'degree': extractedData.education.degree || '', 
        'graduationYear': extractedData.education.graduationYear || ''
      };
      
      Object.keys(educationFields).forEach(field => {
        const input = document.getElementById(field);
        if (input && educationFields[field]) {
          input.value = educationFields[field];
          console.log(`Eğitim ${field} dolduruldu:`, educationFields[field]);
        }
      });
    }

    saveUserData();
    console.log('Form doldurma tamamlandı');

  } catch (error) {
    console.error('Form doldurma hatası:', error);
    showNotification("Form doldurma sırasında hata oluştu.", "error");
  }
}


// Setup Skills Input
function setupSkillsInput() {
  const skillInput = document.getElementById("skillInput")
  const addSkillBtn = document.getElementById("addSkillBtn")

  if (skillInput && addSkillBtn) {
    addSkillBtn.addEventListener("click", addSkill)
    skillInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault()
        addSkill()
      }
    })
  }

  updateSkillsDisplay()
}

// Add Skill
function addSkill() {
  const skillInput = document.getElementById("skillInput")
  const skillValue = skillInput.value.trim()

  if (skillValue && !skills.includes(skillValue)) {
    skills.push(skillValue)
    skillInput.value = ""
    updateSkillsDisplay()
    saveUserData()
  }
}

// Remove Skill
function removeSkill(skillToRemove) {
  skills = skills.filter((skill) => skill !== skillToRemove)
  updateSkillsDisplay()
  saveUserData()
}

// Update Skills Display
function updateSkillsDisplay() {
  const skillsContainer = document.getElementById("skillsContainer")
  if (!skillsContainer) return

  skillsContainer.innerHTML = ""

  skills.forEach((skill) => {
    const skillTag = document.createElement("div")
    skillTag.className = "skill-tag"
    skillTag.innerHTML = `
            ${skill}
            <span class="remove" onclick="removeSkill('${skill}')">&times;</span>
        `
    skillsContainer.appendChild(skillTag)
  })
}

// Setup Experience Management
function setupExperienceManagement() {
  const addExperienceBtn = document.getElementById("addExperienceBtn")
  if (addExperienceBtn) {
    addExperienceBtn.addEventListener("click", addExperience)
  }

  updateExperienceDisplay()
}

// Add Experience
function addExperience() {
  const newExperience = {
    id: Date.now(),
    company: "",
    position: "",
    duration: "",
    description: "",
  }

  experiences.push(newExperience)
  updateExperienceDisplay()
}

// Remove Experience
function removeExperience(experienceId) {
  experiences = experiences.filter((exp) => exp.id !== experienceId)
  updateExperienceDisplay()
  saveUserData()
}


// Update Experience Display
function updateExperienceDisplay() {
  const experienceContainer = document.getElementById("experienceContainer")
  if (!experienceContainer) return

  experienceContainer.innerHTML = ""

  experiences.forEach((exp, index) => {
    const expDiv = document.createElement("div")
    expDiv.className = "card mb-4"
    expDiv.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-start gap-4">
                    <div class="company-logo">
                        <i class="fas fa-building"></i>
                    </div>
                    <div>
                        <h4 class="text-xl font-semibold mb-1">${exp.position}</h4>
                        <div class="flex items-center gap-4 text-gray-600">
                            <span><i class="fas fa-building mr-1"></i>${exp.company}</span>
                            <span><i class="fas fa-map-marker-alt mr-1"></i>${exp.location}</span>
                            <span><i class="fas fa-clock mr-1"></i>${exp.duration}</span>
                        </div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="match-indicator ${exp.matchScore >= 90 ? "green" : exp.matchScore >= 80 ? "yellow" : "red"}"></div>
                        <span class="text-sm font-medium">%${exp.matchScore} Eşleşme</span>
                    </div>
                    <span class="badge badge-${exp.matchScore >= 90 ? "green" : exp.matchScore >= 80 ? "yellow" : "red"}">${exp.matchScore >= 90 ? "Mükemmel Eşleşme" : exp.matchScore >= 80 ? "İyi Eşleşme" : "Orta Eşleşme"}</span>
                </div>
            </div>
            
            <p class="text-gray-700 mb-4">${exp.description || 'Açıklama yok'}</p>

            
            <div class="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                    <h4 class="font-medium mb-2">Gerekli Beceriler</h4>
                    <div class="flex flex-wrap gap-2">
                        ${exp.requiredSkills
                          .map(
                            (skill) => `
                            <span class="skill-badge ${exp.missingSkills.includes(skill) ? "missing" : "have"}">
                                ${skill} ${exp.missingSkills.includes(skill) ? "❌" : ""}
                            </span>
                        `,
                          )
                          .join("")}
                    </div>
                </div>
                <div>
                    <h4 class="font-medium mb-2">Yan Haklar</h4>
                    <div class="flex flex-wrap gap-2">
                        ${exp.benefits.map((benefit) => `<span class="benefit-badge">${benefit}</span>`).join("")}
                    </div>
                </div>
            </div>
            
            <div class="flex items-center justify-between pt-4 border-t">
                <div class="flex items-center gap-6 text-sm text-gray-600">
                    <span><i class="fas fa-dollar-sign mr-1"></i>${exp.salary}</span>
                    <span><i class="fas fa-users mr-1"></i>${exp.applicants} başvuru</span>
                    <span class="badge badge-outline">${exp.type}</span>
                </div>
                <div class="flex items-center gap-2">
                    <button class="btn btn-outline btn-small">
                        <i class="fas fa-heart mr-2"></i>Kaydet
                    </button>
                    ${
                      exp.missingSkills.length > 0
                        ? `
                        <a href="ogrenme-yol-haritasi.html" class="btn btn-outline btn-small">
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
              exp.missingSkills.length > 0
                ? `
                <div class="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p class="text-sm text-orange-800">
                        <strong>Eksik Beceriler:</strong> ${exp.missingSkills.join(", ")} becerilerini öğrenerek bu pozisyon için daha uygun hale gelebilirsiniz.
                    </p>
                </div>
            `
                : ""
            }
        </div>
    `
    experienceContainer.appendChild(expDiv)
  })
}

// Update Experience
function updateExperience(experienceId, field, value) {
  const experience = experiences.find((exp) => exp.id === experienceId)
  if (experience) {
    experience[field] = value
    saveUserData()
  }
}

// Complete Profile
function completeProfile() {
  // Validate required fields
  const requiredFields = ["firstName", "lastName", "email"]
  const missingFields = []

  requiredFields.forEach((field) => {
    const input = document.getElementById(field)
    if (!input || !input.value.trim()) {
      missingFields.push(field)
    }
  })

  if (missingFields.length > 0) {
    showNotification("Lütfen tüm gerekli alanları doldurun.", "error")
    return
  }

  // Create user object
  const userData = {
    id: Date.now(),
    firstName: document.getElementById("firstName").value,
    lastName: document.getElementById("lastName").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    location: document.getElementById("location").value,
    currentTitle: document.getElementById("currentTitle").value,
    summary: document.getElementById("summary").value,
    skills: skills,
    experiences: experiences,
    createdAt: new Date().toISOString(),
    xp: 0,
    level: "Beginner",
    completedCourses: 0,
  }

  // Save user data
  localStorage.setItem("kariyerAI_user", JSON.stringify(userData))
  currentUser = userData

  showNotification("Profil başarıyla oluşturuldu! Dashboard'a yönlendiriliyorsunuz...", "success")

  setTimeout(() => {
    window.location.href = "dashboard.html"
  }, 2000)
}

// Dashboard Functions
function initializeDashboard() {
  if (!currentUser) {
    window.location.href = "profil-olustur.html"
    return
  }

  updateDashboardStats()
  loadRecentActivities()
  loadSkillGaps()
  loadUpcomingTasks()
}

// Update Dashboard Stats
function updateDashboardStats() {
  const stats = {
    xp: currentUser.xp || 2450,
    level: currentUser.level || "Mid-Level",
    nextLevelXp: 3000,
    jobMatches: 23,
    completedCourses: currentUser.completedCourses || 8,
    skillsLearned: currentUser.skills ? currentUser.skills.length : 12,
  }

  // Update stat displays
  updateElement("userXP", stats.xp.toLocaleString())
  updateElement("userLevel", stats.level)
  updateElement("jobMatches", stats.jobMatches)
  updateElement("completedCourses", stats.completedCourses)

  // Update progress bars
  const xpProgress = document.getElementById("xpProgress")
  if (xpProgress) {
    const progressBar = xpProgress.querySelector(".progress-bar")
    if (progressBar) {
      progressBar.style.width = `${(stats.xp / stats.nextLevelXp) * 100}%`
    }
  }
}

// Load Recent Activities
function loadRecentActivities() {
  const activities = [
    { type: "course", title: "React Hooks Eğitimi Tamamlandı", time: "2 saat önce", xp: 150 },
    { type: "skill", title: "TypeScript becerisi eklendi", time: "1 gün önce", xp: 100 },
    { type: "job", title: "5 yeni iş eşleştirmesi", time: "2 gün önce", xp: 0 },
    { type: "achievement", title: "Frontend Master rozetini kazandınız", time: "3 gün önce", xp: 200 },
  ]

  const activitiesContainer = document.getElementById("recentActivities")
  if (activitiesContainer) {
    activitiesContainer.innerHTML = activities
      .map(
        (activity) => `
            <div class="flex items-start gap-3 p-3 border rounded-lg">
                <div class="activity-icon ${activity.type}">
                    <i class="fas ${getActivityIcon(activity.type)}"></i>
                </div>
                <div class="flex-1">
                    <p class="font-medium text-sm">${activity.title}</p>
                    <p class="text-xs text-gray-500">${activity.time}</p>
                    ${activity.xp > 0 ? `<span class="badge">+${activity.xp} XP</span>` : ""}
                </div>
            </div>
        `,
      )
      .join("")
  }
}

// Get Activity Icon
function getActivityIcon(type) {
  const icons = {
    course: "fa-book-open",
    skill: "fa-star",
    job: "fa-briefcase",
    achievement: "fa-trophy",
  }
  return icons[type] || "fa-circle"
}

// Load Skill Gaps
function loadSkillGaps() {
  const skillGaps = [
    { skill: "Node.js", importance: "Yüksek", jobs: 15, progress: 0 },
    { skill: "SQL", importance: "Orta", jobs: 8, progress: 30 },
    { skill: "Docker", importance: "Orta", jobs: 6, progress: 0 },
  ]

  const skillGapsContainer = document.getElementById("skillGaps")
  if (skillGapsContainer) {
    skillGapsContainer.innerHTML = skillGaps
      .map(
        (gap) => `
            <div class="flex items-center justify-between p-4 border rounded-lg">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <h4 class="font-medium">${gap.skill}</h4>
                        <span class="badge ${gap.importance === "Yüksek" ? "badge-danger" : "badge-secondary"}">${gap.importance}</span>
                    </div>
                    <p class="text-sm text-gray-600">${gap.jobs} iş ilanında gerekli</p>
                    ${
                      gap.progress > 0
                        ? `
                        <div class="progress mt-2">
                            <div class="progress-bar" style="width: ${gap.progress}%"></div>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">%${gap.progress} tamamlandı</p>
                    `
                        : ""
                    }
                </div>
                <a href="ogrenme-yol-haritasi.html" class="btn btn-small btn-primary">
                    ${gap.progress > 0 ? "Devam Et" : "Başla"}
                </a>
            </div>
        `,
      )
      .join("")
  }
}

// Load Upcoming Tasks
function loadUpcomingTasks() {
  const tasks = [
    { title: "JavaScript ES6+ Quiz", type: "quiz", deadline: "Bugün", difficulty: "Kolay" },
    { title: "React Project: Todo App", type: "project", deadline: "3 gün", difficulty: "Orta" },
    { title: "API Integration Senaryosu", type: "scenario", deadline: "1 hafta", difficulty: "Zor" },
  ]

  const tasksContainer = document.getElementById("upcomingTasks")
  if (tasksContainer) {
    tasksContainer.innerHTML = tasks
      .map(
        (task) => `
            <div class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div class="flex items-center gap-3">
                    <div class="task-indicator ${task.type}"></div>
                    <div>
                        <h4 class="font-medium">${task.title}</h4>
                        <p class="text-sm text-gray-600">${task.deadline} • ${task.difficulty}</p>
                    </div>
                </div>
                <button class="btn btn-small">
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `,
      )
      .join("")
  }
}

// Job Matching Functions
function initializeJobMatching() {
  loadJobListings()
  setupJobFilters()
}

// Load Job Listings
function loadJobListings() {
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

// Create Job Card
function createJobCard(job) {
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
                        <a href="ogrenme-yol-haritasi.html" class="btn btn-outline btn-small">
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

// Setup Job Filters
function setupJobFilters() {
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

// Apply Job Filters
function applyJobFilters() {
  const searchTerm = document.getElementById("jobSearch")?.value || ""
  const location = document.getElementById("locationFilter")?.value || ""
  const experience = document.getElementById("experienceFilter")?.value || ""

  showNotification("Filtreler uygulanıyor...", "info")

  // Simulate filtering (in real app, this would filter the jobs array)
  setTimeout(() => {
    showNotification("Filtreler uygulandı!", "success")
    loadJobListings() // Reload with filters
  }, 1000)
}

// Skill Analysis Functions
function initializeSkillAnalysis() {
  loadUserSkills()
  loadSkillGapsAnalysis()
  loadIndustryInsights()
}

// Load User Skills
function loadUserSkills() {
  const userSkills = [
    {
      name: "JavaScript",
      level: 85,
      category: "Frontend",
      trend: "up",
      marketDemand: 95,
      jobCount: 1250,
      avgSalary: "18.000 TL",
      status: "strong",
    },
    {
      name: "React",
      level: 90,
      category: "Frontend",
      trend: "up",
      marketDemand: 92,
      jobCount: 980,
      avgSalary: "20.000 TL",
      status: "strong",
    },
    {
      name: "SQL",
      level: 30,
      category: "Database",
      trend: "stable",
      marketDemand: 90,
      jobCount: 1100,
      avgSalary: "17.000 TL",
      status: "critical",
    },
  ]

  const skillsContainer = document.getElementById("userSkillsAnalysis")
  if (skillsContainer) {
    skillsContainer.innerHTML = userSkills.map((skill) => createSkillAnalysisCard(skill)).join("")
  }
}

// Create Skill Analysis Card
function createSkillAnalysisCard(skill) {
  const statusColors = {
    strong: "green",
    developing: "blue",
    needs_improvement: "orange",
    critical: "red",
  }

  const statusTexts = {
    strong: "Güçlü",
    developing: "Gelişiyor",
    needs_improvement: "Geliştirilmeli",
    critical: "Kritik",
  }

  return `
        <div class="card skill-analysis-card">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                    <h4 class="font-semibold text-lg">${skill.name}</h4>
                    <span class="badge badge-outline">${skill.category}</span>
                    <span class="badge badge-${statusColors[skill.status]}">${statusTexts[skill.status]}</span>
                </div>
                <div class="flex items-center gap-2">
                    <i class="fas fa-trending-${skill.trend === "up" ? "up text-green-500" : skill.trend === "down" ? "down text-red-500" : "right text-gray-500"}"></i>
                    <span class="text-sm text-gray-600">${skill.jobCount} iş ilanı</span>
                </div>
            </div>
            
            <div class="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                    <p class="text-sm text-gray-600 mb-1">Seviyeniz</p>
                    <div class="flex items-center gap-2">
                        <div class="progress flex-1">
                            <div class="progress-bar" style="width: ${skill.level}%"></div>
                        </div>
                        <span class="text-sm font-medium">%${skill.level}</span>
                    </div>
                </div>
                <div>
                    <p class="text-sm text-gray-600 mb-1">Pazar Talebi</p>
                    <div class="flex items-center gap-2">
                        <div class="progress flex-1">
                            <div class="progress-bar" style="width: ${skill.marketDemand}%"></div>
                        </div>
                        <span class="text-sm font-medium">%${skill.marketDemand}</span>
                    </div>
                </div>
                <div>
                    <p class="text-sm text-gray-600 mb-1">Ortalama Maaş</p>
                    <p class="font-medium">${skill.avgSalary}</p>
                </div>
            </div>
            
            ${
              skill.status === "critical"
                ? `
                <div class="bg-red-50 border border-red-200 rounded p-3">
                    <p class="text-sm text-red-800">
                        <i class="fas fa-exclamation-circle mr-1"></i>
                        Bu beceri kritik seviyede. Hemen geliştirmeye başlamanızı öneriyoruz.
                    </p>
                </div>
            `
                : ""
            }
        </div>
    `
}

// Learning Path Functions
function initializeLearningPath() {
  loadSkillTrees()
  setupSkillTreeNavigation()
  loadAchievements()
}

// Load Skill Trees
function loadSkillTrees() {
  const skillTrees = {
    sql: {
      name: "SQL",
      description: "Veritabanı yönetimi ve sorgulama",
      totalModules: 8,
      completedModules: 2,
      estimatedTime: "4-6 hafta",
      difficulty: "Orta",
      modules: [
        {
          id: 1,
          title: "SQL Temelleri",
          description: "Veritabanı kavramları ve temel SQL komutları",
          status: "completed",
          duration: "2 saat",
          xp: 100,
          type: "video",
        },
        {
          id: 2,
          title: "SELECT ve Filtreleme",
          description: "Veri sorgulama ve filtreleme teknikleri",
          status: "completed",
          duration: "3 saat",
          xp: 150,
          type: "interactive",
        },
        {
          id: 3,
          title: "JOIN İşlemleri",
          description: "Tablolar arası ilişkiler ve birleştirme",
          status: "current",
          duration: "4 saat",
          xp: 200,
          type: "project",
        },
      ],
    },
  }

  displaySkillTree(skillTrees.sql)
}

// Display Skill Tree
function displaySkillTree(skillTree) {
  const container = document.getElementById("skillTreeContainer")
  if (!container) return

  container.innerHTML = `
        <div class="card mb-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold">${skillTree.name} Öğrenme Yolu</h2>
                    <p class="text-gray-600">${skillTree.description}</p>
                </div>
                <div class="text-right">
                    <span class="badge badge-outline mb-2">${skillTree.difficulty}</span>
                    <p class="text-sm text-gray-600">Tahmini süre: ${skillTree.estimatedTime}</p>
                </div>
            </div>
            <div class="mt-4">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm text-gray-600">İlerleme: ${skillTree.completedModules}/${skillTree.totalModules} modül tamamlandı</span>
                    <span class="text-sm font-medium">%${Math.round((skillTree.completedModules / skillTree.totalModules) * 100)}</span>
                </div>
                <div class="progress">
                    <div class="progress-bar" style="width: ${(skillTree.completedModules / skillTree.totalModules) * 100}%"></div>
                </div>
            </div>
        </div>
        
        <div class="modules-container">
            ${skillTree.modules.map((module, index) => createModuleCard(module, index)).join("")}
        </div>
    `
}

// Create Module Card
function createModuleCard(module, index) {
  const statusIcons = {
    completed: "fa-check-circle text-green-500",
    current: "fa-play-circle text-blue-500",
    available: "fa-circle text-gray-400",
    locked: "fa-lock text-gray-300",
  }

  const statusColors = {
    completed: "green",
    current: "blue",
    available: "gray",
    locked: "gray",
  }

  return `
        <div class="card module-card ${module.status === "current" ? "current-module" : ""}">
            <div class="flex items-start gap-4">
                <div class="flex flex-col items-center">
                    <div class="module-status-indicator ${statusColors[module.status]}">
                        <i class="fas ${statusIcons[module.status]}"></i>
                    </div>
                    ${index < 2 ? '<div class="module-connector"></div>' : ""}
                </div>
                
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-lg font-semibold">${module.title}</h3>
                        <div class="flex items-center gap-2">
                            <i class="fas ${getModuleTypeIcon(module.type)}"></i>
                            <span class="badge badge-outline">${module.type}</span>
                        </div>
                    </div>
                    
                    <p class="text-gray-600 mb-4">${module.description}</p>
                    
                    <div class="flex items-center gap-6 text-sm text-gray-500 mb-4">
                        <span><i class="fas fa-clock mr-1"></i>${module.duration}</span>
                        <span><i class="fas fa-star mr-1"></i>+${module.xp} XP</span>
                    </div>
                    
                    <div class="flex items-center gap-3">
                        ${getModuleActionButton(module)}
                    </div>
                </div>
            </div>
        </div>
    `
}

// Get Module Type Icon
function getModuleTypeIcon(type) {
  const icons = {
    video: "fa-video",
    interactive: "fa-code",
    project: "fa-file-alt",
    quiz: "fa-bolt",
  }
  return icons[type] || "fa-book-open"
}

// Get Module Action Button
function getModuleActionButton(module) {
  switch (module.status) {
    case "completed":
      return '<button class="btn btn-outline btn-small"><i class="fas fa-check-circle mr-2"></i>Tamamlandı</button>'
    case "current":
      return '<button class="btn btn-primary btn-small"><i class="fas fa-play mr-2"></i>Devam Et</button>'
    case "available":
      return '<button class="btn btn-primary btn-small"><i class="fas fa-arrow-right mr-2"></i>Başla</button>'
    case "locked":
      return '<button class="btn btn-outline btn-small" disabled><i class="fas fa-lock mr-2"></i>Kilitli</button>'
    default:
      return ""
  }
}

// Career Simulation Functions
function initializeCareerSimulation() {
  loadSimulationScenarios()
  setupSimulationTimer()
}

// Load Simulation Scenarios
function loadSimulationScenarios() {
  const scenarios = [
    {
      id: 1,
      title: "Teknik Mülakat: React Hooks",
      category: "Teknik",
      difficulty: "Orta",
      situation: "Bir React projesinde component'ler arası state paylaşımı için hangi yaklaşımı tercih edersiniz?",
      context: "Şirket: TechCorp | Pozisyon: Senior Frontend Developer | Mülakatçı: Teknik Lead",
      question:
        "Büyük bir e-ticaret uygulamasında kullanıcı sepeti bilgisini birden fazla component'te kullanmanız gerekiyor. Bu durumda hangi state yönetim yaklaşımını tercih edersiniz ve neden?",
      options: [
        {
          id: "a",
          text: "Props drilling kullanarak parent component'ten child component'lere veri geçiririm",
          feedback:
            "Props drilling küçük uygulamalar için uygun olsa da, büyük uygulamalarda maintainability sorunlarına yol açar.",
          score: 2,
        },
        {
          id: "b",
          text: "Context API kullanarak global state oluştururum",
          feedback: "Doğru yaklaşım! Context API bu tür durumlar için idealdir ve React'ın built-in çözümüdür.",
          score: 5,
        },
      ],
    },
  ]

  displayCurrentScenario(scenarios[0])
}

// Display Current Scenario
function displayCurrentScenario(scenario) {
  const container = document.getElementById("scenarioContainer")
  if (!container) return

  container.innerHTML = `
        <div class="card scenario-card">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h2 class="text-xl font-bold mb-2">${scenario.title}</h2>
                    <div class="flex items-center gap-4">
                        <span class="badge badge-secondary">${scenario.category}</span>
                        <span class="badge ${scenario.difficulty === "Zor" ? "badge-red" : "badge-blue"}">${scenario.difficulty}</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 class="font-medium mb-2"><i class="fas fa-briefcase mr-2"></i>Senaryo Bağlamı</h4>
                <p class="text-sm text-blue-800">${scenario.context}</p>
            </div>
            
            <div class="mb-6">
                <h4 class="font-medium mb-3"><i class="fas fa-exclamation-circle mr-2"></i>Durum</h4>
                <p class="text-gray-700">${scenario.situation}</p>
            </div>
            
            <div class="mb-6">
                <h4 class="font-medium mb-3"><i class="fas fa-comment mr-2"></i>Soru</h4>
                <p class="text-gray-800 font-medium">${scenario.question}</p>
            </div>
            
            <div class="mb-6">
                <h4 class="font-medium mb-4">Cevabınızı seçin:</h4>
                <div class="options-container">
                    ${scenario.options
                      .map(
                        (option) => `
                        <div class="option-card" onclick="selectOption('${option.id}')">
                            <input type="radio" name="answer" value="${option.id}" id="option_${option.id}">
                            <label for="option_${option.id}" class="option-label">${option.text}</label>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
            
            <div class="flex justify-between">
                <button class="btn btn-outline" disabled>
                    <i class="fas fa-arrow-left mr-2"></i>Önceki
                </button>
                <button class="btn btn-primary" onclick="submitAnswer()">
                    Cevabı Gönder
                </button>
            </div>
        </div>
    `
}

// Select Option
function selectOption(optionId) {
  document.querySelectorAll(".option-card").forEach((card) => {
    card.classList.remove("selected")
  })

  const selectedCard = document.querySelector(`#option_${optionId}`).closest(".option-card")
  selectedCard.classList.add("selected")
}

// Submit Answer
function submitAnswer() {
  const selectedOption = document.querySelector('input[name="answer"]:checked')
  if (!selectedOption) {
    showNotification("Lütfen bir seçenek seçin.", "warning")
    return
  }

  showNotification("Cevabınız değerlendiriliyor...", "info")

  setTimeout(() => {
    showAnswerFeedback(selectedOption.value)
  }, 1500)
}

// Show Answer Feedback
function showAnswerFeedback(selectedOptionId) {
  // This would show detailed feedback for the selected answer
  showNotification("Harika! Detaylı geri bildirim gösteriliyor.", "success")
}

// Progress Tracking Functions
function initializeProgressTracking() {
  loadProgressStats()
  loadWeeklyActivity()
  loadRecentAchievements()
  loadJobMatchHistory()
}

// Load Progress Stats
function loadProgressStats() {
  const stats = {
    totalXP: 2450,
    weeklyGoal: 300,
    weeklyProgress: 180,
    streak: 7,
    completedCourses: 8,
    totalCourses: 15,
  }

  updateElement("totalXP", stats.totalXP.toLocaleString())
  updateElement("weeklyProgress", `${stats.weeklyProgress}/${stats.weeklyGoal}`)
  updateElement("streak", `${stats.streak} gün`)
  updateElement("coursesProgress", `${stats.completedCourses}/${stats.totalCourses}`)

  // Update progress bars
  const weeklyProgressBar = document.getElementById("weeklyProgressBar")
  if (weeklyProgressBar) {
    weeklyProgressBar.style.width = `${(stats.weeklyProgress / stats.weeklyGoal) * 100}%`
  }
}

// Load Weekly Activity
function loadWeeklyActivity() {
  const weeklyData = [
    { day: "Pzt", xp: 45, courses: 1, simulations: 2 },
    { day: "Sal", xp: 30, courses: 0, simulations: 1 },
    { day: "Çar", xp: 60, courses: 2, simulations: 1 },
    { day: "Per", xp: 25, courses: 1, simulations: 0 },
    { day: "Cum", xp: 20, courses: 0, simulations: 1 },
    { day: "Cmt", xp: 0, courses: 0, simulations: 0 },
    { day: "Paz", xp: 0, courses: 0, simulations: 0 },
  ]

  const activityContainer = document.getElementById("weeklyActivityChart")
  if (activityContainer) {
    activityContainer.innerHTML = weeklyData
      .map(
        (day) => `
            <div class="activity-day">
                <div class="activity-bar ${day.xp > 0 ? "active" : ""}" style="height: ${Math.max((day.xp / 60) * 100, 10)}%">
                    <span class="activity-value">${day.xp}</span>
                </div>
                <span class="day-label">${day.day}</span>
                <div class="day-details">
                    <small>${day.courses} ders</small>
                    <small>${day.simulations} sim.</small>
                </div>
            </div>
        `,
      )
      .join("")
  }
}

// Utility Functions
function updateElement(id, content) {
  const element = document.getElementById(id)
  if (element) {
    element.textContent = content
  }
}

function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)} mr-2"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `

  // Add to page
  document.body.appendChild(notification)

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove()
    }
  }, 5000)
}

function getNotificationIcon(type) {
  const icons = {
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    warning: "fa-exclamation-triangle",
    info: "fa-info-circle",
  }
  return icons[type] || "fa-info-circle"
}

// Setup Simulation Timer
function setupSimulationTimer() {
  let timeLeft = 300 // 5 minutes
  const timerElement = document.getElementById("simulationTimer")

  if (timerElement) {
    const timer = setInterval(() => {
      const minutes = Math.floor(timeLeft / 60)
      const seconds = timeLeft % 60
      timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`

      if (timeLeft <= 0) {
        clearInterval(timer)
        showNotification("Süre doldu! Simülasyon otomatik olarak tamamlanıyor.", "warning")
      }

      timeLeft--
    }, 1000)
  }
}

// Initialize page-specific functions based on current page
function setupSkillTreeNavigation() {
  // This would handle switching between different skill trees
}

function loadAchievements() {
  // Load and display user achievements
}

function loadSkillGapsAnalysis() {
  // Load detailed skill gap analysis
}

function loadIndustryInsights() {
  // Load AI-powered industry insights
}

function loadRecentAchievements() {
  // Load recent achievements for progress tracking
}

function loadJobMatchHistory() {
  // Load job matching history and trends
}