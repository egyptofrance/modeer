import requests

SUPABASE_URL = "https://ceaxeyymzvyxdawzvvkk.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlYXhleXltenZ5eGRhd3p2dmtrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxODI4NiwiZXhwIjoyMDc4Nzk0Mjg2fQ.h_erw_C05dN12wjdK3q2epajeui3e-wqUIZzIatX-hE"

headers = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json"
}

print("=" * 50)
print("إكمال حساب نرمين الأشقر")
print("=" * 50)

# 1. Get user ID
print("\n1. الحصول على User ID...")
response = requests.get(
    f"{SUPABASE_URL}/auth/v1/admin/users?email=nermin.elashkar@modeer.com",
    headers=headers
)

if response.status_code == 200:
    users = response.json()
    if users and 'users' in users and len(users['users']) > 0:
        user_id = users['users'][0]['id']
        print(f"✅ User ID: {user_id}")
    else:
        print("❌ المستخدم غير موجود")
        exit(1)
else:
    print(f"❌ فشل: {response.text}")
    exit(1)

# 2. Get reception employee type ID
print("\n2. الحصول على ID نوع موظف الريسبشن...")
response = requests.get(
    f"{SUPABASE_URL}/rest/v1/employee_types?name=eq.موظف ريسبشن&select=id",
    headers=headers
)

if response.status_code == 200 and response.json():
    employee_type_id = response.json()[0]['id']
    print(f"✅ ID: {employee_type_id}")
else:
    print(f"❌ فشل: {response.text}")
    exit(1)

# 3. Create employee record
print("\n3. إنشاء سجل الموظف...")
employee_data = {
    "user_id": user_id,
    "employee_code": "2010001",
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
    try:
        employee = response.json()[0]
        print(f"✅ تم إنشاء سجل الموظف!")
        print(f"   ID: {employee['id']}")
        print(f"   الكود: {employee['employee_code']}")
    except:
        print(f"✅ تم إنشاء سجل الموظف!")
else:
    print(f"❌ فشل: {response.text}")
    # Check if already exists
    if "duplicate" in response.text.lower() or "unique" in response.text.lower():
        print("✅ السجل موجود بالفعل")
    else:
        exit(1)

# 4. Assign role
print("\n4. تعيين الدور...")
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
        print(f"✅ تم تعيين الدور!")
    else:
        print(f"⚠️ تحذير: {response.text}")
else:
    print(f"⚠️ لم يتم العثور على دور الريسبشن")

print("\n" + "=" * 50)
print("✅ تم إكمال الحساب بنجاح!")
print("=" * 50)
print("\nمعلومات الحساب:")
print("الاسم: نرمين الأشقر")
print("الكود: 2010001")
print("البريد: nermin.elashkar@modeer.com")
print("كلمة المرور: Nermin@2025")
print("الرابط: https://modeer.vercel.app/employee/reception/coupons")
print("=" * 50)
