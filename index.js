import { error, json, Router } from 'itty-router';
const router = Router();

export async function encrypt(text, key, iv) {
	const data = new TextEncoder().encode(text);
	const encryptedData = await crypto.subtle.encrypt(
		{
			name: 'AES-CBC',
			iv: iv,
		},
		key,
		data
	);
	return Buffer.from(new Uint8Array(encryptedData)).toString('base64');
}

export async function decrypt(encryptedData, key, iv) {
	let dataArray = Uint8Array.from(Buffer.from(encryptedData, 'base64'));
	const decryptedData = await crypto.subtle.decrypt(
		{
			name: 'AES-CBC',
			iv: iv,
		},
		key,
		dataArray
	);
	return new TextDecoder().decode(decryptedData);
}

router.post('/privlink/create', async (req, env, ctx) => {
	const { db, IV, SECRET } = env;

	const key = await crypto.subtle.importKey('raw', Buffer.from(SECRET, 'hex'), 'AES-CBC', false, [
		'encrypt',
		'decrypt',
	]);

	const iv = Buffer.from(IV, 'hex');

	try {
		let { content, password } = await req.json();

		if (!content || !content.match(/^[\w\s]+$/)) {
			return error(400, { status: 'Invalid content' });
		}

		if (password && !password.match(/^[a-zA-Z0-9@#!~^]+$/)) {
			return error(400, { status: 'Invalid password' });
		}

		if (password) {
			password = await encrypt(password, key, iv);
		}

		content = await encrypt(content, key, iv);

		// create short link
		const shortLink = Math.random().toString(36).substring(2, 12);
		const url = `https://${req.headers.get('host')}/${shortLink}`;

		if (password) {
			await db
				.prepare('INSERT INTO privlinks (content, password, link) VALUES (?1, ?2, ?3)')
				.bind(content, password, shortLink)
				.run();
		} else {
			await db
				.prepare('INSERT INTO privlinks (content, link) VALUES (?1, ?2)')
				.bind(content, shortLink)
				.run();
		}

		return json({ result: `success`, url, shortLink });
	} catch (e) {
		return error(e);
	}
});

router.post('/:shortLink', async (req, env, ctx) => {
	const { db, IV, SECRET } = env;

	const key = await crypto.subtle.importKey('raw', Buffer.from(SECRET, 'hex'), 'AES-CBC', false, [
		'encrypt',
		'decrypt',
	]);

	const iv = Buffer.from(IV, 'hex');

	const { shortLink } = req.params;

	try {
		const { password } = await req.json();
		const hashedPassword = await encrypt(password, key, iv);

		const { results } = await db
			.prepare('SELECT * FROM privlinks WHERE link = ? LIMIT 1')
			.bind(shortLink)
			.run();

		const link = results[0];

		if (!link) {
			return error(404, { status: 'Link not found' });
		}

		if (link.password && link.password !== hashedPassword) {
			return error(401, { status: 'Unauthorized' });
		}

		const content = await decrypt(link.content, key, iv);

		await db.prepare('DELETE FROM privlinks WHERE link = ?').bind(shortLink).run();

		return json({ content });
	} catch (e) {
		return error(e);
	}
});

router.all('*', () => new Response('Page not found', { status: 404 }));

export default {
	fetch: (request, ...args) =>
		router
			.handle(request, ...args)
			.then(json) // send as JSON
			.catch(error), // catch errors
};
