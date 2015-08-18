
import sys
import json
from collections import namedtuple

def redisdb():
    import os
    import redis
    from urllib.parse import urlparse

    DEFAULT_URL = "redis://redisuser@localhost:6379/"
    uri = urlparse(os.environ.get('REDISCLOUD_URL', DEFAULT_URL))
    return redis.StrictRedis(host=uri.hostname, port=uri.port, password=uri.password, decode_responses=True)

DB = redisdb()

from .user import User, Link  # classes used by tests
from .user import user        # global variable - the user this server is about

