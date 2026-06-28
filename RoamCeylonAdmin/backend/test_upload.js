const fs = require('fs');
async function main() {
  const base64 = Buffer.from('hello').toString('base64');
  const subdomain = process.env.NHOST_SUBDOMAIN || 'qfgzcxodwisrwyduyocq';
  const region = process.env.NHOST_REGION || 'ap-southeast-1';
  const storageUrl = `https://${subdomain}.storage.${region}.nhost.run/v1/files`;
  
  const blob = new Blob([Buffer.from(base64, 'base64')], { type: 'image/jpeg' });
  const formData = new FormData();
  formData.append('bucket-id', 'Activities'); // try this
  formData.append('file[]', blob, 'test.jpg');
  
  const res = await fetch(storageUrl, {
    method: 'POST',
    body: formData,
    // assuming it needs auth, maybe it will just fail with Bucket not found or Auth error
  });
  console.log('Activities bucket status:', res.status, await res.text());
}
main();
