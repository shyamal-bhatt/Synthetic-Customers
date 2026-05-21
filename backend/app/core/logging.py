import logging
import sys

# Create a custom logger
logger = logging.getLogger("synthetic_customers")
logger.setLevel(logging.DEBUG)

# Format: Time | Level | File:Line | Message
formatter = logging.Formatter(
    "%(asctime)s | %(levelname)s | %(filename)s:%(lineno)d | %(message)s"
)

# Output to console (Docker logs capture this)
handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(formatter)
logger.addHandler(handler)

def get_logger():
    return logger
