import time
import boto3
from config import settings
from services.s3_service import is_session_stopped, get_config_entries

cw_logs = boto3.client('logs')

def handler(event: dict, context) -> dict:
    bucket = settings.bucket_name
    log_group = event.get('log_group', settings.default_log_group)
    log_stream = event.get('log_stream')
    duration_seconds = int(event.get('duration_seconds', settings.default_duration_seconds))

    if not bucket or not log_stream:
        print("[ERROR] BUCKET_NAME or log_stream parameter missing.")
        return {'statusCode': 400, 'body': 'Missing required parameters'}

    try:
        entries = get_config_entries(bucket)
        if not entries:
            print("[WARN] No log entries found in config.json")
            return {'statusCode': 400, 'body': 'No entries in config.json'}
    except Exception as e:
        print(f"[ERROR] Failed to read config.json: {e}")
        return {'statusCode': 500, 'body': f"Failed to read config.json: {e}"}

    print(f"[INFO] Starting logger loop for group='{log_group}', stream='{log_stream}', duration={duration_seconds}s")

    sequence_token = None
    start_time = time.time()
    idx = 0
    total_logs_sent = 0

    while (time.time() - start_time) < duration_seconds:
        if is_session_stopped(bucket):
            print("[INFO] Stop signal received from session.json. Exiting logger loop.")
            break

        entry = entries[idx % len(entries)]
        formatted_msg = f"[{entry.get('level', 'INFO')}] {entry.get('message', '')}"
        now_ms = int(time.time() * 1000)

        put_kwargs = {
            'logGroupName': log_group,
            'logStreamName': log_stream,
            'logEvents': [{'timestamp': now_ms, 'message': formatted_msg}]
        }
        if sequence_token:
            put_kwargs['sequenceToken'] = sequence_token

        try:
            res = cw_logs.put_log_events(**put_kwargs)
            sequence_token = res.get('nextSequenceToken')
            total_logs_sent += 1
            print(f"[SENT {total_logs_sent}] {formatted_msg}")
        except cw_logs.exceptions.InvalidSequenceTokenException as e:
            sequence_token = e.response.get('expectedSequenceToken')
            print(f"[WARN] Sequence token updated: {sequence_token}")
        except Exception as e:
            print(f"[ERROR] put_log_events failed: {e}")

        idx += 1
        time.sleep(5)

    print(f"[INFO] Logger completed. Total logs sent: {total_logs_sent}")
    return {'statusCode': 200, 'body': f"Completed ({total_logs_sent} logs sent)"}
