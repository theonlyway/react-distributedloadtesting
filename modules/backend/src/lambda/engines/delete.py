import json
import logging
import os
import re
import boto3
import decimal
import datetime
from common import DecimalEncoder, get_engines, update_engine_status, delete_engine, list_task_definitions, deregister_task_definition, delete_service, purge_queue
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr

logging.basicConfig(format='%(levelname)s: %(asctime)s: %(message)s')
logger = logging.getLogger()
logger.setLevel(os.environ['LOGGING_LEVEL'])


logging.basicConfig(format='%(levelname)s: %(asctime)s: %(message)s')
logger = logging.getLogger()
logger.setLevel(os.environ['LOGGING_LEVEL'])

dynamodb_resource = boto3.resource('dynamodb')
dynamodb_client = boto3.client('dynamodb')
ecs_client = boto3.client('ecs')
sqs_client = boto3.client('sqs')


def lambda_handler(event, context):
    # Log the values received in the event and context arguments
    logger.info(json.dumps(event))
    logger.info(context)
    body = json.loads(event['Records'][0]['body'])
    if body.get('operation') == 'delete':
        if body.get('engine') == 'locust':
            details = get_engines('locust')
            logger.info(
                "Deregister task definitions")
            locustMaster = list_task_definitions('locust_master')
            if len(locustMaster['taskDefinitionArns']) > 0:
                for task in locustMaster['taskDefinitionArns']:
                    deregister_task_definition(task)
            logger.info(
                "Starting process to deregister locust_slave task definitions")
            locustSlave = list_task_definitions('locust_slave')
            if len(locustSlave['taskDefinitionArns']) > 0:
                for task in locustSlave['taskDefinitionArns']:
                    deregister_task_definition(task)
            expression = {
                ":engine_status": {
                    'S': 'Deleting services'
                },
                ":last_updated": {
                    'S': datetime.datetime.utcnow().isoformat()
                }
            }
            update_engine_status(
                'locust', "set engine_status = :engine_status, last_updated = :last_updated", expression)
            logger.info(
                "Starting process to delete locust_slave service")
            delete_service(os.environ['LOCUST_ECS_NAME'], 'locust_slave')
            logger.info(
                "Starting process to delete locust_master service")
            delete_service(os.environ['LOCUST_ECS_NAME'], 'locust_master')
            delete_engine(body.get('engine'))
            logger.info(
                "Purging SQS queue")
            purge_queue(os.environ['LAUNCH_SQS_QUEUE_URL'])
