import { rootPath } from "../config.js";
import { join } from "path";

const ROLE_LABELS = { 15: "Root", 12: "Admin", 10: "Supervisor", 8: "Teacher", 5: "Student" };

const ASSIGNABLE_ROLES = {
  15: [{ value: 12, label: "Admin" }, { value: 10, label: "Supervisor" }, { value: 8, label: "Teacher" }, { value: 5, label: "Student" }],
  12: [{ value: 10, label: "Supervisor" }, { value: 8, label: "Teacher" }, { value: 5, label: "Student" }],
  10: [{ value: 8, label: "Teacher" }, { value: 5, label: "Student" }],
  8:  [{ value: 5, label: "Student" }],
};

function mainPage(req, res) {
  res.render(join(rootPath, "src", "views", "index.ejs"), {
    user: req.user,
    roleLabel: ROLE_LABELS[req.user.role] ?? "User",
    assignableRoles: ASSIGNABLE_ROLES[req.user.role] ?? [],
  });
}

export default mainPage;
