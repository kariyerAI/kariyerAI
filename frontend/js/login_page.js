document.addEventListener('DOMContentLoaded', function() {
  const emailInput = document.getElementById('email');
  const loginButton = document.getElementById('loginButton');
  const messageContainer = document.getElementById('messageContainer');



  loginButton.addEventListener('click', handleLogin);

  emailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLogin();
    }
  });


async function handleLogin() {
  const email = document.getElementById("email").value.trim();

  const res = await fetch(`${window.KariyerAI.BACKEND_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });

  const result = await res.json();
  console.log("🔹 Email gönderiliyor:", email);
  console.log("🔹 Backend yanıtı:", result);

  if (result.success) {
    window.KariyerAI.currentUser = result.data;
    window.KariyerAI.saveUserData();
    localStorage.setItem("currentEmail", result.data.email);  
    window.location.href = "../html/dashboard_page.html";
  } else {
    displayMessage(result.message, "error");
  }
}

  function displayMessage(message, type) {
    messageContainer.textContent = message;
    messageContainer.className = 'mb-4 p-3 rounded-lg text-sm'; 
    if (type === 'success') {
      messageContainer.classList.add('bg-green-100', 'text-green-700');
    } else if (type === 'error') {
      messageContainer.classList.add('bg-red-100', 'text-red-700');
    }
    messageContainer.classList.remove('hidden');
  }
});