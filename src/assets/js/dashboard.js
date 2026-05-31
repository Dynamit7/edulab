const burger    = document.getElementById("burgerBtn");
const sidebar   = document.getElementById("sidebar");
const overlay   = document.getElementById("overlay");
const closeBtn  = document.getElementById("sidebarClose");
const viewArea  = document.getElementById("viewArea");
const topbarTitle = document.getElementById("topbarTitle");

const VIEW_TITLES = {
  dashboard:  "Dashboard",
  groups:     "Группы",
  schedule:   "Расписание",
  attendance: "Посещаемость",
  payments:   "Платежи",
  users:      "Пользователи",
  branches:   "Филиалы",
  audit:      "Аудит лог",
};

// ── Sidebar toggle ────────────────────────────────────────────
function openSidebar()  { sidebar.classList.add("open"); overlay.classList.add("visible"); document.body.style.overflow = "hidden"; }
function closeSidebar() { sidebar.classList.remove("open"); overlay.classList.remove("visible"); document.body.style.overflow = ""; }

burger.addEventListener("click", openSidebar);
closeBtn.addEventListener("click", closeSidebar);
overlay.addEventListener("click", closeSidebar);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeSidebar(); });

// ── SPA router ────────────────────────────────────────────────
async function navigate(path) {
  closeSidebar();

  const [base] = path.split("/");
  const navItems = document.querySelectorAll(".nav-item[data-view]");
  navItems.forEach(el => el.classList.toggle("active", el.dataset.view === base));

  topbarTitle.textContent = VIEW_TITLES[base] ?? "Edulab";

  viewArea.innerHTML = '<div class="view-loading"><div class="spinner"></div></div>';

  try {
    const res = await fetch(`/view/${path}`);
    if (!res.ok) throw new Error(res.status);
    const html = await res.text();
    // createContextualFragment executes <script> tags, unlike innerHTML
    viewArea.innerHTML = "";
    viewArea.appendChild(document.createRange().createContextualFragment(html));
  } catch {
    viewArea.innerHTML = '<div class="view-content"><div class="empty-state" style="padding:60px 0"><p>Не удалось загрузить страницу</p></div></div>';
  }
}

// Intercept nav clicks
document.getElementById("nav").addEventListener("click", e => {
  const item = e.target.closest(".nav-item[data-view]");
  if (item) navigate(item.dataset.view);
});

// expose globally for onclick in partials
window.navigate = navigate;

// ── Initial load ──────────────────────────────────────────────
navigate("dashboard");

// ── Add User modal ────────────────────────────────────────────
const openBtn    = document.getElementById("openAddUser");
const backdrop   = document.getElementById("addUserBackdrop");
const closeModal = document.getElementById("addUserClose");
const cancelBtn  = document.getElementById("addUserCancel");
const addForm    = document.getElementById("addUserForm");

if (openBtn && backdrop) {
  const roles = JSON.parse(document.body.dataset.assignableRoles || "[]");
  const roleSelect = document.getElementById("addUserRoleSelect");
  roles.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r.value;
    opt.textContent = r.label;
    roleSelect.appendChild(opt);
  });

  function openModal()  { backdrop.classList.add("visible"); document.body.style.overflow = "hidden"; }
  function closeModalFn() {
    backdrop.classList.remove("visible");
    document.body.style.overflow = "";
    addForm.reset();
    document.getElementById("addUserError").textContent = "";
    document.getElementById("addUserError").classList.remove("visible");
    document.getElementById("addUserSubmit").classList.remove("loading");
  }

  openBtn.addEventListener("click", openModal);
  closeModal.addEventListener("click", closeModalFn);
  cancelBtn.addEventListener("click", closeModalFn);
  backdrop.addEventListener("click", e => { if (e.target === backdrop) closeModalFn(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && backdrop.classList.contains("visible")) closeModalFn(); });

  // Password toggle
  document.getElementById("addUserPwToggle").addEventListener("click", () => {
    const input = document.getElementById("addUserPassword");
    input.type = input.type === "password" ? "text" : "password";
  });

  // Submit
  addForm.addEventListener("submit", async e => {
    e.preventDefault();
    const submitBtn = document.getElementById("addUserSubmit");
    const errorEl   = document.getElementById("addUserError");

    submitBtn.classList.add("loading");
    errorEl.classList.remove("visible");

    const data = Object.fromEntries(new FormData(addForm).entries());

    try {
      const res = await fetch("/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        errorEl.textContent = json.error ?? "Ошибка";
        errorEl.classList.add("visible");
        submitBtn.classList.remove("loading");
        return;
      }

      closeModalFn();
      // Refresh current view if on users tab
      const activeNav = document.querySelector(".nav-item.active[data-view]");
      if (activeNav?.dataset.view === "users") navigate("users");
    } catch {
      errorEl.textContent = "Ошибка соединения";
      errorEl.classList.add("visible");
      submitBtn.classList.remove("loading");
    }
  });
}
