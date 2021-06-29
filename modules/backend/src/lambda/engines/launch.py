import json
import logging
import os
import re
import boto3
import decimal
import datetime
from common import DecimalEncoder, get_engines, update_engine_status, delete_engine, send_sqs_message, describe_tasks, list_tasks, start_pipeline_execution, get_pipeline_execution
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr

logging.basicConfig(format='%(levelname)s: %(asctime)s: %(message)s')
logger = logging.getLogger()
logger.setLevel(os.environ['LOGGING_LEVEL'])

dynamodb_resource = boto3.resource('dynamodb')
dynamodb_client = boto3.client('dynamodb')
ecs_client = boto3.client('ecs')
cp_client = boto3.client('codepipeline')


def register_task_definition(family: str, taskRoleArn: str, executionRoleArn: str, name: str, image: str, cpu: int, memory: int, portMappings, command, logGroup: str, region: str):
    logger.info(
        f"Attempting to create task definition for container {name}")
    try:
        response = ecs_client.register_task_definition(
            family=family,
            taskRoleArn=taskRoleArn,
            executionRoleArn=executionRoleArn,
            networkMode='awsvpc',
            containerDefinitions=[
                {
                    'name': name,
                    'image': image,
                    'cpu': 0,
                    'memory': memory,
                    'portMappings': portMappings,
                    'essential': True,
                    'command': command,
                    'logConfiguration': {
                        'logDriver': 'awslogs',
                        "options": {
                            "awslogs-group": logGroup,
                            "awslogs-region": region,
                            "awslogs-stream-prefix": 'dlts'
                        }
                    },
                    'ulimits': [
                        {
                            'name': 'nofile',
                            'softLimit': 50000,
                            'hardLimit': 50000
                        },
                    ],
                },
            ],
            requiresCompatibilities=[
                'FARGATE'
            ],
            cpu=str(cpu),
            memory=str(memory),

        )
    except ClientError as e:
        logger.error(e)
        raise ConnectionAbortedError(e)

    logger.info(json.dumps(response))
    return response


def create_service(cluster: str, serviceName: str, taskDefinition: str, loadBalancers: list, desiredCount: int = 1, subnets: list = [], securityGroups: list = [], healthCheckGracePeriodSeconds: int = 300, assignPublicIp: str = 'DISABLED'):
    try:
        if healthCheckGracePeriodSeconds != None:
            response = ecs_client.create_service(
                cluster=cluster,
                serviceName=serviceName,
                taskDefinition=taskDefinition,
                loadBalancers=loadBalancers,
                desiredCount=desiredCount,
                launchType='FARGATE',
                deploymentConfiguration={
                    'maximumPercent': 200,
                    'minimumHealthyPercent': 100
                },
                networkConfiguration={
                    'awsvpcConfiguration': {
                        'subnets': subnets,
                        'securityGroups': securityGroups,
                        'assignPublicIp': assignPublicIp
                    }
                },
                healthCheckGracePeriodSeconds=healthCheckGracePeriodSeconds,
                schedulingStrategy='REPLICA',
                deploymentController={
                    'type': 'ECS'
                }
            )
        else:
            response = ecs_client.create_service(
                cluster=cluster,
                serviceName=serviceName,
                taskDefinition=taskDefinition,
                loadBalancers=loadBalancers,
                desiredCount=desiredCount,
                launchType='FARGATE',
                deploymentConfiguration={
                    'maximumPercent': 200,
                    'minimumHealthyPercent': 100
                },
                networkConfiguration={
                    'awsvpcConfiguration': {
                        'subnets': subnets,
                        'securityGroups': securityGroups,
                        'assignPublicIp': assignPublicIp
                    }
                },
                schedulingStrategy='REPLICA',
                deploymentController={
                    'type': 'ECS'
                }
            )
    except ClientError as e:
        logger.error(e)
        raise ConnectionAbortedError(e)

    logger.info(json.dumps(response, default=str))
    return response


