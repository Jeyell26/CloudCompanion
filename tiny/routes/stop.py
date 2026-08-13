import json
from services.s3_service import set_session_state

def stop(bucket: str) -> dict:
    if not bucket:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'BUCKET_NAME environment variable is not configured.'})
        }

    try:
        set_session_state(bucket, active=False)
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'message': 'Stop signal sent successfully. Logger will terminate within 5 seconds.'
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': f"Failed to send stop signal: {str(e)}"})
        }
