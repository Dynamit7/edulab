import express from "express";
import path from "path";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import userRoutes from "./routers/userRouter.js";
import { jwtsecret } from "./config.js";
import jwt from "jsonwebtoken";

const app = express();

app.use(express.static(path.join(process.cwd(), "src", "assets")));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
	// если нет токена и это не /login
	if (!req.cookies.token && req.path !== "/login") {
		return res.redirect("/login");
	}

	// если токен есть — проверяем
	if (req.cookies.token) {
		try {
			const decoded = jwt.verify(req.cookies.token, jwtsecret);
			req.user = decoded; // сохраняем payload
			next();
		} catch (error) {
			res.clearCookie("token");
			return res.status(401).send("Invalid token!");
		}
	} else {
		next(); // доступ к /login
	}
});

app.use("/", userRoutes);

app.get("/", (req, res) => {
	res.sendFile(path.join(process.cwd(), "src", "views", "index.html"));
});

app.get("/login", (req, res) => {
	res.sendFile(path.join(process.cwd(), "src", "views", "login.html"));
});

app.listen(3000, () => {
	console.log("listen on 3000");
});
