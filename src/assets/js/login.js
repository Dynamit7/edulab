const form = document.getElementById("loginForm");
const signInBtn = document.getElementById("signInBtn");
const toggleBtn = document.getElementById("passwordHide");
const eyeIcon = document.getElementById("eye-icon");
const pswdInput = document.getElementById("password_input");
const usernameInput = document.getElementById("username_input");
const errorMsg = document.getElementById("errorMsg");

const EYE_OPEN = `
  <path stroke-linecap="round" stroke-linejoin="round"
    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
  <path stroke-linecap="round" stroke-linejoin="round"
    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943
       9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>`;

const EYE_CLOSED = `
  <path stroke-linecap="round" stroke-linejoin="round"
    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943
       -9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0
       114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29
       m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0
       0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0
       01-4.132 5.411m0 0L21 21"/>`;

let visible = false;

toggleBtn.addEventListener("click", () => {
	visible = !visible;
	pswdInput.type = visible ? "text" : "password";
	eyeIcon.innerHTML = visible ? EYE_CLOSED : EYE_OPEN;
});

function showError(msg) {
	errorMsg.textContent = msg;
	errorMsg.classList.add("visible");
}

function hideError() {
	errorMsg.classList.remove("visible");
}

form.addEventListener("submit", async (e) => {
	e.preventDefault();
	hideError();
	signInBtn.classList.add("loading");

	try {
		const res = await fetch("/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify([
				{
					login: usernameInput.value,
					password: pswdInput.value,
				},
			]),
		});

		const result = await res.text();

		if (res.status === 404) {
			showError(result || "User not found");
			return;
		}
		if (!res.ok) {
			showError("An error occurred. Please try again.");
			return;
		}
		if (res.redirected) window.location.href = res.url;
	} catch (err) {
		showError("Connection error. Please try again.");
	} finally {
		signInBtn.classList.remove("loading");
	}
});
