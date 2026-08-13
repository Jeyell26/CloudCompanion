import boto3
from config import settings
from routes.start import start
from routes.stop import stop
from routes.upload import upload_url

lam_client = boto3.client('lambda')

def handler(event, context):
    path = event.get('rawPath', event.get('path', ''))

    if path == '/start':
        return start(event, settings.bucket_name, lam_client)
    elif path == '/stop':
        return stop(settings.bucket_name)
    elif path == '/upload-url':
        return upload_url(settings.bucket_name)
    else:
        return {'statusCode': 404, 'body': 'Not found'}
