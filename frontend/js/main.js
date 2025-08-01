// main.js - Fixed Version

// Global Constants and Variables
const BACKEND_URL = 'http://127.0.0.1:5000';
let currentUser = null;
let skills = [];
let experiences = [];

// Get current page name
function getCurrentPage() {
  const path = window.location.pathname;
  const page = path.split("/").pop().replace(".html", "").replace("_page", "");
  return page || "index";
}

// Load user data from localStorage
function loadUserData() {
  try {
    const userData = localStorage.getItem("kariyerAI_user");
    if (userData) {
      currentUser = JSON.parse(userData);
      skills = currentUser.skills || [];
      experiences = currentUser.experiences || [];
      console.log("User data loaded:", currentUser);
    } else {
      currentUser = null;
      skills = [];
      experiences = [];
      console.log("No user data found");
    }
  } catch (error) {
    console.error("Error loading user data:", error);
    currentUser = null;
    skills = [];
    experiences = [];
  }
}

// Save user data to localStorage
function saveUserData() {
  try {
    if (currentUser) {
      currentUser.skills = skills;
      currentUser.experiences = experiences;
      currentUser.lastUpdated = new Date().toISOString();
      localStorage.setItem("kariyerAI_user", JSON.stringify(currentUser));
      console.log("User data saved");
    }
  } catch (error) {
    console.error("Error saving user data:", error);
  }
}

// Setup animations
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

  // Observe elements that need animation
  document.querySelectorAll(".fade-in, .slide-in-left, .slide-in-right").forEach((el) => {
    observer.observe(el);
  });
}

// Initialize home/onboarding page
function initializeHomePage() {
  console.log("Initializing home page...");
  
  // Add animation classes to feature cards
  const featureCards = document.querySelectorAll(".feature-card");
  featureCards.forEach((card, index) => {
    card.classList.add("fade-in");
    card.style.animationDelay = `${index * 0.1}s`;
  });

  // Add animation classes to steps
  const steps = document.querySelectorAll(".step");
  steps.forEach((step, index) => {
    step.classList.add("slide-in-left");
    step.style.animationDelay = `${index * 0.2}s`;
  });
}

// Toggle mobile menu
function toggleMobileMenu() {
  const nav = document.querySelector(".nav");
  if (nav) {
    nav.classList.toggle("mobile-active");
  }
}

// Show demo modal
function showDemo() {
  const modal = document.getElementById("demoModal");
  if (modal) {
    modal.style.display = "block";
  }
}

// Close modal
function closeModalHandler() {
  const modal = document.getElementById("demoModal");
  if (modal) {
    modal.style.display = "none";
  }
}

// Setup event listeners
function setupEventListeners() {
  // Mobile menu toggle
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener("click", toggleMobileMenu);
  }

  // Modal close button
  const closeModal = document.querySelector(".close");
  if (closeModal) {
    closeModal.addEventListener("click", closeModalHandler);
  }

  // Click outside modal to close
  window.addEventListener("click", (event) => {
    const modal = document.getElementById("demoModal");
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  // Smooth scroll for anchor links
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

// Initialize the application
function initializeApp() {
  console.log("KariyerAI application starting...");

  const currentPage = getCurrentPage();
  console.log("Current page:", currentPage);

  // Sadece profil tamamlanmış sayfalarda userData yüklensin
  if (currentPage !== "create_profile") {
    loadUserData();
  } else {
    currentUser = null;
    skills = [];
    experiences = [];
    console.log("Profile creation page - no user data loaded");
  }
  // Initialize page-specific functionality
  switch (currentPage) {
    case "onboarding":
    case "index":
      initializeHomePage();
      break;
    case "create_profile":
      // This will be handled by create_profile_page.js
      console.log("Profile creation page detected");
      break;
    case "dashboard":
      // This will be handled by dashboard_page.js
      console.log("Dashboard page detected");
      break;
    case "job_matching":
      console.log("Job matching page detected");
      break;
    case "skill_analysis":
      console.log("Skill analysis page detected");
      break;
    case "learning_path":
      console.log("Learning path page detected");
      break;
    case "career_simulation":
      console.log("Career simulation page detected");
      break;
    default:
      console.log("Default page initialization for:", currentPage);
  }
}

// Utility functions that other files can use
window.KariyerAI = {
  // Export useful functions for other scripts
  loadUserData,
  saveUserData,
  getCurrentPage,
  BACKEND_URL,
  get currentUser() { return currentUser; },
  set currentUser(value) { currentUser = value; },
  get skills() { return skills; },
  set skills(value) { skills = value; },
  get experiences() { return experiences; },
  set experiences(value) { experiences = value; }
};

// Start the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
  setupEventListeners();
  setupAnimations();
});