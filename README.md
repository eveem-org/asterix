# About

An example script finding self-destructs and token underflows in [Eveem.org](http://www.eveem.org/) contract sources published on BigQuery

The code has just two simple files:

- **asterix.py** - the main execution script
- **script.js** - the analyser function for BigQuery

Hopefully you'll understand what's going on. If you don't - [fill in an Issue](https://github.com/kolinko/asterix/issues/new) in this repo.

# Usage

Usage:
`python3 asterix.py`

Wait for 20 seconds and receive all the contracts with potential issues, as [explained here](https://medium.com/@kolinko/analysing-1-2m-mainnet-contracts-in-20-seconds-using-eveem-and-bigquery-f69b6d66c7b2)

# Requirements

You will need to sign up for cloud.google.com first, and set up the google cloud / bigquery environment:

https://cloud.google.com/bigquery/docs/quickstarts
