// Global Sabitler ve Değişkenler
const BACKEND_URL = 'http://127.0.0.1:5000';
let currentUser = null;
let skills = [];
let experiences = [];

// DOM İçeriği Yüklendiğinde
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
  setupEventListeners();
  loadUserData();
  setupAnimations();
});

// Uygulamayı Başlatma
function initializeApp() {
  console.log("KariyerAI uygulaması başlatılıyor...");

  const userData = localStorage.getItem("kariyerAI_user");
  if (userData) {
    currentUser = JSON.parse(userData);
  }

  const currentPage = getCurrentPage();
  switch (currentPage) {
    case "onboarding_page":
      initializeHomePage();
      break;
    case "create_profile_page":
      initializeProfilePage();
      break;
    case "dashboard_page":
      initializeDashboard();
      break;
    case "job_matching":
      initializeJobMatching();
      break;
    case "skill_analysis":
      initializeSkillAnalysis();
      break;
    case "learning_path_page":
      initializeLearningPath();
      break;
    case "career_simulation":
      initializeCareerSimulation();
      break;
    case "ilerleme-takibi":
      initializeProgressTracking();
      break;
  }
}

// Sayfanın adını alma
function getCurrentPage() {
  const path = window.location.pathname;
  const page = path.split("/").pop().replace(".html", "") || "index";
  return page;
}

// Olay dinleyicilerini ayarlama
function setupEventListeners() {
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener("click", toggleMobileMenu);
  }

  const closeModal = document.querySelector(".close");
  if (closeModal) {
    closeModal.addEventListener("click", closeModalHandler);
  }

  window.addEventListener("click", (event) => {
    const modal = document.getElementById("demoModal");
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });
}

// Kullanıcı verilerini yükleme
function loadUserData() {
  const userData = localStorage.getItem("kariyerAI_user");
  if (userData) {
    currentUser = JSON.parse(userData);
    skills = currentUser.skills || [];
    experiences = currentUser.experiences || [];
  }
}

// Kullanıcı verilerini kaydetme
function saveUserData() {
  if (currentUser) {
    currentUser.skills = skills;
    currentUser.experiences = experiences;
    currentUser.lastUpdated = new Date().toISOString();
    localStorage.setItem("kariyerAI_user", JSON.stringify(currentUser));
  }
}

// Animasyonları ayarlama
function setupAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, observerOptions);

  document.querySelectorAll(".fade-in, .slide-in-left, .slide-in-right").forEach((el) => {
    observer.observe(el);
  });
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

// Diğer genel işlevler
function toggleMobileMenu() {
  const nav = document.querySelector(".nav");
  if (nav) {
    nav.classList.toggle("mobile-active");
  }
}

function showDemo() {
  const modal = document.getElementById("demoModal");
  if (modal) {
    modal.style.display = "block";
  }
}

function closeModalHandler() {
  const modal = document.getElementById("demoModal");
  if (modal) {
    modal.style.display = "none";
  }
}

