import requests
import sys
import json
from datetime import datetime

class FinTrackAPITester:
    def __init__(self, base_url="https://accounting-desk-2.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_company_id = None
        self.test_income_id = None
        self.test_expense_id = None
        self.test_personnel_id = None
        self.test_reminder_id = None

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")

    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request with authentication"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {}, f"Unsupported method: {method}"

            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {}

            return response.status_code, response_data, ""
        except Exception as e:
            return 0, {}, str(e)

    def test_register_and_login(self):
        """Test user registration and login"""
        print("\n🔐 Testing Authentication...")
        
        # Test registration
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        test_email = f"testuser_{timestamp}@example.com"
        test_password = "TestPassword123!"
        test_name = f"Test User {timestamp}"
        
        register_data = {
            "email": test_email,
            "password": test_password,
            "name": test_name,
            "role": "admin"  # Register as admin to test all features
        }
        
        status, response, error = self.make_request('POST', 'auth/register', register_data)
        
        if status == 200 and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            self.log_test("User Registration", True, f"User ID: {self.user_id}")
        else:
            self.log_test("User Registration", False, f"Status: {status}, Error: {error}")
            return False

        # Test login with same credentials
        login_data = {
            "email": test_email,
            "password": test_password
        }
        
        status, response, error = self.make_request('POST', 'auth/login', login_data)
        
        if status == 200 and 'token' in response:
            self.token = response['token']  # Update token
            self.log_test("User Login", True)
        else:
            self.log_test("User Login", False, f"Status: {status}, Error: {error}")
            return False

        # Test get current user
        status, response, error = self.make_request('GET', 'auth/me')
        
        if status == 200 and response.get('email') == test_email:
            self.log_test("Get Current User", True)
        else:
            self.log_test("Get Current User", False, f"Status: {status}, Error: {error}")
            
        return True

    def test_company_crud(self):
        """Test company CRUD operations"""
        print("\n🏢 Testing Company Management...")
        
        # Create company
        company_data = {
            "name": "Test Company Ltd",
            "tax_number": "1234567890",
            "address": "Test Address 123",
            "phone": "+90 555 123 4567",
            "email": "test@testcompany.com"
        }
        
        status, response, error = self.make_request('POST', 'companies', company_data)
        
        if status == 200 and 'id' in response:
            self.test_company_id = response['id']
            self.log_test("Create Company", True, f"Company ID: {self.test_company_id}")
        else:
            self.log_test("Create Company", False, f"Status: {status}, Error: {error}")
            return False

        # Get companies
        status, response, error = self.make_request('GET', 'companies')
        
        if status == 200 and isinstance(response, list):
            company_found = any(c['id'] == self.test_company_id for c in response)
            self.log_test("List Companies", company_found, f"Found {len(response)} companies")
        else:
            self.log_test("List Companies", False, f"Status: {status}, Error: {error}")

        # Get single company
        status, response, error = self.make_request('GET', f'companies/{self.test_company_id}')
        
        if status == 200 and response.get('id') == self.test_company_id:
            self.log_test("Get Single Company", True)
        else:
            self.log_test("Get Single Company", False, f"Status: {status}, Error: {error}")

        # Update company
        update_data = {**company_data, "name": "Updated Test Company Ltd"}
        status, response, error = self.make_request('PUT', f'companies/{self.test_company_id}', update_data)
        
        if status == 200 and response.get('name') == "Updated Test Company Ltd":
            self.log_test("Update Company", True)
        else:
            self.log_test("Update Company", False, f"Status: {status}, Error: {error}")
            
        return True

    def test_income_crud(self):
        """Test income CRUD operations"""
        print("\n💰 Testing Income Management...")
        
        if not self.test_company_id:
            self.log_test("Income CRUD - No Company", False, "Need company for income testing")
            return False
            
        # Create income
        income_data = {
            "company_id": self.test_company_id,
            "description": "Test Income Entry",
            "amount": 5000.00,
            "currency": "TRY",
            "category": "sales",
            "date": "2024-01-15",
            "notes": "Test notes for income"
        }
        
        status, response, error = self.make_request('POST', 'incomes', income_data)
        
        if status == 200 and 'id' in response:
            self.test_income_id = response['id']
            self.log_test("Create Income", True, f"Income ID: {self.test_income_id}")
        else:
            self.log_test("Create Income", False, f"Status: {status}, Error: {error}")
            return False

        # Get incomes
        status, response, error = self.make_request('GET', 'incomes')
        
        if status == 200 and isinstance(response, list):
            income_found = any(i['id'] == self.test_income_id for i in response)
            self.log_test("List Incomes", income_found, f"Found {len(response)} incomes")
        else:
            self.log_test("List Incomes", False, f"Status: {status}, Error: {error}")

        # Update income
        update_data = {**income_data, "amount": 6000.00}
        status, response, error = self.make_request('PUT', f'incomes/{self.test_income_id}', update_data)
        
        if status == 200 and response.get('amount') == 6000.00:
            self.log_test("Update Income", True)
        else:
            self.log_test("Update Income", False, f"Status: {status}, Error: {error}")
            
        return True

    def test_expense_crud(self):
        """Test expense CRUD operations"""
        print("\n💸 Testing Expense Management...")
        
        if not self.test_company_id:
            self.log_test("Expense CRUD - No Company", False, "Need company for expense testing")
            return False
            
        # Create expense
        expense_data = {
            "company_id": self.test_company_id,
            "description": "Test Expense Entry",
            "amount": 2000.00,
            "currency": "TRY",
            "category": "office",
            "payment_type": "cash",
            "date": "2024-01-15",
            "notes": "Test notes for expense"
        }
        
        status, response, error = self.make_request('POST', 'expenses', expense_data)
        
        if status == 200 and 'id' in response:
            self.test_expense_id = response['id']
            self.log_test("Create Expense", True, f"Expense ID: {self.test_expense_id}")
        else:
            self.log_test("Create Expense", False, f"Status: {status}, Error: {error}")
            return False

        # Get expenses
        status, response, error = self.make_request('GET', 'expenses')
        
        if status == 200 and isinstance(response, list):
            expense_found = any(e['id'] == self.test_expense_id for e in response)
            self.log_test("List Expenses", expense_found, f"Found {len(response)} expenses")
        else:
            self.log_test("List Expenses", False, f"Status: {status}, Error: {error}")

        # Update expense
        update_data = {**expense_data, "amount": 2500.00}
        status, response, error = self.make_request('PUT', f'expenses/{self.test_expense_id}', update_data)
        
        if status == 200 and response.get('amount') == 2500.00:
            self.log_test("Update Expense", True)
        else:
            self.log_test("Update Expense", False, f"Status: {status}, Error: {error}")
            
        return True

    def test_personnel_and_salary(self):
        """Test personnel and salary operations"""
        print("\n👥 Testing Personnel & Salary Management...")
        
        if not self.test_company_id:
            self.log_test("Personnel CRUD - No Company", False, "Need company for personnel testing")
            return False
            
        # Create personnel
        personnel_data = {
            "company_id": self.test_company_id,
            "name": "John Doe",
            "position": "Software Developer",
            "email": "john@testcompany.com",
            "phone": "+90 555 987 6543",
            "salary": 15000.00,
            "currency": "TRY",
            "start_date": "2024-01-01"
        }
        
        status, response, error = self.make_request('POST', 'personnel', personnel_data)
        
        if status == 200 and 'id' in response:
            self.test_personnel_id = response['id']
            self.log_test("Create Personnel", True, f"Personnel ID: {self.test_personnel_id}")
        else:
            self.log_test("Create Personnel", False, f"Status: {status}, Error: {error}")
            return False

        # Get personnel
        status, response, error = self.make_request('GET', 'personnel')
        
        if status == 200 and isinstance(response, list):
            personnel_found = any(p['id'] == self.test_personnel_id for p in response)
            self.log_test("List Personnel", personnel_found, f"Found {len(response)} personnel")
        else:
            self.log_test("List Personnel", False, f"Status: {status}, Error: {error}")

        # Create salary payment
        salary_data = {
            "personnel_id": self.test_personnel_id,
            "company_id": self.test_company_id,
            "amount": 15000.00,
            "currency": "TRY",
            "period": "2024-01",
            "payment_date": "2024-01-31",
            "notes": "January 2024 salary"
        }
        
        status, response, error = self.make_request('POST', 'salaries', salary_data)
        
        if status == 200 and 'id' in response:
            self.log_test("Create Salary Payment", True)
        else:
            self.log_test("Create Salary Payment", False, f"Status: {status}, Error: {error}")

        # Get salaries
        status, response, error = self.make_request('GET', 'salaries')
        
        if status == 200 and isinstance(response, list):
            self.log_test("List Salaries", True, f"Found {len(response)} salary payments")
        else:
            self.log_test("List Salaries", False, f"Status: {status}, Error: {error}")
            
        return True

    def test_reminders(self):
        """Test reminder operations"""
        print("\n🔔 Testing Reminder Management...")
        
        if not self.test_company_id:
            self.log_test("Reminder CRUD - No Company", False, "Need company for reminder testing")
            return False
            
        # Create reminder
        reminder_data = {
            "company_id": self.test_company_id,
            "title": "Monthly Rent Payment",
            "description": "Office rent payment reminder",
            "amount": 8000.00,
            "currency": "TRY",
            "due_date": "2024-02-01",
            "category": "rent",
            "is_recurring": True,
            "recurring_period": "monthly"
        }
        
        status, response, error = self.make_request('POST', 'reminders', reminder_data)
        
        if status == 200 and 'id' in response:
            self.test_reminder_id = response['id']
            self.log_test("Create Reminder", True, f"Reminder ID: {self.test_reminder_id}")
        else:
            self.log_test("Create Reminder", False, f"Status: {status}, Error: {error}")
            return False

        # Get reminders
        status, response, error = self.make_request('GET', 'reminders')
        
        if status == 200 and isinstance(response, list):
            reminder_found = any(r['id'] == self.test_reminder_id for r in response)
            self.log_test("List Reminders", reminder_found, f"Found {len(response)} reminders")
        else:
            self.log_test("List Reminders", False, f"Status: {status}, Error: {error}")

        # Mark reminder as paid
        status, response, error = self.make_request('PUT', f'reminders/{self.test_reminder_id}/pay')
        
        if status == 200:
            self.log_test("Mark Reminder Paid", True)
        else:
            self.log_test("Mark Reminder Paid", False, f"Status: {status}, Error: {error}")
            
        return True

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        print("\n📊 Testing Dashboard Stats...")
        
        # Get dashboard stats
        status, response, error = self.make_request('GET', 'dashboard/stats')
        
        if status == 200 and 'total_income' in response:
            self.log_test("Dashboard Stats", True, f"Income: {response.get('total_income', 0)}, Expense: {response.get('total_expense', 0)}")
        else:
            self.log_test("Dashboard Stats", False, f"Status: {status}, Error: {error}")

        # Get stats with company filter
        if self.test_company_id:
            params = {"company_id": self.test_company_id}
            status, response, error = self.make_request('GET', 'dashboard/stats', params=params)
            
            if status == 200:
                self.log_test("Dashboard Stats (Company Filter)", True)
            else:
                self.log_test("Dashboard Stats (Company Filter)", False, f"Status: {status}, Error: {error}")
                
        return True

    def test_admin_features(self):
        """Test admin-only features"""
        print("\n👑 Testing Admin Features...")
        
        # Get users (admin only)
        status, response, error = self.make_request('GET', 'users')
        
        if status == 200 and isinstance(response, list):
            self.log_test("List Users (Admin)", True, f"Found {len(response)} users")
        else:
            self.log_test("List Users (Admin)", False, f"Status: {status}, Error: {error}")
            
        return True

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete test data (optional - comment out if you want to keep test data)
        if self.test_reminder_id:
            status, _, _ = self.make_request('DELETE', f'reminders/{self.test_reminder_id}')
            self.log_test("Delete Test Reminder", status == 200)
            
        if self.test_expense_id:
            status, _, _ = self.make_request('DELETE', f'expenses/{self.test_expense_id}')
            self.log_test("Delete Test Expense", status == 200)
            
        if self.test_income_id:
            status, _, _ = self.make_request('DELETE', f'incomes/{self.test_income_id}')
            self.log_test("Delete Test Income", status == 200)
            
        if self.test_personnel_id:
            status, _, _ = self.make_request('DELETE', f'personnel/{self.test_personnel_id}')
            self.log_test("Delete Test Personnel", status == 200)
            
        if self.test_company_id:
            status, _, _ = self.make_request('DELETE', f'companies/{self.test_company_id}')
            self.log_test("Delete Test Company", status == 200)

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting FinTrack API Testing...")
        print(f"Testing backend: {self.base_url}")
        
        # Run tests in order
        if not self.test_register_and_login():
            print("❌ Authentication failed - stopping tests")
            return False
            
        self.test_company_crud()
        self.test_income_crud()
        self.test_expense_crud()
        self.test_personnel_and_salary()
        self.test_reminders()
        self.test_dashboard_stats()
        self.test_admin_features()
        
        # Optional cleanup
        self.cleanup_test_data()
        
        # Print summary
        print(f"\n📋 Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test function"""
    tester = FinTrackAPITester()
    success = tester.run_all_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())