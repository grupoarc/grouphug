
from setuptools import setup, find_packages

setup(
        name='grouphug',

        # Versions should comply with PEP440.  For a discussion on single-sourcing
        # the version across setup.py and the project code, see
        # https://packaging.python.org/en/latest/single_source_version.html
        version='0.1',

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
        #package_data = { '': spt_files('pywebscript') },
        install_requires = [ 'Flask', 'gunicorn' ]
)

