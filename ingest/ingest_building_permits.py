import pandas as pd
import psycopg2
from psycopg2 import extras
import json
from datetime import datetime

# ----------------------------------
# CONFIG
# ----------------------------------
CSV_PATH = "../data/building_permits_active.csv"

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "construction_platform",
    "user": "postgres",
    "password": "psqltk9"
}

SOURCE_SYSTEM = "toronto_open_data"
SOURCE_DATASET = "building_permits_active"

CHUNK_SIZE = 5000      # Safe + fast
BATCH_PAGE_SIZE = 1000

# ----------------------------------
# SQL
# ----------------------------------
INSERT_SQL = """
INSERT INTO source_record (
    source,
    source_dataset,
    source_record_id,
    raw_payload,
    created_at
)
VALUES %s
ON CONFLICT (source, source_dataset, source_record_id) DO NOTHING;
"""

# ----------------------------------
# HELPERS
# ----------------------------------
def clean_row_for_json(row_dict):
    """
    Convert pandas NaN/NaT to None so PostgreSQL JSON accepts it.
    """
    return {
        k: (None if pd.isna(v) else v)
        for k, v in row_dict.items()
    }

# ----------------------------------
# MAIN INGESTION
# ----------------------------------
def ingest():
    print("🚀 Starting ingestion...")
    total_inserted = 0

    with psycopg2.connect(**DB_CONFIG) as conn:
        with conn.cursor() as cur:

            for chunk in pd.read_csv(
                CSV_PATH,
                chunksize=CHUNK_SIZE,
                low_memory=False
            ):
                batch = []

                for _, row in chunk.iterrows():
                    raw_dict = clean_row_for_json(row.to_dict())

                    batch.append((
                        SOURCE_SYSTEM,
                        SOURCE_DATASET,
                        str(raw_dict.get("PERMIT_NUM")),  # stable natural key
                        json.dumps(raw_dict, default=str),
                        datetime.utcnow()
                    ))

                extras.execute_values(
                    cur,
                    INSERT_SQL,
                    batch,
                    page_size=BATCH_PAGE_SIZE
                )

                conn.commit()
                total_inserted += len(batch)

                print(f"Inserted batch — total processed: {total_inserted}")

    print(f"✅ Ingestion complete. Total rows processed: {total_inserted}")

# ----------------------------------
# ENTRYPOINT
# ----------------------------------
if __name__ == "__main__":
    ingest()