import { join } from "path";
import { rootPath } from "../config.js";

export default function (req, res) {
	res.sendFile(join(rootPath, "src", "views", "schema.html"));
}
