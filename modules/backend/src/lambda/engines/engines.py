import json
import logging
import os
import re
import boto3
import decimal
import datetime
from common import DecimalEncoder, get_engines, update_engine_status, delete_engine, send_sqs_message, list_tasks, describe_tasks
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr

logging.basicConfig(format='%(levelname)s: %(asctime)s: %(message)s')
logger = logging.getLogger()
logger.setLevel(os.environ['LOGGING_LEVEL'])


dynamodb_resource = boto3.resource('dynamodb')
dynamodb_client = boto3.client('dynamodb')
sqs_client = boto3.client('sqs')
pricing_client = boto3.client('pricing', region_name='us-east-1')


def response(body, status_code):
    response = {
        'statusCode': str(status_code),
        'body': json.dumps(body, cls=DecimalEncoder, default=str),
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
    }
    logger.info(json.dumps(response))
    return response


def write_engine_to_table(engine: str, description: str, body=None):
    try:
        if engine == 'locust' and body != None:
            dynamodb_client.put_item(TableName=os.environ['ENGINE_DEPLOYMENTS_DYNAMODB_TABLE'], Item={
                'engine_type': {
                    'S': engine,
                },
                'description': {
                    'S': description,
                },
                'started': {
                    'S': datetime.datetime.utcnow().isoformat(),
                },
                'numMasterNodes': {
                    'N': str(body['numMasterNodes']),
                },
                'masterNodeVcpu': {
                    'N': str(body['masterNodeVcpu']),
                },
                'masterNodeMemory': {
                    'N': str(body['masterNodeMemory']),
                },
                'numSlaveNodes': {
                    'N': str(body['numSlaveNodes']),
                },
                'slaveNodeVcpu': {
                    'N': str(body['slaveNodeVcpu']),
                },
                'slaveNodeMemory': {
                    'N': str(body['slaveNodeMemory']),
                },
                'locustFileName': {
                    'S': str(body['locustFileName']),
                },
                'customLocustFile': {
                    'BOOL': body['customLocustFile'],
                },
            })
    except ClientError as e:
        logger.error(e)
        raise ConnectionAbortedError(e)


def recursive_items(dictionary):
    for key, value in dictionary.items():
        if type(value) is dict:
            yield (key, value)
            yield from recursive_items(value)
        else:
            yield (key, value)


def get_fargate_pricing(vcpu_sku: str = 'MMQG9GMCKV4JUBKW', memory_sku: str = 'RWBFR84TYF5JT44P'):

    try:
        vcpu = pricing_client.get_products(ServiceCode='AmazonECS',
                                           Filters=[
                                               {
                                                   'Type': 'TERM_MATCH',
                                                   'Field': 'sku',
                                                   'Value': vcpu_sku
                                               }
                                           ])
    except ClientError as e:
        logger.error(e)
        raise ConnectionAbortedError(e)

    try:
        memory = pricing_client.get_products(ServiceCode='AmazonECS',
                                             Filters=[
                                                 {
                                                     'Type': 'TERM_MATCH',
                                                     'Field': 'sku',
                                                     'Value': memory_sku
                                                 }
                                             ])
    except ClientError as e:
        logger.error(e)
        raise ConnectionAbortedError(e)

    for key, value in recursive_items(json.loads(vcpu['PriceList'][0])['terms']):
        if key == 'pricePerUnit':
            vcpu_price = value['USD']
    for key, value in recursive_items(json.loads(memory['PriceList'][0])['terms']):
        if key == 'pricePerUnit':
            memory_price = value['USD']

    pricing = {
        'vcpu': vcpu_price,
        'memory': memory_price
    }
    return pricing


def lambda_handler(event, context):
    # Log the values received in the event and context arguments
    logger.info(json.dumps(event))
    logger.info(context)

    if event['path'] == '/engines' and event['httpMethod'] == 'GET':
        data = get_engines()
        return response(data, 200)
    elif event['path'] == '/engine/launch/locust' and event['httpMethod'] == 'POST':
        body = json.loads(event['body'])
        engine = get_engines('locust')
        if engine['Count'] > 0:
            return response({'error': 'duplicate_engine', 'error_text': 'Bad Request - A locust engine has already been provisioned', 'data': engine}, 400)
        write_engine_to_table('locust', 'Locust engine', body)
        if body['customLocustFile'] == True:
            send_sqs_message(
                os.environ['LAUNCH_SQS_QUEUE_URL'], 'locust', 'custom_locust_file')
            expression = {
                ":engine_status": {
                    'S': 'Building new container image'
                }
            }
            update_engine_status(
                'locust', "set engine_status = :engine_status", expression)
        else:
            send_sqs_message(
                os.environ['LAUNCH_SQS_QUEUE_URL'], 'locust', 'launch')
            expression = {
                ":engine_status": {
                    'S': 'initial'
                }
            }
            update_engine_status(
                'locust', "set engine_status = :engine_status", expression)
        return response('locust engine starting to provision', 200)
    elif event['resource'] == '/engine/{engine}' and event['httpMethod'] == 'GET':
        data = get_engines(event['pathParameters']['engine'])
        return response(data, 200)
    elif event['resource'] == '/engine/{engine}' and event['httpMethod'] == 'DELETE':
        engine = get_engines(event['pathParameters']['engine'])
        if engine['Count'] > 0:
            send_sqs_message(
                os.environ['DELETE_SQS_QUEUE_URL'], 'locust', 'delete')
            expression = {
                ":engine_status": {
                    'S': 'Starting delete process'
                }
            }
            update_engine_status(
                'locust', "set engine_status = :engine_status", expression)
        return response({'data': "delete process initiated"}, 200)
    elif event['resource'] == '/engine/{engine}/tasks' and event['httpMethod'] == 'GET':
        tasks = list_tasks(os.environ['LOCUST_ECS_NAME'])
        if len(tasks['taskArns']) > 0:
            taskDetails = describe_tasks(
                os.environ['LOCUST_ECS_NAME'], tasks['taskArns'])
            return response(taskDetails, 200)
        else:
            return response([], 200)
    elif event['resource'] == '/pricing/fargate' and event['httpMethod'] == 'GET':
        pricing = get_fargate_pricing()
        return response(pricing, 200)
