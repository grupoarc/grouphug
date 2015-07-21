
env:
	virtualenv --python=python3.4 env
	./env/bin/pip install gunicorn
	./env/bin/pip install -e .

