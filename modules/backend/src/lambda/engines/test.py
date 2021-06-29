import json
import logging
import os
import re
import boto3
import decimal
import datetime
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr

logging.basicConfig(format='%(levelname)s: %(asctime)s: %(message)s')
logger = logging.getLogger()
logger.setLevel('INFO')

session = boto3.Session(profile_name='aws-237')
ecs_client = session.client('ecs')
cp_client = session.client('codepipeline')

start = cp_client.start_pipeline_execution(
    name='DistributedLoadTesting-locust'
)
status = cp_client.get_pipeline_execution(
    pipelineName='DistributedLoadTesting-locust', pipelineExecutionId=start['pipelineExecutionId'])
print(status)
