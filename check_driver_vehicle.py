#!/usr/bin/env python3
import os
import requests
import json

SUPABASE_URL = "https://ceaxeyymzvyxdawzvvkk.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlYXhleXltenZ5eGRhd3p2dmtrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxODI4NiwiZXhwIjoyMDc4Nzk0Mjg2fQ.h_erw_C05dN12wjdK3q2epajeui3e-wqUIZzIatX-hE"

headers = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json"
}

# 1. Get driver (Hany) employee ID
print("1. البحث عن السائق هاني...")
response = requests.get(
    f"{SUPABASE_URL}/rest/v1/employees?select=*&full_name=eq.هاني",
    headers=headers
)

if response.status_code == 200 and response.json():
    driver = response.json()[0]
    print(f"✅ وجدت السائق: {driver['full_name']} (ID: {driver['id']})")
    driver_id = driver['id']
else:
    print("❌ لم أجد السائق هاني")
    exit(1)

# 2. Check if driver has a vehicle
print("\n2. التحقق من وجود سيارة للسائق...")
response = requests.get(
    f"{SUPABASE_URL}/rest/v1/vehicles?select=*&current_driver_id=eq.{driver_id}",
    headers=headers
)

if response.status_code == 200 and response.json():
    vehicle = response.json()[0]
    print(f"✅ السائق لديه سيارة: {vehicle['vehicle_number']}")
    print(f"   - الموديل: {vehicle['model']}")
    print(f"   - السنة: {vehicle['year']}")
    print(f"   - ID: {vehicle['id']}")
else:
    print("❌ السائق ليس لديه سيارة")
    print("\n3. إنشاء سيارة تجريبية...")
    
    # Create a test vehicle
    vehicle_data = {
        "vehicle_number": "أ ب ج 1234",
        "chassis_number": "TEST123456789",
        "driver_id": driver_id,
        "status": "active",
        "license_renewal_date": "2025-12-31"
    }
    
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/vehicles",
        headers=headers,
        json=vehicle_data
    )
    
    if response.status_code == 201:
        print("✅ تم إنشاء سيارة تجريبية بنجاح!")
        print(f"   رقم السيارة: {vehicle_data['vehicle_number']}")
    else:
        print(f"❌ فشل إنشاء السيارة: {response.text}")

print("\n" + "="*50)
print("✅ الفحص اكتمل!")
print("="*50)
