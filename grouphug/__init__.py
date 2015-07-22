
from collections import namedtuple
from flask import Flask, abort, request, render_template, jsonify

app = Flask(__name__)
app.debug = True
app.jinja_env.trim_blocks = True
app.jinja_env.lstrip_blocks = True

@app.route('/')
def home():
    return render_template('home.html')

Link = namedtuple('Link', 'rel, type, href')

class User(object):
    subject = None
    aliases = set()
    props = {}
    links = set()

    def setprop(self, k, v):
        self.props[k] = v

    def addlink(self, link):
        self.links.add(link)

    def addalias(self, alias):
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

user = User()

def _extract_rows(form, name, cols):
    """pull out a row formdata
       form - form to pull data from
       name - name of the row type
       cols - list of the names of each col in this row, in order

       row formdata has keys named <name>_<nonce>_<pieces[n]>
    """
    results = set()
    for k in form:
        pieces = k.split('_')
        if pieces[0] != name: continue
        if len(pieces) < 3: continue
        prefix = '_'.join(pieces[:-1])
        row = tuple( form.get( '_'.join([prefix, c])) for c in cols )
        if ''.join(row).strip() != '':
            results.add(row)
    return results


@app.route('/user', methods=['GET', 'POST'])
def userpage():
    global user
    if request.method == 'POST':
        # extract form data
        subject = request.form.get('alias_canonical', user.subject)
        aliases = _extract_rows(request.form, 'alias', [ 'val' ])
        props = _extract_rows(request.form, 'prop', ['key', 'val'])
        links = _extract_rows(request.form, 'link', ['rel', 'type', 'href'])

        # put data into the user
        user.subject = subject
        for row in aliases:
            user.addalias(*row)
        for row in props:
            user.setprop(*row)
        for row in links:
            user.addlink(Link(*row))

    return render_template('user.html', user=user)



@app.route('/.well-known/webfinger')
def webfinger():
    global user
    resource = request.args.get('resource')
    rels = request.args.getlist('rel')
    result = user.webfinger(resource, rels)
    if result is None:
        abort(404)
    return jsonify(**result)


