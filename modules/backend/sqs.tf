resource "aws_sqs_queue" "launch_engines" {
  name                       = "${var.name}-launch"
  kms_master_key_id          = var.kms_key_arn
  message_retention_seconds  = 604800
  visibility_timeout_seconds = 300
}

resource "aws_sqs_queue" "delete_engines" {
  name                      = "${var.name}-delete"
  kms_master_key_id         = var.kms_key_arn
  message_retention_seconds = 604800
}

resource "aws_sqs_queue_policy" "launch_engines" {
  queue_url = aws_sqs_queue.launch_engines.id
  policy    = <<-EOF
{
    "Version": "2012-10-17",
    "Id": "sqspolicy",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "SQS:SendMessage",
            "Resource": "${aws_sqs_queue.launch_engines.arn}",
            "Condition": {
                "ArnEquals": {
                    "aws:SourceArn": "${aws_iam_role.console_api.arn}"
                }
            }
        },
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "SQS:DeleteMessage",
            "Resource": "${aws_sqs_queue.launch_engines.arn}",
            "Condition": {
                "ArnEquals": {
                    "aws:SourceArn": "${aws_iam_role.console_api.arn}"
                }
            }
        },
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "SQS:PurgeQueue",
            "Resource": "${aws_sqs_queue.delete_engines.arn}",
            "Condition": {
                "ArnEquals": {
                    "aws:SourceArn": "${aws_iam_role.console_api.arn}"
                }
            }
        }
    ]
}
  EOF
}

resource "aws_sqs_queue_policy" "delete_engines" {
  queue_url = aws_sqs_queue.delete_engines.id
  policy    = <<-EOF
{
    "Version": "2012-10-17",
    "Id": "sqspolicy",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "SQS:SendMessage",
            "Resource": "${aws_sqs_queue.delete_engines.arn}",
            "Condition": {
                "ArnEquals": {
                    "aws:SourceArn": "${aws_iam_role.console_api.arn}"
                }
            }
        },
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "SQS:DeleteMessage",
            "Resource": "${aws_sqs_queue.delete_engines.arn}",
            "Condition": {
                "ArnEquals": {
                    "aws:SourceArn": "${aws_iam_role.console_api.arn}"
                }
            }
        }
    ]
}
  EOF
}
