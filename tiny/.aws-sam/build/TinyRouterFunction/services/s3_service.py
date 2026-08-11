import json
import boto3

def generate_upload_url(bucket: str, key: str = 'config.json', expires_in: int = 3600) -> str:
    """Generate a presigned S3 PUT URL for config upload."""
    s3 = boto3.client('s3')
    return s3.generate_presigned_url(
        'put_object',
        Params={'Bucket': bucket, 'Key': key},
        ExpiresIn=expires_in
    )

def set_session_state(bucket: str, active: bool, log_group: str = '', log_stream: str = '') -> None:
    """Update active session state in S3."""
    s3 = boto3.client('s3')
    payload = {"active": active}
    if log_group:
        payload["log_group"] = log_group
    if log_stream:
        payload["log_stream"] = log_stream

    s3.put_object(
        Bucket=bucket,
        Key='session.json',
        Body=json.dumps(payload),
        ContentType='application/json'
    )

def is_session_stopped(bucket: str) -> bool:
    """Check if session.json marks the current logging session as inactive."""
    s3 = boto3.client('s3')
    try:
        obj = s3.get_object(Bucket=bucket, Key='session.json')
        data = json.loads(obj['Body'].read().decode('utf-8'))
        return data.get('active') is False
    except Exception:
        return False

def get_config_entries(bucket: str) -> list[dict]:
    """Read and parse log template entries from config.json in S3."""
    s3 = boto3.client('s3')
    obj = s3.get_object(Bucket=bucket, Key='config.json')
    data = json.loads(obj['Body'].read().decode('utf-8'))
    return data.get('logs', [])
