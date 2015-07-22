
SHELL := /bin/bash

env:
	virtualenv --python=python3.4 env
	./env/bin/pip install -e .

clean:
	rm -rf env 
	rm -rf *.egg-info

run: env
	source ./env/bin/activate && foreman start

dev: env
	./env/bin/python -m grouphug
