import os
import time
import requests
import psycopg2

GOOGLE_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "construction_platform",
    "user": "postgres",
    "password": "psqltk9"
}

GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

def geocode(address):
    r = requests.get(GEOCODE_URL, params={
        "address": address,
        "key": GOOGLE_API_KEY
    })
    data = r.json()
    if data["status"] != "OK":
        return None
    loc = data["results"][0]["geometry"]["location"]
    return loc["lat"], loc["lng"]

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()

cur.execute("""
    SELECT c.id, v.full_address
    FROM construction_project c
    JOIN v_permit_addresses v
        ON c.id = v.source_id
    WHERE c.location IS NULL
    LIMIT 1000;
""")

rows = cur.fetchall()
print(f"Geocoding {len(rows)} rows...")

for project_id, address in rows:
    result = geocode(address)
    if result:
        lat, lng = result
        cur.execute("""
            UPDATE construction_project
            SET location = ST_SetSRID(ST_MakePoint(%s, %s), 4326),
                updated_at = NOW()
            WHERE id = %s;
        """, (lng, lat, project_id))
        time.sleep(0.05)

conn.commit()
cur.close()
conn.close()

print("Done.")
