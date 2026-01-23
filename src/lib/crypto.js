import crypto from "crypto";

function createhash(passwd) {
	const hash = crypto.createHash("sha512");
	hash.update(passwd);
	const digest = hash.digest("hex");
	return digest;
}

export default createhash;
