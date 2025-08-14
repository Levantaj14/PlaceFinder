import crypto from 'crypto';

const key = 'qT@r!ZWS5shX4rjhH2fST%*Sr3VRv@$a';
const iv = 'ec2b1bff1cff119f1580dfff5113746e';

export function encrypt(data) {
  const cipher = crypto.createCipheriv('aes256', key, Buffer.from(iv, 'hex'));
  let encrypted = cipher.update(data, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decrypt(data) {
  const decipher = crypto.createDecipheriv('aes256', key, Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(data, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  return decrypted;
}
