
from collections import namedtuple, defaultdict
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

    def aka(self, name):
        """return True iff name is a valid alias of this user"""
        return name in self.aliases

    def setprop(self, k, v):
        self.props[k] = v

    def setlink(self, link):
        self.links.add(link)

    def setalias(self, alias):
        self.aliases.add(alias)

def links_as_json(links):
    result = []
    for link in links:
        l = { 'rel': link.rel }
        if link.type: l['type'] = link.type
        if link.href: l['href'] = link.href
        result.append(l)
    return result

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
            user.setalias(*row)
        for row in props:
            user.setprop(*row)
        for row in links:
            user.setlink(Link(*row))

    return render_template('user.html', user=user)



@app.route('/.well-known/webfinger')
def webfinger():
    global user
    resource = request.args.get('resource')
    if not user.aka(resource):
        abort(404)
    rel = request.args.getlist('rel')

    results = {
        'subject': user.subject,
        'aliases': list(user.aliases),
    }
    if not rel:
        results['properties'] = user.props
        links = user.links
    else:
        links = [ l for l in user.links if l.rel in rel ]
    results['links'] = links_as_json(links)

    return jsonify(**results)

