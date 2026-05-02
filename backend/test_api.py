import requests

print('Testing register...')
try:
    res = requests.post('http://localhost:8000/api/auth/register', json={'email': 'test_script@test.com', 'password': 'password'}, timeout=5)
    print(res.status_code, res.text)
except Exception as e:
    print('Register error:', e)
