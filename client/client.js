

Accounts.ui.config({
    passwordSignupFields: "USERNAME_AND_OPTIONAL_EMAIL"
});

Meteor.autorun(function() {
    Session.set("meteor_loggedin",!!Meteor.user());
});

Handlebars.registerHelper('session',function(input){
    return Session.get(input);
});


Template.registerHelper("displayDate", function(date) {
        return moment(date, "X").format('YYYY/MM/DD HH:mm:ss');
});


Template.showRoom.helpers({
    'isLatest': function() {
        var latest = Rooms.findOne({ name: this.name });
        return (!latest || (
                (latest.created === this.created) &&
                (latest.name === this.name)
               ));
    }
});

var _canEditRoom = function(userId, roomName) {
  if (!userId) return false;
  if (roomName.startsWith('__') && !isAdmin(userId.username)) return false;
  return true;
}
  
Template.roomEditor.events({
    'click .saveRoom': function(event) {
        event.preventDefault();
        var roomName = this.name;
        var roomText = $('#editor').html();
        var currentUserId = Meteor.userId();
        if (_canEditRoom(currentUserId, roomName)) {
            roomUpdate({
                name: roomName,
                text: roomText,
                created: moment().unix(),
                author: currentUserId
            });
        }
        Router.go('room', { roomName: roomName });
    }
});

Template.roomEditor.rendered = function() {
    this._editor = new Pen("#editor");
};

Template.roomEditor.destroyed = function() {
	if (this._editor) {
            this._editor.destroy();
	}
};

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
                sort: {created: -1},
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

