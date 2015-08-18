import sys
import json
from collections import namedtuple

from . import DB

Link = namedtuple('Link', 'rel, type, href')
"""
A JRD Link. See https://tools.ietf.org/html/rfc7033#section-4.4.4
"""

def link_to_json(link):
    return json.dumps(dict(link._asdict()))

def link_from_json(j):
    return Link(**json.loads(j))


class User(object):

    subject = None
    aliases = set()
    props = {}
    links = set()

    @classmethod
    def load(cls):
        user = User()
        user.subject = DB.get('USER_SUBJECT')
        user.aliases = DB.smembers('USER_ALIASES')
        user.props = DB.hgetall('USER_PROPS')
        user.links = { link_from_json(j) for j in DB.smembers('USER_LINKS') }
        return user

    def save(self):
        def setset(db, key, *vals):
            db.delete(key)
            db.sadd(key, *vals)

        if not self.subject: return
        cmds = DB.pipeline()

        cmds.set('USER_SUBJECT', self.subject)
        if self.aliases:
            setset(cmds, 'USER_ALIASES', *self.aliases)
        if self.props:
            cmds.hmset('USER_PROPS', self.props)
        if self.links:
            setset(cmds, 'USER_LINKS', *(link_to_json(l) for l in self.links))

        results = cmds.execute()
        for result in results:
            if not result:
                sys.stderr.write("something bad! %r" % cmds)

    def setprop(self, k, v):
        self.props[k] = v

    def addlink(self, link):
        self.links.add(link)

    def addalias(self, alias):
        if not self.subject:
            self.subject = alias
        self.aliases.add(alias)

    def webfinger(self, resource, rels=None):
        """return a json-able structure that's the result
        of a webfinger request for this user using the
        specifed resource and list of rels, or return None
        if the resource isn't found
        """
        if not (resource in self.aliases or resource == self.subject):
            return None

        results = {
            'subject': self.subject,
            'aliases': list(self.aliases),
            'properties': self.props,
        }

        links = self.links
        if rels: del results['properties']

        # turn links into something more jsonish
        results['links'] = []
        for l in links:
            if rels and not l.rel in rels: continue
            link = { 'rel': l.rel }
            if l.type: link['type'] = l.type
            if l.href: link['href'] = l.href
            results['links'].append(link)
        return results


# the single, global user, that this is all about
user = User.load()

