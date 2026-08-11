import json

def parse_body(event: dict) -> tuple[dict, str | None]:
    """Parse JSON body from API Gateway event cleanly."""
    raw_body = event.get('body')
    if not raw_body:
        return {}, None

    if isinstance(raw_body, dict):
        return raw_body, None

    try:
        return json.loads(raw_body), None
    except (json.JSONDecodeError, TypeError):
        return {}, "Invalid JSON format in request body"
