// Табы
const tabs = document.querySelectorAll(".tab");
const contents = document.querySelectorAll(".tab-content");

tabs.forEach((tab) => {
	tab.addEventListener("click", () => {
		tabs.forEach((t) => t.classList.remove("active"));
		contents.forEach((c) => c.classList.remove("active"));

		tab.classList.add("active");
		document.getElementById(tab.dataset.tab).classList.add("active");
	});
});

// Бургер меню
const burger = document.querySelector(".burger");
const sidebar = document.querySelector(".sidebar");

burger.addEventListener("click", () => {
	sidebar.classList.toggle("collapsed");
});
