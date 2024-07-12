document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.querySelector(".login-form-container form");
  const emailInput = document.querySelector(
    '.login-form-container input[type="email"]'
  );
  const passwordInput = document.querySelector(
    '.login-form-container input[type="password"]'
  );
  // const rememberMeCheckbox = document.querySelector('#remember-me');
  const signInButton = document.querySelector(".login-form-container .btn");
  // const forgotPasswordLink = document.querySelector('.login-form-container p:first-child a');

  // Replace this with your actual authentication logic
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = emailInput.value;
    const password = passwordInput.value;
    // const rememberMe = rememberMeCheckbox.checked;


    fetch("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Authentication successful
          if (data.isAdmin) {
            // If user is an admin, redirect to the admin page
            window.location.href = "/admin"; // Change to your admin page URL
          } else {
            // If user is not an admin, redirect to the home page
            window.location.href = "/"; // Change to your home page URL
          }
        } else {
          if (data.message === "Authentication failed. User is blocked.") {
            alert("Authentication failed. User is blocked.");
        } else {
            alert("Authentication failed. Please check your credentials.");
        }
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert(
          "An error occurred while trying to sign in. Please try again later."
        );
      });
    // }
  });

  document
    .getElementById("logoutButton")
    .addEventListener("click", function () {
      // Send a request to the server to clear the session
      fetch("/auth/logout", {
        method: "POST",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Logout successful, redirect to index.html
            window.location.href = "/";
          } else {

          }
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    });
});
