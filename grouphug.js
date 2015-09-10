
// routing
Router.route('/register');
Router.route('/login');
Router.route('/', { 
        template: 'root',
        name: 'root'
});
Router.route('/room');
Router.route('/room/:roomName', {
    template: 'showRoom',
    data: function() {
        var curRoom = this.params.roomName;
        return Rooms.findOne({ name: curRoom });
    }
});
Router.configure({ layoutTemplate: 'main'
});


Rooms = new Mongo.Collection('rooms');

if (Meteor.isClient) {  // Client-only code below here

Accounts.ui.config({
    passwordSignupFields: "USERNAME_AND_OPTIONAL_EMAIL"
});

Template.addRoom.events({
    'click .saveRoom': function(event) {
        event.preventDefault();
        var roomName = $('[name=roomName]').val();
        var roomText = $('[name=roomText]').val();
        var currentUserId = Meteor.userId();
        if (!currentUserId) return;
        Rooms.insert({
            name: roomName,
            text: roomText,
            created: Date(),
            creator: currentUserId
        });
        $('[name=roomName]').val('');
    }
});

Template.room.helpers({
    'room': function() {
        return Rooms.find({}, {sort: {name: 1}});
    }
});

Template.addRoom.helpers({
    'DEFAULT_PAGE_CONTENT' : "Room content goes here"
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
