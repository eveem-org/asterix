#setting up gcloud sdk: https://cloud.google.com/sdk/docs/downloads-interactive
#pip install --upgrade google-cloud-bigquery

import json
import os

from google.cloud import bigquery

client = bigquery.Client()
dataset_id = 'eveem'

dataset_ref = client.dataset(dataset_id)
table_ref = dataset_ref.table('contracts')
table = client.get_table(table_ref)


def select_rows():
    query_job = client.query(
        """
        SELECT
          addr,
          ver
        FROM `eveem.test`
        """)

    results = query_job.result()  # Waits for job to complete.

    for row in results:
        print(row)

def find_contracts():
    with open('showme.js') as f:
        script = f.read()

    query_job = client.query(
        '''
        create temp function showme(contract STRING) 
        returns ARRAY<STRING>
        LANGUAGE js AS 
            """
            '''+script+'''
            """;

        SELECT addr, showme(contract) as a FROM `showme-1389.eveem.contracts` where ARRAY_LENGTH(showme(contract)) > 0
        ''')

    results = query_job.result()  # Waits for job to complete.

    for row in results:
        print(row[0])
#        print(row[1])
        for r in row[1]:
            d = json.loads(r)
            print(d['func_name'])
            print(d['print'])
            print(d['res'])
            print()
        print()
#        print(row[2])


find_contracts()

#insert_row()

exit()

query_job = client.query("""
    SELECT
      CONCAT(
        'https://stackoverflow.com/questions/',
        CAST(id as STRING)) as url,
      view_count
    FROM `bigquery-public-data.stackoverflow.posts_questions`
    WHERE tags like '%google-bigquery%'
    ORDER BY view_count DESC
    LIMIT 10""")

results = query_job.result()  # Waits for job to complete.

for row in results:
    print(row)


'''
schema:
    addr - contract address
    version - e.g. '1 dec 19:18'
    functions - json containing all the functions
'''