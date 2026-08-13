import time
import boto3

def ensure_stream_exists(log_group: str) -> str:
    """Ensure log group exists with 1-day retention and create a new stream."""
    cw_logs = boto3.client('logs')

    try:
        cw_logs.create_log_group(logGroupName=log_group)
        cw_logs.put_retention_policy(logGroupName=log_group, retentionInDays=1)
    except cw_logs.exceptions.ResourceAlreadyExistsException:
        pass

    stream_name = f"logpulse-stream-{int(time.time())}"
    cw_logs.create_log_stream(logGroupName=log_group, logStreamName=stream_name)
    return stream_name
