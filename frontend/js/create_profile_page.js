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


// Handle File Upload (profil oluşturulan sayfadaki dosya alan fonksiyonu)
async function handleFileUpload(file) {
  console.log('Dosya yükleme başladı:', file.name, file.type);
  updateUploadStatus("CV yükleniyor...", "info");

  if (file.type === "application/pdf" || file.type.includes("document") || file.type === "text/plain") {
    updateUploadStatus("CV başarıyla yüklendi! AI analizi başlatılıyor...", "info");
    //showNotification("CV başarıyla yüklendi! AI analizi başlatılıyor...", "success");

    try {
      console.log('Dosya okunuyor...');
      const fileText = await extractTextFromFile(file);
      console.log('Dosya başarıyla okundu, uzunluk:', fileText.length);

      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('AI analizi başlatılıyor...');
      const analysisResult = await analyzeWithGemini(fileText);
      console.log('Analiz sonucu:', analysisResult);

      //showNotification("CV analizi tamamlandı! Profil bilgileri otomatik dolduruldu.", "success");
      updateUploadStatus("CV analizi tamamlandı! Profil bilgileri otomatik dolduruldu.", "success");

      populateFormFromCV(analysisResult);
      console.log('🧪 AI Analiz sonucu:', analysisResult);

    } catch (error) {
      console.error('CV analizi hatası detayı:', error);
      const msg = `Analiz hatası: ${error.message}. Lütfen geçerli bir CV dosyası yükleyin.`;
      //showNotification(msg, "error");
      updateUploadStatus(msg, "error");
    }

  } else {
    const msg = "Lütfen geçerli bir CV dosyası yükleyin (PDF, DOC, DOCX, TXT)";
    //showNotification(msg, "error");
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


async function analyzeWithGemini(cvText) {
  console.log('CV analizi başlatılıyor...');

  // Prompt'u aynı tut (değişiklik yok)
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
`;

  try {
    console.log('Backend üzerinden Gemini API çağrısı yapılıyor...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 saniye timeout (biraz daha uzun)

    const response = await fetch(`${BACKEND_URL}/analyze-cv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cvText: cvText
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API Hatası:', response.status, errorText);
      throw new Error(`Backend API Error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Backend API Yanıtı alındı:', result);
    
    // Backend'den gelen yanıtı kontrol et
    if (!result.success) {
      throw new Error(result.message || 'Backend analiz hatası');
    }

    const parsedData = result.data;
    console.log('CV analizi tamamlandı:', parsedData);
    
    return parsedData;
    
  } catch (error) {
    console.error('CV analizi hatası detayı:', error);
    
    // Hata durumunda boş obje döndür (mevcut kodunla uyumlu)
    throw new Error(`CV analizi başarısız: ${error.message}`);
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
    //showNotification("Form doldurma sırasında hata oluştu.", "error");
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
                        <a href="../html/learning_path_page.html" class="btn btn-outline btn-small">
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


async function completeProfile() {
  try {
    // Formdan verileri topla
    const profileData = {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      location: document.getElementById('location').value.trim(),
      currentTitle: document.getElementById('currentTitle').value.trim(),
      experienceLevel: document.getElementById('experienceLevel').value,
      summary: document.getElementById('summary').value.trim(),
      skills: skills, // Global skills array
      experiences: experiences, // Global experiences array
      university: document.getElementById('university').value.trim(),
      degree: document.getElementById('degree').value.trim(),
      graduationYear: document.getElementById('graduationYear').value.trim(),
      gpa: document.getElementById('gpa').value.trim(),
    };

    // Backend'e POST isteği gönder
    const response = await fetch(`${BACKEND_URL}/save-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
          console.log('Profil başarıyla kaydedildi!', 'success');
      // Dashboard'a yönlendir
      setTimeout(() => {
        window.location.href = '../html/dashboard_page.html';
      }, 1500);
    } else {
      throw new Error(result.message || 'Profil kaydedilirken hata oluştu');
    }

  } catch (error) {
    console.error('Profil kaydetme hatası:', error);
    //showNotification(`Hata: ${error.message}`, 'error');
  }
}
