"""
FinTres Pro - Reminder Settings API Tests
Tests for: Reminder settings CRUD, Scheduler status, Manual reminder send
New feature: APScheduler integration for automatic payment reminders
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@fintrack.com"
ADMIN_PASSWORD = "Admin123!"


@pytest.fixture
def auth_token():
    """Get admin auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["token"]


class TestReminderSettings:
    """Reminder settings endpoint tests - /api/settings/reminders"""
    
    def test_get_reminder_settings_default(self, auth_token):
        """Test GET /api/settings/reminders returns default or saved settings"""
        response = requests.get(
            f"{BASE_URL}/api/settings/reminders",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"GET /settings/reminders failed: {response.text}"
        
        data = response.json()
        # Should have these fields (either default or saved)
        assert "days_before" in data, "days_before field missing"
        assert "send_on_due_date" in data, "send_on_due_date field missing"
        assert "is_scheduler_active" in data, "is_scheduler_active field missing"
        
        # Validate types
        assert isinstance(data["days_before"], int), "days_before should be int"
        assert isinstance(data["send_on_due_date"], bool), "send_on_due_date should be bool"
        assert isinstance(data["is_scheduler_active"], bool), "is_scheduler_active should be bool"
        
        print(f"✓ GET /settings/reminders returns: days_before={data['days_before']}, "
              f"send_on_due_date={data['send_on_due_date']}, is_scheduler_active={data['is_scheduler_active']}")
    
    def test_save_reminder_settings(self, auth_token):
        """Test POST /api/settings/reminders saves settings correctly"""
        settings_data = {
            "days_before": 5,
            "send_on_due_date": True,
            "is_scheduler_active": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/settings/reminders",
            json=settings_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"POST /settings/reminders failed: {response.text}"
        
        data = response.json()
        assert data["days_before"] == settings_data["days_before"], "days_before not saved correctly"
        assert data["send_on_due_date"] == settings_data["send_on_due_date"], "send_on_due_date not saved"
        assert data["is_scheduler_active"] == settings_data["is_scheduler_active"], "is_scheduler_active not saved"
        assert "id" in data, "id field missing in response"
        assert "updated_at" in data, "updated_at field missing in response"
        
        print(f"✓ POST /settings/reminders saves settings correctly")
    
    def test_save_and_verify_persistence(self, auth_token):
        """Test that saved settings persist (Create → GET verification)"""
        # Save new settings
        settings_data = {
            "days_before": 10,
            "send_on_due_date": False,
            "is_scheduler_active": True
        }
        
        save_response = requests.post(
            f"{BASE_URL}/api/settings/reminders",
            json=settings_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert save_response.status_code == 200
        
        # GET to verify persistence
        get_response = requests.get(
            f"{BASE_URL}/api/settings/reminders",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert get_response.status_code == 200
        
        data = get_response.json()
        assert data["days_before"] == settings_data["days_before"], "days_before not persisted"
        assert data["send_on_due_date"] == settings_data["send_on_due_date"], "send_on_due_date not persisted"
        assert data["is_scheduler_active"] == settings_data["is_scheduler_active"], "is_scheduler_active not persisted"
        
        print("✓ Reminder settings persist correctly after save")
    
    def test_scheduler_deactivation(self, auth_token):
        """Test that setting is_scheduler_active=false removes the job"""
        # Deactivate scheduler
        settings_data = {
            "days_before": 7,
            "send_on_due_date": True,
            "is_scheduler_active": False
        }
        
        response = requests.post(
            f"{BASE_URL}/api/settings/reminders",
            json=settings_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        # Check scheduler status
        status_response = requests.get(
            f"{BASE_URL}/api/settings/scheduler-status",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert status_response.status_code == 200
        
        status = status_response.json()
        assert status["has_job"] == False, "Job should be removed when scheduler is deactivated"
        
        print("✓ Scheduler deactivation removes the job correctly")
    
    def test_scheduler_reactivation(self, auth_token):
        """Test that setting is_scheduler_active=true adds the job back"""
        # Reactivate scheduler
        settings_data = {
            "days_before": 7,
            "send_on_due_date": True,
            "is_scheduler_active": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/settings/reminders",
            json=settings_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        # Check scheduler status
        status_response = requests.get(
            f"{BASE_URL}/api/settings/scheduler-status",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert status_response.status_code == 200
        
        status = status_response.json()
        assert status["has_job"] == True, "Job should be added when scheduler is activated"
        assert status["is_running"] == True, "Scheduler should be running"
        
        print("✓ Scheduler reactivation adds the job correctly")
    
    def test_reminder_settings_requires_admin(self):
        """Test reminder settings endpoints require admin authentication"""
        # Try without auth
        response = requests.get(f"{BASE_URL}/api/settings/reminders")
        assert response.status_code in [401, 403], "Should require auth"
        
        response = requests.post(f"{BASE_URL}/api/settings/reminders", json={
            "days_before": 7,
            "send_on_due_date": True,
            "is_scheduler_active": True
        })
        assert response.status_code in [401, 403], "Should require auth"
        
        print("✓ Reminder settings endpoints require authentication")


class TestSchedulerStatus:
    """Scheduler status endpoint tests - /api/settings/scheduler-status"""
    
    def test_get_scheduler_status(self, auth_token):
        """Test GET /api/settings/scheduler-status returns status info"""
        response = requests.get(
            f"{BASE_URL}/api/settings/scheduler-status",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"GET /settings/scheduler-status failed: {response.text}"
        
        data = response.json()
        # Should have these fields
        assert "is_running" in data, "is_running field missing"
        assert "has_job" in data, "has_job field missing"
        assert "next_run" in data, "next_run field missing"
        assert "send_time" in data, "send_time field missing"
        
        # Validate types
        assert isinstance(data["is_running"], bool), "is_running should be bool"
        assert isinstance(data["has_job"], bool), "has_job should be bool"
        
        # send_time should indicate Turkish time
        assert "08:00" in data["send_time"], "send_time should be 08:00"
        assert "UTC+3" in data["send_time"] or "Turkiye" in data["send_time"], "send_time should mention Turkish timezone"
        
        print(f"✓ GET /settings/scheduler-status returns: is_running={data['is_running']}, "
              f"has_job={data['has_job']}, next_run={data['next_run']}, send_time={data['send_time']}")
    
    def test_scheduler_status_requires_admin(self):
        """Test scheduler status endpoint requires admin authentication"""
        response = requests.get(f"{BASE_URL}/api/settings/scheduler-status")
        assert response.status_code in [401, 403], "Should require auth"
        print("✓ Scheduler status endpoint requires authentication")


class TestManualReminderSend:
    """Manual reminder send endpoint tests - /api/smtp/send-reminders"""
    
    def test_manual_send_reminders(self, auth_token):
        """Test POST /api/smtp/send-reminders triggers manual reminder send"""
        response = requests.post(
            f"{BASE_URL}/api/smtp/send-reminders",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        # Should return 200 even if no reminders exist
        assert response.status_code == 200, f"POST /smtp/send-reminders failed: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should have message field"
        
        print(f"✓ POST /smtp/send-reminders works: {data['message']}")
    
    def test_manual_send_requires_admin(self):
        """Test manual send endpoint requires admin authentication"""
        response = requests.post(f"{BASE_URL}/api/smtp/send-reminders")
        assert response.status_code in [401, 403], "Should require auth"
        print("✓ Manual send endpoint requires authentication")


class TestReminderSettingsValidation:
    """Validation tests for reminder settings"""
    
    def test_days_before_accepts_valid_values(self, auth_token):
        """Test days_before accepts valid integer values"""
        for days in [1, 7, 14, 30]:
            response = requests.post(
                f"{BASE_URL}/api/settings/reminders",
                json={
                    "days_before": days,
                    "send_on_due_date": True,
                    "is_scheduler_active": True
                },
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert response.status_code == 200, f"Failed for days_before={days}"
        
        print("✓ days_before accepts valid values (1, 7, 14, 30)")
    
    def test_boolean_fields_accept_both_values(self, auth_token):
        """Test boolean fields accept true and false"""
        # Test send_on_due_date = false
        response = requests.post(
            f"{BASE_URL}/api/settings/reminders",
            json={
                "days_before": 7,
                "send_on_due_date": False,
                "is_scheduler_active": True
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        assert response.json()["send_on_due_date"] == False
        
        # Test send_on_due_date = true
        response = requests.post(
            f"{BASE_URL}/api/settings/reminders",
            json={
                "days_before": 7,
                "send_on_due_date": True,
                "is_scheduler_active": True
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        assert response.json()["send_on_due_date"] == True
        
        print("✓ Boolean fields accept both true and false values")


# Cleanup: Reset to default settings after tests
@pytest.fixture(scope="module", autouse=True)
def cleanup_after_tests():
    """Reset reminder settings to default after all tests"""
    yield
    # After all tests, reset to default
    login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if login_response.status_code == 200:
        token = login_response.json()["token"]
        requests.post(
            f"{BASE_URL}/api/settings/reminders",
            json={
                "days_before": 7,
                "send_on_due_date": True,
                "is_scheduler_active": True
            },
            headers={"Authorization": f"Bearer {token}"}
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
