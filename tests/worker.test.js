import { unstable_dev } from 'wrangler';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { encrypt, decrypt } from '../index.js';

describe('Worker', () => {
	let worker;

	beforeAll(async () => {
		worker = await unstable_dev('index.js', {
			experimental: { disableExperimentalWarning: true },
		});
	});

	afterAll(async () => {
		await worker.stop();
	});

	it('should POST /privlink/create with status code 200', async () => {
		const res = await worker.fetch('/privlink/create', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content: 'Some long content', password: 'password' }),
		});
		const body = await res.json();
		expect(res.status).toBe(200);
		expect(body).toEqual({
			result: 'success',
			shortLink: expect.any(String),
			url: expect.any(String),
		});
	});

	it('should GET /:shotLink with status code 200', async () => {
		const res1 = await worker.fetch('/privlink/create', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content: 'Some long content', password: 'password' }),
		});
		const body1 = await res1.json();
		expect(res1.status).toBe(200);
		expect(body1).toEqual({
			result: 'success',
			shortLink: expect.any(String),
			url: expect.any(String),
		});

		const res = await worker.fetch(`/${body1.shortLink}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ password: 'password' }),
		});
		const body = await res.json();
		expect(res.status).toBe(200);
		expect(body).toEqual({ content: 'Some long content' });
	});

	it('should encrypt and decrypt', async () => {
		const hexKey = 'c5eca3e82e7b0ee72efa974887b94ab8c7efa16c615eaa666dfc4a6645bd46e3';
		const hexIV = '426d90155a4d7fd7fc4cb860d5509f73';

		const key = await crypto.subtle.importKey('raw', Buffer.from(hexKey, 'hex'), 'AES-CBC', false, [
			'encrypt',
			'decrypt',
		]);

		const iv = Buffer.from(hexIV, 'hex');
		const encrypted = await encrypt('Hello, World!', key, iv);
		const decrypted = await decrypt(encrypted, key, iv);

		expect(encrypted).toBe('irdaFo9Otz4yfbL+F+uZpQ==');
		expect(decrypted).toBe('Hello, World!');
	});
});
