
SHELL := /bin/bash

# isolate from the local machine
env:
	virtualenv --python=python3.4 env
	./env/bin/pip install -e .

clean:
	rm -rf env 
	rm -rf *.egg-info

# for local emulation of heroku's actions
run: env
	source ./env/bin/activate && foreman start

# for local fast development using Flask's app-runner 
dev: env
	./env/bin/python -m grouphug

.PHONY: dev run clean