def lambda_handler(event, context):
    # Log the values received in the event and context arguments
    logger.info(json.dumps(event))
    logger.info(context)
    body = json.loads(event['Records'][0]['body'])
    if body.get('operation') == 'launch':
        if body.get('engine') == 'locust':
            expression = {
                ":engine_status": {
                    'S': 'creating master node task defintions'
                },
                ":last_updated": {
                    'S': datetime.datetime.utcnow().isoformat()
                }
            }
            update_engine_status(
                'locust', "set engine_status = :engine_status, last_updated = :last_updated", expression)
            details = get_engines('locust')

            portMappings = [
                {
                    'containerPort': 8089,
                    'protocol': 'tcp'
                }
            ]
            masterCommand = [
                "-f",
                details['Items'][0]['locustFileName'],
                "--master"
            ]
            master = register_task_definition(
                'locust_master', os.environ['ECS_TASK_ROLE'], os.environ['ECS_EXECUTION_ROLE'], 'locust_master', f"{os.environ['ECR_URL']}:locust", int(details['Items'][0]['masterNodeVcpu']), int(details['Items'][0]['masterNodeMemory']), portMappings, masterCommand, os.environ['ECS_LOG_GROUP'], os.environ['AWS_REGION'])

            expression = {
                ":masterTaskDefinitionArn": {
                    'S': master['taskDefinition']['taskDefinitionArn']
                },
                ":last_updated": {
                    'S': datetime.datetime.utcnow().isoformat()
                },
            }
            update_engine_status(
                'locust', "set masterTaskDefinitionArn = :masterTaskDefinitionArn, last_updated = :last_updated", expression)

            expression = {
                ":engine_status": {
                    'S': 'provisioning master node ecs service'
                },
                ":last_updated": {
                    'S': datetime.datetime.utcnow().isoformat()
                }
            }
            update_engine_status(
                'locust', "set engine_status = :engine_status, last_updated = :last_updated", expression)

            loadBalancers = [
                {
                    'targetGroupArn': os.environ['LOCUST_WEB_TARGETGROUP'],
                    'containerName': 'locust_master',
                    'containerPort': 8089
                }
            ]
            subnets = os.environ['PRIVATE_SUBNETS'].split(
                ',')
            securityGroups = os.environ['CONTAINER_SECURTY_GROUP'].split(',')

            master_service = create_service(os.environ['LOCUST_ECS_NAME'], 'locust_master',
                                            master['taskDefinition']['taskDefinitionArn'], loadBalancers, 1, subnets, securityGroups, 300, os.environ['SLAVE_PUBLIC_IP'])

            waiter = ecs_client.get_waiter('services_stable')
            waiter.wait(
                cluster=os.environ['LOCUST_ECS_NAME'],
                services=[
                    'locust_master'
                ],
                WaiterConfig={
                    'Delay': 5
                }
            )
            expression = {
                ":engine_status": {
                    'S': 'getting master node IP'
                },
                ":last_updated": {
                    'S': datetime.datetime.utcnow().isoformat()
                },
                ":serviceArn": {
                    'S': master_service['service']['serviceArn']
                },
            }
            update_engine_status(
                'locust', "set engine_status = :engine_status, last_updated = :last_updated, serviceArn = :serviceArn", expression)

            master_tasks = list_tasks(
                os.environ['LOCUST_ECS_NAME'], master_service['service']['serviceName'])
            masterIp = describe_tasks(
                os.environ['LOCUST_ECS_NAME'], master_tasks['taskArns'])

            expression = {
                ":engine_status": {
                    'S': 'creating slave task definition'
                },
                ":last_updated": {
                    'S': datetime.datetime.utcnow().isoformat()
                },
                ":masterIpAddress": {
                    'S': masterIp['tasks'][0]['containers'][0]['networkInterfaces'][0]['privateIpv4Address']
                },
            }
            update_engine_status(
                'locust', "set engine_status = :engine_status, last_updated = :last_updated, masterIpAddress = :masterIpAddress", expression)

            details = get_engines('locust')
            logger.info(json.dumps(details, cls=DecimalEncoder))
            portMappings = [
                {
                    'containerPort': 5557,
                    'protocol': 'tcp'
                }
            ]
            slaveCommand = [
                "-f",
                details['Items'][0]['locustFileName'],
                "--worker",
                f"--master-host={details['Items'][0]['masterIpAddress']}"
            ]
            slave = register_task_definition(
                'locust_slave', os.environ['ECS_TASK_ROLE'], os.environ['ECS_EXECUTION_ROLE'], 'locust_slave', f"{os.environ['ECR_URL']}:locust", int(details['Items'][0]['slaveNodeVcpu']), int(details['Items'][0]['slaveNodeMemory']), portMappings, slaveCommand, os.environ['ECS_LOG_GROUP'], os.environ['AWS_REGION'])
            subnets = os.environ['PRIVATE_SUBNETS'].split(
                ',')
            securityGroups = os.environ['CONTAINER_SECURTY_GROUP'].split(',')

            expression = {
                ":engine_status": {
                    'S': 'creating slave service'
                },
                ":last_updated": {
                    'S': datetime.datetime.utcnow().isoformat()
                },
            }
            update_engine_status(
                'locust', "set engine_status = :engine_status, last_updated = :last_updated", expression)
            slave_service = create_service(os.environ['LOCUST_ECS_NAME'], 'locust_slave',
                                           slave['taskDefinition']['taskDefinitionArn'], [], int(details['Items'][0]['numSlaveNodes']), subnets, securityGroups, None, os.environ['SLAVE_PUBLIC_IP'])
            expression = {
                ":engine_status": {
                    'S': 'provisioned'
                },
                ":last_updated": {
                    'S': datetime.datetime.utcnow().isoformat()
                },
                ":slaveTaskDefinitionArn": {
                    'S': slave['taskDefinition']['taskDefinitionArn']
                },
                ":slaveServiceArn": {
                    'S': slave_service['service']['serviceArn']
                },
            }
            update_engine_status(
                'locust', "set engine_status = :engine_status, last_updated = :last_updated, slaveTaskDefinitionArn = :slaveTaskDefinitionArn, slaveServiceArn = :slaveServiceArn", expression)
    elif body.get('operation') == 'custom_locust_file':
        if body.get('engine') == 'locust':
            logger.info(
                "Starting process to build a new container image for a include the custom locust file")
            details = get_engines('locust')
            if 'pipelineExecutionId' in details['Items'][0]:
                status = get_pipeline_execution(
                    os.environ['LOCUST_PIPELINE_NAME'], details['Items'][0]['pipelineExecutionId'])
                if status['pipelineExecution']['status'] == 'InProgress':
                    logger.info(
                        f"Status of execution id {details['Items'][0]['pipelineExecutionId']} is {status['pipelineExecution']['status']}")
                    send_sqs_message(
                        os.environ['LAUNCH_SQS_QUEUE_URL'], 'locust', 'custom_locust_file', 120)
                elif status['pipelineExecution']['status'] == 'Failed':
                    logger.error(
                        f"Status of execution id {details['Items'][0]['pipelineExecutionId']} is {status['pipelineExecution']['status']}")
                    raise ValueError(
                        f"Status of execution id {details['Items'][0]['pipelineExecutionId']} is {status['pipelineExecution']['status']}")
                elif status['pipelineExecution']['status'] == 'Succeeded':
                    logger.info(
                        f"Status of execution id {details['Items'][0]['pipelineExecutionId']} is {status['pipelineExecution']['status']}")
                    send_sqs_message(
                        os.environ['LAUNCH_SQS_QUEUE_URL'], 'locust', 'launch')
            else:
                pipeline = start_pipeline_execution(
                    os.environ['LOCUST_PIPELINE_NAME'])
                expression = {
                    ":pipelineExecutionId": {
                        'S': pipeline['pipelineExecutionId']
                    },
                    ":last_updated": {
                        'S': datetime.datetime.utcnow().isoformat()
                    }
                }
                update_engine_status(
                    'locust', "set pipelineExecutionId = :pipelineExecutionId, last_updated = :last_updated", expression)
                send_sqs_message(
                    os.environ['LAUNCH_SQS_QUEUE_URL'], 'locust', 'custom_locust_file', 120)
    else:
        logger.error(f"Unknown operation: {body.get('operation')}")
        raise ValueError(f"Unknown operation: {body.get('operation')}")
