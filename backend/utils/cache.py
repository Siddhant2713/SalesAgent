import functools
import time

def ttl_cache(ttl_seconds: int):
    cache = {}
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            # We filter out non-hashable arguments like Session
            # but keep primitive types like user_id
            hashable_args = tuple(a for a in args if isinstance(a, (int, str, bool, float)))
            hashable_kwargs = tuple((k, v) for k, v in sorted(kwargs.items()) if isinstance(v, (int, str, bool, float)))
            key = (hashable_args, hashable_kwargs)
            
            if key in cache and time.time() - cache[key]["ts"] < ttl_seconds:
                return cache[key]["val"]
                
            result = fn(*args, **kwargs)
            cache[key] = {"val": result, "ts": time.time()}
            return result
        return wrapper
    return decorator
