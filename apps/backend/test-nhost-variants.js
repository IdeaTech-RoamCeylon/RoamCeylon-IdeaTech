// Node 22 native fetch

async function test() {
  const idToken =
    'eyJhbGciOiJSUzI1NiIsImtpZCI6ImNjZTRlMDI0YTUxYWEwYzFjNDFjMWE0NTE1YTQxZGQ3ZTk2MTkzNmIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI3NzA2NTc3NzA3NjctZzZvMWdyZGpjZnNvaGg3Y2c4ZHA2cWFic3Q0a2Y3bmYuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI3NzA2NTc3NzA3Njctam03bjN0cHJhNGxsNzc3aW1wMmNlZDVrOGtlZWhjNGQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDkwMTg2ODk3OTcyNTc0Njg0MTIiLCJlbWFpbCI6InNvZXNoY29vcmF5QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoic29lc2ggY29vcmF5IiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0w2UWNGbDRqSWluTlFQUU1SLU9JMFJ4WjR1UlhrdFdybmhRc05KNTVvQzZlVWt5OUhZd1E9czk2LWMiLCJnaXZlbl9uYW1lIjoic29lc2giLCJmYW1pbHlfbmFtZSI6ImNvb3JheSIsImlhdCI6MTc3NTIzODMyNywiZXhwIjoxNzc1MjQxOTI3fQ.PgzAI1zMWHajmXs7XMCL2A6UQHM9pdlqkMbXvf4t-k77LQoJAMr32ytVoRQ3-R89ZPTnC2Y8-XVFYlSktlAi01YMYaiY5PIe9cdD4Xer9-JSPnbXTqq5RZM_XzVxNUSuNRmTglKltjzHBSMsY3vGWdN_3-GQGTb88GMT_3AzjdqiswtKectQAq7RRIXwr12-0jqC2k1kf1B800TiEU6wVSW8yU1B34w14LUTXU0ZxhZm4Vsk2gKcQuIE29ASkmTb378evycVWAi3kf8okwGi2vMPFen0BHP7xGnBIaPnEhO9QZIZ0PXkn63XQ_n1wg9To5z5dmVk4aX2ghFa9_9cUA';

  try {
    const url =
      'https://qfgzcxodwisrwyduyocq.auth.ap-southeast-1.nhost.run/v1/signin/idtoken';
    const body2 = JSON.stringify({ provider: 'apple', idToken: idToken });
    const r2 = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body2,
    });
    console.log(await r2.text());
  } catch (e) {
    console.error(e);
  }
}
test();
