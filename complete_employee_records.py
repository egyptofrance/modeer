#!/usr/bin/env python3
"""
إكمال إنشاء سجلات الموظفين (المستخدمون موجودون بالفعل)
"""

import requests
import json

# إعدادات Supabase
SUPABASE_URL = "https://ceaxeyymzvyxdawzvvkk.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlYXhleXltenZ5eGRhd3p2dmtrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxODI4NiwiZXhwIjoyMDc4Nzk0Mjg2fQ.h_erw_C05dN12wjdK3q2epajeui3e-wqUIZzIatX-hE"

# قراءة نتائج إنشاء المستخدمين
with open('/home/ubuntu/modeer/employees_creation_results.json', 'r', encoding='utf-8') as f:
    users = json.load(f)

# معلومات الموظفين الكاملة
EMPLOYEES_DATA = {
    "amira.elshafei@modeer.com": {
        "full_name": "أميرة الشافعي",
        "phone": "01234567890",
        "employee_type": "مدير عام",
        "base_salary": 15000.00
    },
    "osama.mikhail@modeer.com": {
        "full_name": "أسامة ميخائيل",
        "phone": "01234567891",
        "employee_type": "مدير قسم فني",
        "base_salary": 12000.00
    },
    "mohamed.eldesoky@modeer.com": {
        "full_name": "محمد الدسوقي",
        "phone": "01234567892",
        "employee_type": "مدير قسم فني",
        "base_salary": 12000.00
    },
    "somaya@modeer.com": {
        "full_name": "سمية",
        "phone": "01234567893",
        "employee_type": "موظف مراقبة الجودة",
        "base_salary": 8000.00
    },
    "fady@modeer.com": {
        "full_name": "فادي",
        "phone": "01234567894",
        "employee_type": "موظف كول سنتر",
        "base_salary": 6000.00
    },
    "osama.cc@modeer.com": {
        "full_name": "أسامة",
        "phone": "01234567895",
        "employee_type": "موظف كول سنتر",
        "base_salary": 6000.00
    },
    "youssef@modeer.com": {
        "full_name": "يوسف",
        "phone": "01234567896",
        "employee_type": "موظف كول سنتر",
        "base_salary": 6000.00
    },
    "abdelrahman@modeer.com": {
        "full_name": "عبد الرحمن",
        "phone": "01234567897",
        "employee_type": "مندوب",
        "base_salary": 5000.00
    },
    "adham@modeer.com": {
        "full_name": "أدهم",
        "phone": "01234567898",
        "employee_type": "فني صيانة",
        "base_salary": 7000.00
    },
    "hany@modeer.com": {
        "full_name": "هاني",
        "phone": "01234567899",
        "employee_type": "سائق",
        "base_salary": 5000.00
    }
}

def get_employee_type_id(employee_type_name):
    """الحصول على ID نوع الموظف"""
    url = f"{SUPABASE_URL}/rest/v1/employee_types"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    }
    params = {
        "name": f"eq.{employee_type_name}",
        "select": "id"
    }
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        data = response.json()
        if data:
            return data[0]["id"]
    return None

def generate_employee_code(employee_type_id):
    """توليد كود الموظف"""
    # الحصول على prefix
    url = f"{SUPABASE_URL}/rest/v1/employee_types"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    }
    params = {
        "id": f"eq.{employee_type_id}",
        "select": "code_prefix"
    }
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        data = response.json()
        if data:
            prefix = data[0]["code_prefix"]
            
            # الحصول على آخر رقم
            url2 = f"{SUPABASE_URL}/rest/v1/employees"
            params2 = {
                "employee_code": f"like.{prefix}*",
                "select": "employee_code",
                "order": "employee_code.desc",
                "limit": "1"
            }
            
            response2 = requests.get(url2, headers=headers, params=params2)
            
            if response2.status_code == 200:
                data2 = response2.json()
                if data2:
                    last_code = data2[0]["employee_code"]
                    last_number = int(last_code.replace(prefix, ""))
                    next_number = last_number + 1
                else:
                    next_number = 1
                
                return f"{prefix}{str(next_number).zfill(4)}"
    
    return None

