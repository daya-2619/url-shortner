import time
import os

BASE62_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
MACHINE_ID = os.getenv("MACHINE_ID", "a")

counter = 0
last_timestamp = 0

def encode_base62(num: int) -> str:
    if num == 0:
        return BASE62_ALPHABET[0]
    
    encoded = ""
    current = num
    base = 62
    
    while current > 0:
        remainder = current % base
        encoded = BASE62_ALPHABET[remainder] + encoded
        current = current // base
        
    return encoded

def generate_short_id() -> str:
    global counter, last_timestamp
    
    current_timestamp = int(time.time() * 1000)
    
    if current_timestamp == last_timestamp:
        counter += 1
        if counter > 999:
            while current_timestamp <= last_timestamp:
                current_timestamp = int(time.time() * 1000)
            counter = 0
    else:
        counter = 0
        
    last_timestamp = current_timestamp
    
    unique_num = current_timestamp * 1000 + counter
    base62_id = encode_base62(unique_num)
    
    return MACHINE_ID + base62_id
