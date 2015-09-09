
// routing
Router.route('/register');
Router.route('/login');
Router.route('/', { 
        template: 'root',
        name: 'root'
});
Router.route('/page');
Router.route('/page/:pageName', {
    template: 'showPage',
    data: function() {
        var curPage = this.params.pageName;
        return Pages.findOne({ name: curPage });
    }
});
Router.configure({ layoutTemplate: 'main'
});


Pages = new Mongo.Collection('pages');

if (Meteor.isClient) {  // Client-only code below here

Accounts.ui.config({
    passwordSignupFields: "USERNAME_AND_OPTIONAL_EMAIL"
});

Template.addPage.events({
    'click .savePage': function(event) {
        event.preventDefault();
        var pageName = $('[name=pageName]').val();
        var pageText = $('[name=pageText]').val();
        var currentUserId = Meteor.userId();
        if (!currentUserId) return;
        Pages.insert({
            name: pageName,
            text: pageText,
            created: Date(),
            creator: currentUserId
        });
        $('[name=pageName]').val('');
    }
});

Template.page.helpers({
    'page': function() {
        return Pages.find({}, {sort: {name: 1}});
    }
});

Template.addPage.helpers({
    'DEFAULT_PAGE_CONTENT' : "Page content goes here"
});

Template.register.events({
    'submit form': function(event){
        event.preventDefault();
        var email = $('[name=email]').val();
        var password = $('[name=password]').val();
        Accounts.createUser({
            email: email,
            password: password
        }, function(error) {
            if (error) {
                console.log(error.reason)
            } else { 
                Router.go('root');
            }
            });
        console.log("Registerd as " + email)
        Router.go('root');
    }
});

Template.login.events({
    'submit form': function(event){
        event.preventDefault();
        var email = $('[name=email]').val();
        var password = $('[name=password]').val();
        Meteor.loginWithPassword(email, password, function(error) {
            if (error) {
                console.log(error.reason)
            } else { 
                Router.go('root');
            }
            });
    }
});

Template.navbar.events({
    'click .logout': function(event) {
        event.preventDefault();
        Meteor.logout();
        Router.go('login');
    }
});



}
