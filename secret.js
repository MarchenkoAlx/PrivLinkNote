const crypto = require('crypto');

// Key length is dependent on the encryption algorithm. In this case, 'aes-256-cbc' requires a 256-bit key.
const key = crypto.randomBytes(32);

// The IV length is dependent on the encryption algorithm. In this case, 'aes-256-cbc' uses a 128-bit IV.
const iv = crypto.randomBytes(16);

console.log('Key:', key.toString('hex'));
console.log('IV:', iv.toString('hex'));
