#!/usr/bin/env python3
"""
سكريبت لإنشاء جميع حسابات الموظفين دفعة واحدة
"""

import requests
import json
import time

# إعدادات Supabase
SUPABASE_URL = "https://ceaxeyymzvyxdawzvvkk.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlYXhleXltenZ5eGRhd3p2dmtrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxODI4NiwiZXhwIjoyMDc4Nzk0Mjg2fQ.h_erw_C05dN12wjdK3q2epajeui3e-wqUIZzIatX-hE"

# قائمة الموظفين
EMPLOYEES = [
    {
        "email": "amira.elshafei@modeer.com",
        "password": "Amira@2025",
        "full_name": "أميرة الشافعي",
        "phone": "01234567890",
        "employee_type": "مدير عام",
        "base_salary": 15000.00
    },
    {
        "email": "osama.mikhail@modeer.com",
        "password": "Osama@2025",
        "full_name": "أسامة ميخائيل",
        "phone": "01234567891",
        "employee_type": "مدير قسم فني",
        "base_salary": 12000.00
    },
    {
        "email": "mohamed.eldesoky@modeer.com",
        "password": "Mohamed@2025",
        "full_name": "محمد الدسوقي",
        "phone": "01234567892",
        "employee_type": "مدير قسم فني",
        "base_salary": 12000.00
    },
    {
        "email": "somaya@modeer.com",
        "password": "Somaya@2025",
        "full_name": "سمية",
        "phone": "01234567893",
        "employee_type": "موظف مراقبة الجودة",
        "base_salary": 8000.00
    },
    {
        "email": "fady@modeer.com",
        "password": "Fady@2025",
        "full_name": "فادي",
        "phone": "01234567894",
        "employee_type": "موظف كول سنتر",
        "base_salary": 6000.00
    },
    {
        "email": "osama.cc@modeer.com",
        "password": "OsamaCC@2025",
        "full_name": "أسامة",
        "phone": "01234567895",
        "employee_type": "موظف كول سنتر",
        "base_salary": 6000.00
    },
    {
        "email": "youssef@modeer.com",
        "password": "Youssef@2025",
        "full_name": "يوسف",
        "phone": "01234567896",
        "employee_type": "موظف كول سنتر",
        "base_salary": 6000.00
    },
    {
        "email": "abdelrahman@modeer.com",
        "password": "Abdelrahman@2025",
        "full_name": "عبد الرحمن",
        "phone": "01234567897",
        "employee_type": "مندوب",
        "base_salary": 5000.00
    },
    {
        "email": "adham@modeer.com",
        "password": "Adham@2025",
        "full_name": "أدهم",
        "phone": "01234567898",
        "employee_type": "فني صيانة",
        "base_salary": 7000.00
    },
    {
        "email": "hany@modeer.com",
        "password": "Hany@2025",
        "full_name": "هاني",
        "phone": "01234567899",
        "employee_type": "سائق",
        "base_salary": 5000.00
    }
]

def create_user(email, password):
    """إنشاء مستخدم في Supabase Auth"""
    url = f"{SUPABASE_URL}/auth/v1/admin/users"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "email": email,
        "password": password,
        "email_confirm": True
    }
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code in [200, 201]:
        return response.json()
    else:
        print(f"❌ فشل إنشاء المستخدم {email}: {response.text}")
        return None

def create_employee_record(user_id, employee_data):
    """إنشاء سجل الموظف في قاعدة البيانات"""
    url = f"{SUPABASE_URL}/rest/v1/rpc/create_employee_after_signup"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "p_user_id": user_id,
        "p_employee_type_name": employee_data["employee_type"],
        "p_full_name": employee_data["full_name"],
        "p_phone": employee_data["phone"],
        "p_email": employee_data["email"],
        "p_base_salary": employee_data["base_salary"]
    }
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code in [200, 201]:
        return True
    else:
        print(f"❌ فشل إنشاء سجل الموظف {employee_data['full_name']}: {response.text}")
        return False

def main():
    print("=" * 60)
    print("بدء إنشاء حسابات الموظفين")
    print("=" * 60)
    
    created_count = 0
    failed_count = 0
    results = []
    
    for emp in EMPLOYEES:
        print(f"\n📝 إنشاء حساب: {emp['full_name']} ({emp['email']})")
        
        # إنشاء المستخدم
        user = create_user(emp["email"], emp["password"])
        
        if user:
            user_id = user.get("id")
            print(f"✅ تم إنشاء المستخدم: {user_id}")
            
            # الانتظار قليلاً
            time.sleep(1)
            
            # إنشاء سجل الموظف
            if create_employee_record(user_id, emp):
                print(f"✅ تم إنشاء سجل الموظف بنجاح")
                created_count += 1
                results.append({
                    "name": emp["full_name"],
                    "email": emp["email"],
                    "status": "✅ نجح",
                    "user_id": user_id
                })
            else:
                failed_count += 1
                results.append({
                    "name": emp["full_name"],
                    "email": emp["email"],
                    "status": "❌ فشل إنشاء السجل",
                    "user_id": user_id
                })
        else:
            failed_count += 1
            results.append({
                "name": emp["full_name"],
                "email": emp["email"],
                "status": "❌ فشل إنشاء المستخدم",
                "user_id": None
            })
        
        # الانتظار بين كل موظف
        time.sleep(2)
    
    # طباعة النتائج
    print("\n" + "=" * 60)
    print("ملخص النتائج")
    print("=" * 60)
    print(f"✅ تم إنشاء: {created_count} موظف")
    print(f"❌ فشل: {failed_count} موظف")
    print("\n" + "=" * 60)
    print("تفاصيل النتائج")
    print("=" * 60)
    
    for result in results:
        print(f"\n{result['status']} {result['name']}")
        print(f"   Email: {result['email']}")
        if result['user_id']:
            print(f"   User ID: {result['user_id']}")
    
    # حفظ النتائج في ملف
    with open('/home/ubuntu/modeer/employees_creation_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print("\n" + "=" * 60)
    print("تم حفظ النتائج في: employees_creation_results.json")
    print("=" * 60)

if __name__ == "__main__":
    main()
