"""
FinTres Pro API Tests
Tests for: Auth, SMTP settings, Dashboard, Company switcher
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@fintrack.com"
ADMIN_PASSWORD = "Admin123!"


class TestAuth:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test admin login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "Token not in response"
        assert "user" in data, "User not in response"
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
        print(f"✓ Login successful for {ADMIN_EMAIL}")
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials correctly rejected")
    
    def test_auth_me_endpoint(self):
        """Test /auth/me returns current user"""
        # First login
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_resp.json()["token"]
        
        # Get current user
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        print("✓ /auth/me returns correct user data")


class TestSMTPSettings:
    """SMTP settings endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_smtp_settings(self, auth_token):
        """Test GET /api/smtp returns saved settings"""
        response = requests.get(
            f"{BASE_URL}/api/smtp",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"GET /smtp failed: {response.text}"
        
        data = response.json()
        if data:  # Settings exist
            assert "smtp_host" in data
            assert "smtp_port" in data
            assert "smtp_user" in data
            assert "sender_name" in data
            assert "sender_email" in data
            assert "notify_email" in data
            assert "is_active" in data
            # Password should NOT be returned
            assert "smtp_password" not in data
            print(f"✓ GET /smtp returns settings: host={data.get('smtp_host')}")
        else:
            print("✓ GET /smtp returns null (no settings saved yet)")
    
    def test_save_smtp_settings(self, auth_token):
        """Test POST /api/smtp saves settings correctly"""
        smtp_data = {
            "smtp_host": "smtp.test.com",
            "smtp_port": 587,
            "smtp_user": "test@test.com",
            "smtp_password": "testpassword123",
            "sender_name": "FinTres Pro Test",
            "sender_email": "noreply@test.com",
            "notify_email": "admin@test.com",
            "is_active": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/smtp",
            json=smtp_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"POST /smtp failed: {response.text}"
        
        data = response.json()
        assert data["smtp_host"] == smtp_data["smtp_host"]
        assert data["smtp_port"] == smtp_data["smtp_port"]
        assert data["smtp_user"] == smtp_data["smtp_user"]
        assert data["sender_name"] == smtp_data["sender_name"]
        assert data["sender_email"] == smtp_data["sender_email"]
        assert data["notify_email"] == smtp_data["notify_email"]
        assert data["is_active"] == smtp_data["is_active"]
        # Password should NOT be in response
        assert "smtp_password" not in data
        print("✓ POST /smtp saves settings correctly")
    
    def test_smtp_test_endpoint(self, auth_token):
        """Test POST /api/smtp/test endpoint is accessible"""
        response = requests.post(
            f"{BASE_URL}/api/smtp/test",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        # Expected to fail with 500 since SMTP credentials are fake
        # But endpoint should be reachable (not 404)
        assert response.status_code in [200, 400, 500], f"Unexpected status: {response.status_code}"
        print(f"✓ POST /smtp/test endpoint accessible (status: {response.status_code})")
    
    def test_smtp_send_reminders_endpoint(self, auth_token):
        """Test POST /api/smtp/send-reminders endpoint is accessible"""
        response = requests.post(
            f"{BASE_URL}/api/smtp/send-reminders",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        # Should return 200 even if no reminders to send
        assert response.status_code == 200, f"send-reminders failed: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"✓ POST /smtp/send-reminders works: {data['message']}")
    
    def test_smtp_requires_admin(self):
        """Test SMTP endpoints require admin role"""
        # Try without auth
        response = requests.get(f"{BASE_URL}/api/smtp")
        assert response.status_code in [401, 403], "SMTP should require auth"
        print("✓ SMTP endpoints require authentication")


class TestDashboard:
    """Dashboard stats endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_dashboard_stats(self, auth_token):
        """Test GET /api/dashboard/stats returns data"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "total_income" in data
        assert "total_expense" in data
        assert "net_balance" in data
        assert "total_personnel" in data
        assert "pending_reminders" in data
        print(f"✓ Dashboard stats: income={data['total_income']}, expense={data['total_expense']}")
    
    def test_dashboard_stats_with_company_filter(self, auth_token):
        """Test dashboard stats with company_id filter"""
        # First get companies
        companies_resp = requests.get(
            f"{BASE_URL}/api/companies",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        companies = companies_resp.json()
        
        if companies:
            company_id = companies[0]["id"]
            response = requests.get(
                f"{BASE_URL}/api/dashboard/stats?company_id={company_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert response.status_code == 200
            print(f"✓ Dashboard stats with company filter works")
        else:
            print("✓ No companies to test filter (skipped)")


class TestCompanies:
    """Company management tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_companies(self, auth_token):
        """Test GET /api/companies returns list"""
        response = requests.get(
            f"{BASE_URL}/api/companies",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /companies returns {len(data)} companies")


class TestUsers:
    """User management tests (admin only)"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_users(self, auth_token):
        """Test GET /api/users returns user list"""
        response = requests.get(
            f"{BASE_URL}/api/users",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1  # At least admin user
        
        # Check admin user exists
        admin_user = next((u for u in data if u["email"] == ADMIN_EMAIL), None)
        assert admin_user is not None
        assert admin_user["role"] == "admin"
        print(f"✓ GET /users returns {len(data)} users")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
