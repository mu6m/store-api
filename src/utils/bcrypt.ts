import * as bcrypt from "bcrypt";

const saltRounds = 10;

async function hashPassword(password: string): Promise<string> {
	const hash = await bcrypt.hash(password, saltRounds);
	return hash;
}

async function comparePassword(
	password: string,
	hashedPassword: string
): Promise<boolean> {
	return await bcrypt.compare(password, hashedPassword);
}

export { hashPassword, comparePassword };
