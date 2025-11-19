import requests
import os

SUPABASE_URL = "https://ceaxeyymzvyxdawzvvkk.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlYXhleXltenZ5eGRhd3p2dmtrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxODI4NiwiZXhwIjoyMDc4Nzk0Mjg2fQ.h_erw_C05dN12wjdK3q2epajeui3e-wqUIZzIatX-hE"

headers = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json"
}

print("=" * 50)
print("إنشاء حساب موظفة الريسبشن: نرمين الأشقر")
print("=" * 50)

# 1. Create user in auth
print("\n1. إنشاء حساب المستخدم...")
user_data = {
    "email": "nermin.elashkar@modeer.com",
    "password": "Nermin@2025",
    "email_confirm": True
}

response = requests.post(
    f"{SUPABASE_URL}/auth/v1/admin/users",
    headers=headers,
    json=user_data
)

if response.status_code in [200, 201]:
    user = response.json()
    user_id = user['id']
    print(f"✅ تم إنشاء المستخدم بنجاح! User ID: {user_id}")
else:
    print(f"❌ فشل إنشاء المستخدم: {response.text}")
    exit(1)

# 2. Get reception employee type ID
print("\n2. الحصول على ID نوع موظف الريسبشن...")
response = requests.get(
    f"{SUPABASE_URL}/rest/v1/employee_types?name=eq.موظف ريسبشن&select=id",
    headers=headers
)

if response.status_code == 200 and response.json():
    employee_type_id = response.json()[0]['id']
    print(f"✅ تم الحصول على ID: {employee_type_id}")
else:
    print(f"❌ فشل الحصول على نوع الموظف: {response.text}")
    exit(1)

# 3. Get next employee code
print("\n3. توليد كود الموظف...")
response = requests.get(
    f"{SUPABASE_URL}/rest/v1/employees?employee_type_id=eq.{employee_type_id}&select=employee_code&order=employee_code.desc&limit=1",
    headers=headers
)

if response.status_code == 200:
    existing = response.json()
    if existing:
        last_code = existing[0]['employee_code']
        # Extract number and increment
        code_num = int(last_code) + 1
        employee_code = str(code_num)
    else:
        employee_code = "2010001"  # First reception employee
    print(f"✅ كود الموظف: {employee_code}")
else:
    print(f"❌ فشل توليد الكود: {response.text}")
    exit(1)

# 4. Create employee record
print("\n4. إنشاء سجل الموظف...")
employee_data = {
    "user_id": user_id,
    "employee_code": employee_code,
    "full_name": "نرمين الأشقر",
    "phone": "01234567890",
    "email": "nermin.elashkar@modeer.com",
    "employee_type_id": employee_type_id,
    "base_salary": 6000.00
}

response = requests.post(
    f"{SUPABASE_URL}/rest/v1/employees",
    headers=headers,
    json=employee_data
)

if response.status_code == 201:
    employee = response.json()[0]
    print(f"✅ تم إنشاء سجل الموظف بنجاح!")
    print(f"   ID: {employee['id']}")
    print(f"   الكود: {employee['employee_code']}")
else:
    print(f"❌ فشل إنشاء سجل الموظف: {response.text}")
    exit(1)

# 5. Assign role
print("\n5. تعيين الدور...")
response = requests.get(
    f"{SUPABASE_URL}/rest/v1/roles?role_name=eq.موظف ريسبشن&select=role_name",
    headers=headers
)

if response.status_code == 200 and response.json():
    role_name = response.json()[0]['role_name']
    
    role_data = {
        "user_id": user_id,
        "role": role_name
    }
    
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/user_roles",
        headers=headers,
        json=role_data
    )
    
    if response.status_code == 201:
        print(f"✅ تم تعيين الدور بنجاح!")
    else:
        print(f"⚠️ تحذير: فشل تعيين الدور: {response.text}")
else:
    print(f"⚠️ تحذير: لم يتم العثور على دور الريسبشن")

print("\n" + "=" * 50)
print("✅ تم إنشاء الحساب بنجاح!")
print("=" * 50)
print("\nمعلومات الحساب:")
print(f"الاسم: نرمين الأشقر")
print(f"الكود: {employee_code}")
print(f"البريد: nermin.elashkar@modeer.com")
print(f"كلمة المرور: Nermin@2025")
print(f"الرابط: https://modeer.vercel.app/employee/reception/coupons")
print("=" * 50)
