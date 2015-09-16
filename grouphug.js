
// routing
Router.configure({ 
        layoutTemplate: 'main'
});
Router.route('/register');
Router.route('/login');
Router.route('/', { 
        template: 'root',
        name: 'root'
});
Router.route('/room', { 
        template: 'roomList',
        name: 'roomList' 
});
Router.route('/rooms', function() { 
        this.redirect('roomList')
});
Router.route('/room/:roomName', function () {
    var curRoom = this.params.roomName;
    var room = Rooms.findOne({ name: curRoom });
    //console.log("Raw room returned " + room);
    if (!room) {
        room = Rooms.findOne({ name: "__empty_room__" });
        if (!room) {
            console.log("Database not initialized! No __empty_room__ found!");
        } else {
            room.name = curRoom;
	}
    }

    var renderData = {
        data: function() {
           return room;
        }
    };

    if (this.params.query.view === 'editor') {
        this.render('roomEditor', renderData);
    } else if (this.params.query.view === 'history') {
        this.render('roomHistory', renderData);
    } else {
        this.render('showRoom', renderData);
    }
}, {
        name: 'room'
});

// create/prepopulate (if necessary) room collection
Rooms = new Mongo.Collection('rooms');
RoomHistory = new Mongo.Collection('room_history');
Messages = new Mongo.Collection('messages');

var roomUpdate = function (room) {
    var oldRoom = Rooms.findOne({ name: room.name });
    if (oldRoom) {
        room.room_id = oldRoom.room_id || oldRoom._id;
        Rooms.update({ _id: oldRoom._id }, room, {upsert: true});
    } else {
        Rooms.insert(room)
    }
    RoomHistory.insert(room);
}
if (Meteor.isServer) { // Server-only code below here

if (typeof Rooms.findOne({ name: "__empty_room__" }) === "undefined") {
    var newRoom = {
        name: "__empty_room__",
        text: 'There is no room here.  You should <a href="?view=edit">create</a> one.',
        created: Date(),
        author: null
    }
    roomUpdate(newRoom);
}

} // end server-only code

// whether a given username is an admin or not
var isAdmin = function (username) {
    var adminRoom = Rooms.findOne({ name: "__admin__" });
    if (typeof adminRoom === 'undefined') { // room not found
        return true;
    }
    // make a trim'd list of usernames in the room
    var adminList = adminRoom.text.split('\n').map(function(s) { return s.trim() }).filter(function(s) { return s != '' });
    if (adminList.length === 0 || adminList.indexOf(username) > -1) {
        return true;
    }
    return false;
}

if (Meteor.isClient) {  // Client-only code below here

Accounts.ui.config({
    passwordSignupFields: "USERNAME_AND_OPTIONAL_EMAIL"
});

Meteor.autorun(function() {
    Session.set("meteor_loggedin",!!Meteor.user());
});

Handlebars.registerHelper('session',function(input){
    return Session.get(input);
});

Template.roomEditor.events({
    'click .saveRoom': function(event) {
        event.preventDefault();
        var roomName = this.name;
        var roomText = $('[name=roomText]').val();
        var currentUserId = Meteor.userId();
        if ((!currentUserId) ||
            (roomName.startsWith('__') && !isAdmin(currentUserId.username))) {
            return; // E_PERM
        }
        roomUpdate({
            name: roomName,
            text: roomText,
            created: Date(),
            author: currentUserId
        });
        Router.go('room', { roomName: roomName });
    }
});

Template.roomList.helpers({
    'rooms': function() {
        return Rooms.find({}, {sort: {name: 1}});
    }
});

Template.roomHistory.helpers({
    'versions': function() {
        var ids = [ this._id ]
        if (this.room_id) {
            ids.push(this.room_id);
        }
        return RoomHistory.find(
            {$or: [
                {     _id: { $in: ids }},
                { room_id: { $in: ids }}
            ]}, 
            {
                sort: {created: 1},
                transform: function (room) {
                    var author = Meteor.users.findOne({ _id: room.author });
                    if (author) {
                        room.author = author;
                    }
                    return room;
                }
            }
        );
    }
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


// chat functionality

_sendMessage = function(roomname) {
    var el = document.getElementById("msg");
    Messages.insert({user: Meteor.user().username, msg: el.value, ts: new Date(), room: roomname});
    el.value = "";
    el.focus();
};

Template.chatInput.events({
    'click .sendMsg': function(e) {
        _sendMessage(this.name);
    },
    'keyup #msg': function(e) {
        if (e.type == "keyup" && e.which == 13) {
            _sendMessage(this.name);
        }
    }
});

Template.chatMessages.helpers({
    messages: function() {
        return Messages.find({room: this.name}, {sort: {ts: -1}});
    }
});
  
Template.chatMessage.helpers({
    timestamp: function() {
        return this.ts.toLocaleString();
    }
});


}
