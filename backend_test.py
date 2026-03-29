import requests
import sys
from datetime import datetime
import json

class LuaYouAPITester:
    def __init__(self, base_url="https://code-streak-7.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 200:
                        print(f"   Response: {response_data}")
                    elif isinstance(response_data, list) and len(response_data) <= 3:
                        print(f"   Response: {response_data}")
                    else:
                        print(f"   Response: {type(response_data)} with {len(response_data) if hasattr(response_data, '__len__') else 'N/A'} items")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })

            return success, response.json() if response.status_code < 400 else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_data = {
            "username": f"testuser{timestamp}",
            "email": f"test{timestamp}@luayou.com",
            "password": "test1234"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@luayou.com", "password": "admin123"}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Admin token obtained: {self.token[:20]}...")
            return True
        return False

    def test_auth_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_lessons_list(self):
        """Test get lessons list"""
        success, response = self.run_test(
            "Get Lessons List",
            "GET",
            "lessons",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} lessons")
            if len(response) >= 15:
                print("   ✅ All 15 lessons present")
            else:
                print(f"   ⚠️  Only {len(response)} lessons found, expected 15")
        
        return success

    def test_lesson_detail(self):
        """Test get lesson detail"""
        success, response = self.run_test(
            "Get Lesson Detail",
            "GET",
            "lessons/lesson-01",
            200
        )
        
        if success:
            required_fields = ['id', 'title', 'content', 'difficulty', 'challenge_description']
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                print(f"   ⚠️  Missing fields: {missing_fields}")
            else:
                print("   ✅ All required fields present")
        
        return success

    def test_lesson_complete(self):
        """Test complete lesson"""
        success, response = self.run_test(
            "Complete Lesson",
            "POST",
            "lessons/lesson-01/complete",
            200
        )
        
        if success and 'xp_earned' in response:
            print(f"   XP earned: {response['xp_earned']}")
        
        return success

    def test_quiz_get(self):
        """Test get quiz"""
        success, response = self.run_test(
            "Get Quiz",
            "GET",
            "quiz/lesson-01",
            200
        )
        
        if success and 'questions' in response:
            print(f"   Quiz has {len(response['questions'])} questions")
        
        return success

    def test_quiz_submit(self):
        """Test submit quiz"""
        # First get the quiz to know how many questions
        quiz_success, quiz_response = self.run_test(
            "Get Quiz for Submit Test",
            "GET",
            "quiz/lesson-01",
            200
        )
        
        if not quiz_success:
            return False
        
        # Submit answers (all option 0 for simplicity)
        num_questions = len(quiz_response.get('questions', []))
        answers = [0] * num_questions
        
        success, response = self.run_test(
            "Submit Quiz",
            "POST",
            "quiz/submit",
            200,
            data={
                "quiz_id": quiz_response['id'],
                "lesson_id": quiz_response['lesson_id'],
                "answers": answers
            }
        )
        
        if success and 'score' in response:
            print(f"   Score: {response['score']}/{response.get('total', 0)}")
        
        return success

    def test_code_run(self):
        """Test code execution"""
        success, response = self.run_test(
            "Run Code",
            "POST",
            "code/run",
            200,
            data={
                "code": "print('Hello, LuaYou!')",
                "lesson_id": "lesson-01"
            }
        )
        
        if success and 'output' in response:
            print(f"   Code output: {response['output']}")
        
        return success

    def test_daily_get(self):
        """Test get daily challenge"""
        success, response = self.run_test(
            "Get Daily Challenge",
            "GET",
            "daily",
            200
        )
        
        if success and 'title' in response:
            print(f"   Daily challenge: {response['title']}")
        
        return success

    def test_daily_complete(self):
        """Test complete daily challenge"""
        success, response = self.run_test(
            "Complete Daily Challenge",
            "POST",
            "daily/complete",
            200
        )
        
        if success and 'xp_earned' in response:
            print(f"   XP earned: {response['xp_earned']}")
        
        return success

    def test_leaderboard(self):
        """Test get leaderboard"""
        success, response = self.run_test(
            "Get Leaderboard",
            "GET",
            "leaderboard",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Leaderboard has {len(response)} users")
        
        return success

    def test_user_stats(self):
        """Test get user stats"""
        success, response = self.run_test(
            "Get User Stats",
            "GET",
            "user/stats",
            200
        )
        
        if success and 'xp' in response:
            print(f"   User XP: {response['xp']}")
        
        return success

    def test_user_profile(self):
        """Test get user profile"""
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            "user/profile",
            200
        )
        return success

    def test_ai_tutor(self):
        """Test AI tutor"""
        success, response = self.run_test(
            "AI Tutor",
            "POST",
            "ai/tutor",
            200,
            data={
                "code": "print('test')",
                "error": "",
                "lesson_id": "lesson-01",
                "question": "How does this code work?"
            }
        )
        
        if success and 'response' in response:
            print(f"   AI response length: {len(response['response'])} chars")
        
        return success

def main():
    print("🚀 Starting LuaYou API Tests")
    print("=" * 50)
    
    tester = LuaYouAPITester()
    
    # Test sequence
    tests = [
        ("Register New User", tester.test_register),
        ("Get Current User", tester.test_auth_me),
        ("Get Lessons List", tester.test_lessons_list),
        ("Get Lesson Detail", tester.test_lesson_detail),
        ("Complete Lesson", tester.test_lesson_complete),
        ("Get Quiz", tester.test_quiz_get),
        ("Submit Quiz", tester.test_quiz_submit),
        ("Run Code", tester.test_code_run),
        ("Get Daily Challenge", tester.test_daily_get),
        ("Complete Daily Challenge", tester.test_daily_complete),
        ("Get Leaderboard", tester.test_leaderboard),
        ("Get User Stats", tester.test_user_stats),
        ("Get User Profile", tester.test_user_profile),
        ("AI Tutor", tester.test_ai_tutor),
    ]
    
    # Also test admin login
    print("\n" + "=" * 50)
    print("🔐 Testing Admin Login")
    admin_login_success = tester.test_login()
    if admin_login_success:
        print("✅ Admin login successful")
    else:
        print("❌ Admin login failed")
    
    # Run all tests
    print("\n" + "=" * 50)
    print("🧪 Running All API Tests")
    
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} crashed: {str(e)}")
            tester.failed_tests.append({
                "test": test_name,
                "error": f"Test crashed: {str(e)}"
            })
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Tests failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%" if tester.tests_run > 0 else "0%")
    
    if tester.failed_tests:
        print("\n❌ FAILED TESTS:")
        for i, failure in enumerate(tester.failed_tests, 1):
            print(f"{i}. {failure['test']}")
            if 'expected' in failure:
                print(f"   Expected: {failure['expected']}, Got: {failure['actual']}")
                print(f"   Response: {failure['response']}")
            elif 'error' in failure:
                print(f"   Error: {failure['error']}")
    else:
        print("\n🎉 ALL TESTS PASSED!")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())