import json
from services.s3_service import generate_upload_url

def upload_url(bucket: str) -> dict:
    if not bucket:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'BUCKET_NAME environment variable is not configured.'})
        }

    try:
        url = generate_upload_url(bucket)
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'upload_url': url,
                'expires_in': 3600,
                'instruction': 'Upload your config.json via: curl -X PUT "<upload_url>" --upload-file config.json --header "Content-Type: application/json"'
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': f"Failed to generate presigned URL: {str(e)}"})
        }