def create_employee_record(user_id, email):
    """إنشاء سجل الموظف"""
    emp_data = EMPLOYEES_DATA.get(email)
    if not emp_data:
        return False
    
    # الحصول على employee_type_id
    employee_type_id = get_employee_type_id(emp_data["employee_type"])
    if not employee_type_id:
        print(f"❌ لم يتم العثور على نوع الموظف: {emp_data['employee_type']}")
        return False
    
    # توليد employee_code
    employee_code = generate_employee_code(employee_type_id)
    if not employee_code:
        print(f"❌ فشل توليد كود الموظف")
        return False
    
    # إنشاء السجل
    url = f"{SUPABASE_URL}/rest/v1/employees"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    data = {
        "user_id": user_id,
        "employee_type_id": employee_type_id,
        "employee_code": employee_code,
        "full_name": emp_data["full_name"],
        "phone": emp_data["phone"],
        "email": email,
        "base_salary": emp_data["base_salary"],
        "is_active": True
    }
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code in [200, 201]:
        return response.json()[0]["id"]
    else:
        print(f"❌ فشل إنشاء سجل الموظف: {response.text}")
        return None

def assign_role(user_id, email):
    """تعيين الدور للمستخدم"""
    emp_data = EMPLOYEES_DATA.get(email)
    if not emp_data:
        return False
    
    # الحصول على اسم الدور من employee_type_roles
    employee_type_id = get_employee_type_id(emp_data["employee_type"])
    
    url = f"{SUPABASE_URL}/rest/v1/employee_type_roles"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    }
    params = {
        "employee_type_id": f"eq.{employee_type_id}",
        "select": "role_name"
    }
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        data = response.json()
        if data:
            role_name = data[0]["role_name"]
            
            # إضافة الدور
            url2 = f"{SUPABASE_URL}/rest/v1/user_roles"
            data2 = {
                "user_id": user_id,
                "role_name": role_name
            }
            
            response2 = requests.post(url2, headers=headers, json=data2)
            
            if response2.status_code in [200, 201]:
                return True
            else:
                print(f"❌ فشل تعيين الدور: {response2.text}")
    
    return False

def main():
    print("=" * 60)
    print("إكمال إنشاء سجلات الموظفين")
    print("=" * 60)
    
    success_count = 0
    failed_count = 0
    results = []
    
    for user in users:
        if user["user_id"]:
            print(f"\n📝 معالجة: {user['name']} ({user['email']})")
            
            # إنشاء سجل الموظف
            employee_id = create_employee_record(user["user_id"], user["email"])
            
            if employee_id:
                print(f"✅ تم إنشاء سجل الموظف: {employee_id}")
                
                # تعيين الدور
                if assign_role(user["user_id"], user["email"]):
                    print(f"✅ تم تعيين الدور")
                    success_count += 1
                    results.append({
                        **user,
                        "employee_id": employee_id,
                        "status": "✅ نجح"
                    })
                else:
                    failed_count += 1
                    results.append({
                        **user,
                        "employee_id": employee_id,
                        "status": "⚠️ تم إنشاء السجل لكن فشل تعيين الدور"
                    })
            else:
                failed_count += 1
                results.append({
                    **user,
                    "status": "❌ فشل إنشاء السجل"
                })
    
    # طباعة النتائج
    print("\n" + "=" * 60)
    print("ملخص النتائج")
    print("=" * 60)
    print(f"✅ نجح: {success_count} موظف")
    print(f"❌ فشل: {failed_count} موظف")
    print("\n" + "=" * 60)
    print("تفاصيل النتائج")
    print("=" * 60)
    
    for result in results:
        print(f"\n{result['status']} {result['name']}")
        print(f"   Email: {result['email']}")
        print(f"   User ID: {result['user_id']}")
        if result.get('employee_id'):
            print(f"   Employee ID: {result['employee_id']}")
    
    # حفظ النتائج
    with open('/home/ubuntu/modeer/final_employees_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print("\n" + "=" * 60)
    print("تم حفظ النتائج في: final_employees_results.json")
    print("=" * 60)

if __name__ == "__main__":
    main()
