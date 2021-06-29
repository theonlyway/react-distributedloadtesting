#!/bin/bash

mkdir assets
cat > assets/aws_config.js <<EOF
const awsConfig = {
                load_testing_name: '$LOAD_TESTING_NAME',
                engine_alb_address: '$LOCUST_ALB_DNS',
                ecs_dashboard: 'https://$AWS_REGION.console.aws.amazon.com/ecs/home?region=$AWS_REGION#/clusters/',
                aws_project_region: '$AWS_REGION',
                aws_cognito_region: '$AWS_REGION',
                aws_cognito_identity_pool_id: '$AWS_CONGITO_IDENTITY_POOL_ID',
                aws_user_pools_id: '$AWS_USER_POOLS_ID',
                aws_user_pools_web_client_id: '$AWS_USER_POOLS_WEB_CLIENT_ID',
                oauth: {},
                aws_user_files_s3_bucket: '$CONSOLE_BUCKET_NAME',
                aws_user_files_s3_bucket_region: '$AWS_REGION',
                aws_cloud_logic_custom: [
                    {
                        name: 'dlts',
                        endpoint: '$API_ENDPOINT',
                        region: '$AWS_REGION'
                    }
                ]
            }
EOF
