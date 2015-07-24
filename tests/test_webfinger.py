
import pytest
from grouphug import User, Link

# Fixtures to avoid repeating setup in the tests

@pytest.fixture
def alice():
    u = User()
    u.subject = 'alice'
    return u

@pytest.fixture
def bob():
    u = User()
    u.subject = 'bob'
    u.aliases = { 'robert', 'rob', 'robby', 'bobby' }
    return u

@pytest.fixture
def carol():
    u = User()
    u.subject = 'carol'
    u.aliases = { 'carol', 'carrie', 'carol lee' }
    u.links = { Link('husband', 'name', 'dave' ),
                Link('employer', 'name', 'costco'),
                Link('employer', 'name', 'carols etsy store')
               }
    return u


# Actual tests

def test_webfinger_fails_if_wrong_resource(alice):
    assert alice.webfinger('bob') is None

def test_webfinger_works_if_right_resource(alice):
    assert alice.webfinger('alice') is not None

def test_webfinger_works_with_aliases(bob):
    assert bob.webfinger('bob') is not None
    assert bob.webfinger('rob') is not None

def test_webfinger_fails_with_aliases(bob):
    assert bob.webfinger('alice') is None

def test_webfinger_works_with_rel_matching_one_link(carol):
    assert len(carol.webfinger('carol', [ 'husband' ])['links']) == 1

def test_webfinger_works_with_rel_matching_more_than_one_link(carol):
    assert len(carol.webfinger('carol', [ 'employer' ])['links']) == 2

def test_webfinger_works_with_multiple_rels(carol):
    assert len(carol.webfinger('carol', [ 'husband', 'employer' ])['links']) == 3

