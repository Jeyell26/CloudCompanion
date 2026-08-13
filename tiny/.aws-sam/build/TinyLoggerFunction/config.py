import os

class Settings:
    """Application configuration loaded once at Lambda cold start."""
    def __init__(self):
        self.bucket_name: str = os.environ.get('BUCKET_NAME', '')
        self.logger_function_name: str = os.environ.get('LOGGER_FUNCTION_NAME', 'tiny-logger')
        self.default_log_group: str = os.environ.get('DEFAULT_LOG_GROUP', '/aws/logpulse/demo')
        self.default_duration_seconds: int = int(os.environ.get('DEFAULT_DURATION_SECONDS', '300'))
        self.min_duration_seconds: int = int(os.environ.get('MIN_DURATION_SECONDS', '5'))
        self.max_duration_seconds: int = int(os.environ.get('MAX_DURATION_SECONDS', '840'))

# Single instance created once during module import / cold start
settings = Settings()
