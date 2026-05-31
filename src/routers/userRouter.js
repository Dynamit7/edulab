import express from "express";
import userController from "../controllers/userController.js";
import mainPageController from "../controllers/mainPageController.js";
import loginPageController from "../controllers/loginPageController.js";
import schemaPageController from "../controllers/schemaPageController.js";
import { viewDashboard, viewGroups, viewGroupDetail, viewSchedule, viewAttendance, viewUsers } from "../controllers/viewController.js";

const router = express.Router();

router.post("/login", userController.auth);
router.get("/login", loginPageController);
router.get("/schema", schemaPageController);
router.get("/", mainPageController);

// SPA view partials
router.get("/view/dashboard",    viewDashboard);
router.get("/view/groups",       viewGroups);
router.get("/view/groups/:id",   viewGroupDetail);
router.get("/view/schedule",     viewSchedule);
router.get("/view/attendance",   viewAttendance);
router.get("/view/users",        viewUsers);

router.get("/getAllUsers", userController.getUsers);
router.post("/users", userController.addUser);

export default router;
