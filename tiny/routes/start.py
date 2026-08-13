import json
from config import settings
from utils.request import parse_body
from services.cloudwatch import ensure_stream_exists
from services.s3_service import set_session_state
from services.lambda_service import invoke_logger_async

def start(event: dict, bucket: str, lam_client) -> dict:
    if not bucket:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'BUCKET_NAME environment variable is not configured.'})
        }

    body, parse_err = parse_body(event)
    if parse_err:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': parse_err})
        }

    log_group = body.get('log_group', settings.default_log_group)
    raw_duration = int(body.get('duration_seconds', settings.default_duration_seconds))
    duration_seconds = max(settings.min_duration_seconds, min(settings.max_duration_seconds, raw_duration))

    try:
        stream_name = ensure_stream_exists(log_group)
        set_session_state(bucket, active=True, log_group=log_group, log_stream=stream_name)
        invoke_logger_async(lam_client, log_group, stream_name, duration_seconds)

        return {
            'statusCode': 202,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'message': f"Logging started for {duration_seconds} seconds.",
                'log_group': log_group,
                'log_stream': stream_name,
                'duration_seconds': duration_seconds
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': f"Failed to start logging session: {str(e)}"})
        }
