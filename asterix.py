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

def create_table():
    schema = [
        bigquery.SchemaField('addr', 'STRING', mode='REQUIRED'),
        bigquery.SchemaField('ver', 'STRING', mode='REQUIRED'),
        bigquery.SchemaField('contract', 'STRING', mode='REQUIRED'),
    ]

    table = bigquery.Table(table_ref, schema=schema)
    table = client.create_table(table)  # API request

    assert table.table_id == 'contracts', table.table_id

def cached_contracts():
    path = '../panoramix/cache_pan/'

    for dname in os.listdir(path):
        if not os.path.isdir(path+dname):
            continue
        for fname in os.listdir(path+dname):
            if '.json' not in fname:
                continue

            yield path+dname+'/'+fname

def insert_row():
    path = '../cache_pan/'

    count = 0
    count_addr = 0

    for dname in os.listdir(path):
        if not os.path.isdir(path+dname):
            continue

        rows = []

        for fname in os.listdir(path+dname):
            if '.json' not in fname:
                continue

            count_addr += 1

            with open(path+dname+'/'+fname) as f:
                try:
                    data = json.loads(f.read())
                except:
                    print(f' {addr} bad data')
                    continue

                addr = data['addr']

                s = json.dumps(data)

                if len(s) > 1048000:
                    print(f' {addr} too big')
                    continue

                row = {
                    'addr': addr,
                    'ver': data['ver'],
                    'contract': json.dumps(data)
                }

                rows.append(row)

                print(f' {addr}')

        count += 1
        print(f'inserting {dname} (batch #{count}; sum ctx:{count_addr})')
        if len(rows) == 0:
            continue

        errors = client.insert_rows(table, rows)  # API request
        if errors != []:
            print(errors)

print('hello')
#insert_row()

#exit()

#create_table()

#insert_row()
#exit()

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

def udf_test():
    with open('showme.js') as f:
        script = f.read()

    query_job = client.query(
        '''
        create temp function get_hash(contract STRING) 
        returns ARRAY<STRING>
        LANGUAGE js AS 
            """
            '''+script+'''
            """;

        SELECT addr FROM eveem.contracts where ARRAY_LENGTH(get_hash(contract)) > 0
        ''')

    results = query_job.result()  # Waits for job to complete.

    for row in results:
        print(row)


udf_test()

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