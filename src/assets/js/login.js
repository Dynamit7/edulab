const form = document.querySelector("#loginForm");
const signInBtn = document.querySelector(".signInButton");
const passwordHide = document.querySelector(".passwordHide");
const hide_icon = document.querySelector(".passwordHide>img");
const pswd_input = document.querySelector("#password_input");
const username_input = document.querySelector("#username_input");

let pswd_view = 0;

passwordHide.addEventListener("click", (event) => {
	event.preventDefault();
	if (!pswd_view) {
		pswd_view = 1;
		pswd_input.type = "text";
		hide_icon.src = "/icons/hide.png";
	} else if (pswd_view) {
		pswd_view = 0;
		pswd_input.type = "password";
		hide_icon.src = "/icons/view.png";
	}
});

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	const data = [
		{
			login: username_input.value,
			password: pswd_input.value,
		},
	];

	const res = await fetch("/login", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	const result = await res.text(); // у тебя сервер шлёт текст
	console.log(res);

	if (res.status == 404) {
		alert(result);
		return;
	}

	if (!res.ok) {
		alert("Error occurred");
		return;
	}

	if (res.redirected) window.location.href = res.url;
});
