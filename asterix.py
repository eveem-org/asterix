import hashlib

import json
import os


from helpers import format_exp

from google.cloud import bigquery
#  pip install --upgrade google-cloud-bigquery
#  setting up gcloud sdk: https://cloud.google.com/sdk/docs/downloads-interactive

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = 'creds.json'

client = bigquery.Client()

with open('script.js') as f:
    script = f.read()

query_job = client.query(
    '''
    create temp function parse(contract STRING)
    returns ARRAY<STRING>
    LANGUAGE js AS
        """
        ''' + script + '''
        """;

    SELECT addr, parse(contract)
        FROM `showme-1389.eveem.contracts`
        WHERE ver='v4' AND ARRAY_LENGTH(parse(contract)) > 0
    ''')

results = query_job.result()

for row in results:
    addr = row[0]
    print(addr)  # contract address

    for output in row[1]:
        d = json.loads(output)
        print(d['print'])
        for line in d['offenders']:
            print('^'+format_exp(line))

        print()
    print()

