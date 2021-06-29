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
logger.setLevel(os.environ['LOGGING_LEVEL'])

dynamodb_resource = boto3.resource('dynamodb')
dynamodb_client = boto3.client('dynamodb')
sqs_client = boto3.client('sqs')
ecs_client = boto3.client('ecs')
pricing_client = boto3.client('pricing', region_name='us-east-1')
cp_client = boto3.client('codepipeline')


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            if o % 1 > 0:
                return float(o)
            else:
                return int(o)
        return super(DecimalEncoder, self).default(o)


def get_engines(engine=None):
    try:
        if engine != None:
            response = dynamodb_resource.Table(
                os.environ['ENGINE_DEPLOYMENTS_DYNAMODB_TABLE']).query(
                KeyConditionExpression=Key('engine_type').eq(engine)
            )
        else:
            response = dynamodb_resource.Table(
                os.environ['ENGINE_DEPLOYMENTS_DYNAMODB_TABLE']).scan()
    except ClientError as e:
        raise ConnectionAbortedError(e)

    logger.info(json.dumps(response, cls=DecimalEncoder))
    return response


def update_engine_status(engine: str, UpdateExpression: str, ExpressionAttributeValues: dict):
    logger.info(
        f"Updating {engine}")
    try:
        response = dynamodb_client.update_item(
            TableName=os.environ['ENGINE_DEPLOYMENTS_DYNAMODB_TABLE'],
            Key={
                "engine_type": {
                    'S': engine
                }
            },
            UpdateExpression=UpdateExpression,
            ExpressionAttributeValues=ExpressionAttributeValues,
            ReturnValues="UPDATED_NEW"
        )
        logger.info(json.dumps(response, cls=DecimalEncoder))
    except ClientError as e:
        raise ConnectionAbortedError(e)


def delete_engine(engine: str):
    try:
        response = dynamodb_client.delete_item(TableName=os.environ['ENGINE_DEPLOYMENTS_DYNAMODB_TABLE'], Key={
            'engine_type': {
                'S': engine,
            }
        })
        logger.info(json.dumps(response, cls=DecimalEncoder))
    except ClientError as e:
        logger.error(e)
        raise ConnectionAbortedError(e)


def send_sqs_message(queue: str, engine: str, operation: str, DelaySeconds: int = 0):
    logger.info(
        f"Attempting to send message to queue {queue}")
    body = {
        'engine': engine,
        'operation': operation
    }
    try:
        response = sqs_client.send_message(
            QueueUrl=queue,
            MessageBody=json.dumps(body),
            DelaySeconds=DelaySeconds
        )
        logger.info(json.dumps(response))
    except ClientError as e:
        logger.error(e)
        raise ConnectionAbortedError(e)


def list_tasks(cluster: str, serviceName: str = None):

    try:
        if serviceName != None:
            response = ecs_client.list_tasks(
                cluster=cluster,
                serviceName=serviceName,
                launchType='FARGATE'
            )
        else:
            response = ecs_client.list_tasks(
                cluster=cluster,
                launchType='FARGATE'
            )
    except ClientError as e:
        logger.error(e)
        raise ConnectionAbortedError(e)

    logger.info(json.dumps(response, default=str))
    return response


def describe_tasks(cluster: str, tasks: list):

    try:
        response = ecs_client.describe_tasks(
            cluster=cluster,
            tasks=tasks
        )
    except ClientError as e:
        logger.error(e)
        raise ConnectionAbortedError(e)

    logger.info(json.dumps(response, default=str))
    return response


def deregister_task_definition(taskDefinition: str):
    try:
        response = ecs_client.deregister_task_definition(
            taskDefinition=taskDefinition
        )
    except ClientError as e:
        logger.error(e)
        raise ConnectionAbortedError(e)

    logger.info(json.dumps(response, default=str))
    return response


def list_task_definitions(family: str):
    try:
        response = ecs_client.list_task_definitions(
            familyPrefix=family,
            status='ACTIVE'
        )
    except ClientError as e:
        logger.error(e)
        raise ConnectionAbortedError(e)

    logger.info(json.dumps(response, default=str))
    return response


def delete_service(cluster: str, service: str):
    try:
        response = ecs_client.delete_service(
            cluster=cluster,
            service=service,
            force=True
        )
    except ecs_client.exceptions.ServiceNotFoundException as e:
        logger.info(e)
        return None
    except ClientError as e:
        logger.error(e)
        raise ConnectionAbortedError(e)

    logger.info(json.dumps(response, default=str))
    return response


def start_pipeline_execution(name: str):
    try:
        response = cp_client.start_pipeline_execution(
            name=name
        )
    except ClientError as e:
        logger.error(e)
        raise ConnectionAbortedError(e)

    logger.info(json.dumps(response, default=str))
    return response


def get_pipeline_execution(pipelineName: str, pipelineExecutionId: str):
    try:
        response = cp_client.get_pipeline_execution(
            pipelineName=pipelineName, pipelineExecutionId=pipelineExecutionId)
    except ClientError as e:
        logger.error(e)
        raise ConnectionAbortedError(e)

    logger.info(json.dumps(response, default=str))
    return response


def purge_queue(queueUrl: str):
    try:
        response = sqs_client.purge_queue(
            QueueUrl=queueUrl)
    except ClientError as e:
        logger.error(e)
        raise ConnectionAbortedError(e)

    logger.info(json.dumps(response, default=str))
    return response
