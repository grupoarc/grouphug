
SHELL := /bin/bash
PIP=./env/bin/pip
PYTEST=./env/bin/py.test
PYTEST_ARGS=-v --timeout=60

# isolate from the local machine
env:
	virtualenv --python=python3.4 env
	$(PIP) install -e .

# for local emulation of heroku's actions
run: env
	source ./env/bin/activate && foreman start

# for local fast development using Flask's app-runner 
dev: env
	./env/bin/python -m grouphug

# run local tests
test: env
	@if [ ! -f $(PYTEST) ]; then \
		$(PIP) install pytest ;\
		$(PIP) install pytest-runfailed ;\
		$(PIP) install pytest-timeout ;\
	fi
	cd tests && ../$(PYTEST) $(PYTEST_ARGS)

# test failed tests first
testf: env
	$(PYTEST) --failed $(PYTEST_ARGS) tests

testf-clean: env clean-testf
	$(PYTEST) --failed $(PYTEST_ARGS) tests

clean-testf:
	rm -rf .pytest

# nuke build products
clean: clean-testf
	rm -rf env  build dist
	rm -rf *.egg-info
	find . -name __pycache__ | xargs rm -rf
	find . -name \*.pyc | xargs rm -rf


.PHONY: run dev test testf testf-clean clean-testf clean

