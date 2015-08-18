
from flask import Flask, abort, request, render_template, jsonify

from . import user

app = Flask(__name__)
app.debug = True
app.jinja_env.trim_blocks = True
app.jinja_env.lstrip_blocks = True

@app.route('/')
def home():
    return render_template('home.html')


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
        user.save()

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


