
from setuptools import setup, find_packages

setup(
        name='grouphug',
        version='0.2',

        description='Distributed Collaboration',
        long_description='Distributed Collaboration via Open Standard',

        # The project's main homepage.
        url='',

        # Author details
        author='Paul Jimenez',
        author_email='pj@place.org',

        # Choose your license
        license='MIT',

        # See https://pypi.python.org/pypi?%3Aaction=list_classifiers
        classifiers=[
                    'Development Status :: 3 - Alpha',
                    'Intended Audience :: Developers',
                    'Programming Language :: Python :: 3.4',
        ],
        keywords = 'social',
        packages = find_packages(),
        package_data = { 'grouphug': [ 'templates/*.html' ] },
        install_requires = [ 'Flask', 'gunicorn', 'redis', 'hiredis' ]
)

