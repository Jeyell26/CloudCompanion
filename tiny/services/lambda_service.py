import json
import boto3
from config import settings

def invoke_logger_async(lam_client, log_group: str, log_stream: str, duration_seconds: int) -> None:
    """Invoke the logger worker Lambda function asynchronously."""
    payload = {
        'log_group': log_group,
        'log_stream': log_stream,
        'duration_seconds': duration_seconds
    }
    lam_client.invoke(
        FunctionName=settings.logger_function_name,
        InvocationType='Event',
        Payload=json.dumps(payload)
    )
