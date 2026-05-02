def test_upload_valid_csv(client):
    csv_content = b"name,role,company,email\nJohn Doe,CEO,Acme,john@acme.com"
    response = client.post("/api/leads/upload", files={"file": ("leads.csv", csv_content, "text/csv")})
    assert response.status_code == 200
    assert response.json()["inserted"] == 1

def test_upload_duplicate_email(client):
    csv_content = b"name,role,company,email\nJohn Doe,CEO,Acme,john@acme.com"
    client.post("/api/leads/upload", files={"file": ("leads.csv", csv_content, "text/csv")})
    response = client.post("/api/leads/upload", files={"file": ("leads.csv", csv_content, "text/csv")})
    assert response.status_code == 200
    assert response.json()["skipped_duplicates"] == 1

def test_upload_rejects_non_csv(client):
    response = client.post("/api/leads/upload", files={"file": ("data.txt", b"hello", "text/plain")})
    assert response.status_code == 400

def test_upload_rejects_oversized(client):
    big_content = b"x" * (1024 * 1024 + 1)
    response = client.post("/api/leads/upload", files={"file": ("big.csv", big_content, "text/csv")})
    assert response.status_code == 413

def test_invalid_email_rejected(client):
    response = client.post("/api/leads/manual", json={"name": "A", "role": "B", "company": "C", "email": "not-an-email"})
    assert response.status_code == 422
