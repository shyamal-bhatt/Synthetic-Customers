import logging
import sys

class LogColors:
    RESET = "\033[0m"
    DEBUG = "\033[90m"     # Dark Gray
    INFO = "\033[96m"      # Cyan
    WARNING = "\033[93m"   # Yellow
    ERROR = "\033[91m"     # Red
    CRITICAL = "\033[1;91m" # Bold Red
    TIME = "\033[92m"      # Green
    FILE = "\033[95m"      # Magenta

class ColoredFormatter(logging.Formatter):
    def format(self, record):
        level_color = getattr(LogColors, record.levelname, LogColors.RESET)
        
        # Colorize components
        colored_time = f"{LogColors.TIME}{self.formatTime(record, self.datefmt)}{LogColors.RESET}"
        colored_level = f"{level_color}{record.levelname:<7}{LogColors.RESET}"
        colored_file = f"{LogColors.FILE}{record.filename}:{record.lineno}{LogColors.RESET}"
        
        # Colorize message if it's a warning or error
        msg = record.getMessage()
        if record.levelname in ["WARNING", "ERROR", "CRITICAL"]:
            msg = f"{level_color}{msg}{LogColors.RESET}"
            
        return f"{colored_time} | {colored_level} | {colored_file} | {msg}"

# Create a custom logger
logger = logging.getLogger("synthetic_customers")
logger.setLevel(logging.DEBUG)

handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(ColoredFormatter())
logger.addHandler(handler)

# Prevent logs from bubbling up to root logger (avoid duplicates)
logger.propagate = False

def get_logger():
    return logger
