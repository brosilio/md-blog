#!/usr/bin/env node
require("dotenv").config();
const crypto = require("crypto");
const fs = require("fs");
const readline = require("readline");

const CREDENTIALS_FILE = process.env.CREDENTIALS_FILE;

if (!CREDENTIALS_FILE) {
	console.error("Error: Set CREDENTIALS_FILE in .env first");
	process.exit(1);
}

function prompt(rl, text, masked = false) {
	return new Promise((resolve) => {
		rl.stdoutMuted = masked;
		rl.question(text, (answer) => {
			if (masked) process.stdout.write("\n");
			resolve(answer);
		});
	});
}

function createInterface() {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	rl._writeToOutput = function (str) {
		if (rl.stdoutMuted && str.trim() !== "") {
			rl.output.write("*");
		} else {
			rl.output.write(str);
		}
	};

	return rl;
}

(async () => {
	let existing = null;
	try {
		existing = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, "utf-8"));
		console.log(`Current username: ${existing.username}`);
	} catch {
		console.log("No existing credentials found. Creating new account.");
	}

	const rl = createInterface();

	const usernameInput = await prompt(
		rl,
		existing ? `New username [${existing.username}]: ` : "Username: "
	);
	const username = usernameInput.trim() || existing?.username;

	if (!username) {
		console.error("Error: Username cannot be empty.");
		rl.close();
		process.exit(1);
	}

	const password = await prompt(rl, "New password: ", true);
	if (!password) {
		console.error("Error: Password cannot be empty.");
		rl.close();
		process.exit(1);
	}

	const confirm = await prompt(rl, "Confirm password: ", true);
	rl.close();

	if (password !== confirm) {
		console.error("Error: Passwords do not match.");
		process.exit(1);
	}

	const salt = crypto.randomBytes(32).toString("hex");
	const algo = "sha256";
	const passwordHash = crypto
		.createHash(algo)
		.update(`${salt}:${password}`)
		.digest("hex");

	const credentials = { username, passwordHash, algo, salt };
	fs.writeFileSync(
		CREDENTIALS_FILE,
		JSON.stringify(credentials, null, 2),
		"utf-8"
	);

	console.log(`Account saved to ${CREDENTIALS_FILE}`);
})();
