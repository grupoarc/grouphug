

Accounts.ui.config({
    passwordSignupFields: "USERNAME_AND_OPTIONAL_EMAIL"
});

Meteor.autorun(function() {
    Session.set("meteor_loggedin", !!Meteor.user());
});

Template.registerHelper('stringify', JSON.stringify);

Template.registerHelper('session', function(input){
    return Session.get(input);
});

Template.registerHelper("displayDate", function(date) {
        return moment(date, "X").format('YYYY/MM/DD HH:mm:ss');
});

Template.registerHelper("isAdmin", isAdmin);


Template.roomFilesShow.helpers({
    'roomFiles': function() {
        var roomName = this.name;
        var room = Rooms.findOne({ name: roomName });
        var files = new Array();
        if (!room || !room.contents) return files;
        for (let item of room.contents) {
            var f = Files.findOne( { _id: item } );
            if (f) {
                files.push(f);
            }
        }
        return files;
    }
});


Template.roomShow.helpers({
    'isLatest': function() {
        var latest = Rooms.findOne({ name: this.name });
        return (!latest || (
                (latest.created === this.created) &&
                (latest.name === this.name)
               ));
    }
});

Template.roomAddFile.events({
    'change .roomAddFileName': function(event, template) {
        event.preventDefault();
        var roomName = this.name;
        var currentUserId = Meteor.userId();
        if (_canEditRoom(currentUserId, roomName)) {
            // var files = document.getElementById('roomAddFileName');
            var files = event;
            FS.Utility.eachFile(files, function(file) {
                Files.insert(file, function (err, fileObj) {
                    //If !err, we have inserted new doc with ID fileObj._id, and
                    //kicked off the data upload using HTTP
                    //so save it in the room
                    roomAddContents(roomName, [ fileObj._id ]); 
                }); 
            });
        }
        Router.go('room', { roomName: roomName });
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
        var roomText = Template.instance()._editor.getData();
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


Template.roomEditor.onRendered(function() {
    this._editor = CKEDITOR.replace('editor');
});


Template.roomEditor.onDestroyed(function() {
    if (this._editor) {
        this._editor.destroy();
    }
});

Template.roomMetaEditor.events({
    'click .saveRoom': function(event) {
        event.preventDefault();
        var roomName = this.name;
        var meta = Template.instance()._editor.getValue();
        var currentUserId = Meteor.userId();
        if (_canEditRoom(currentUserId, roomName)) {
            roomUpdate({
                name: roomName,
                text: this.text,
                meta: meta,
                created: moment().unix(),
                author: currentUserId
            });
        }
        Router.go('room', { roomName: roomName });
    }
});

Template.roomMetaEditor.onRendered(function() {
    //var element = $('#metaEditor');
    var element = document.getElementById('metaEditor');

    var schema = {
        "title": "Metadata",
        "type": "object",
        "properties": {
            "perms": {
                "type": "object",
                "description": "Permissions",
                "properties": {
                    "room": {
                        "type": "string"
                    },
                    "meta": {
                        "type": "string"
                    }
                }
            }
        }
    };

    this._editor = new JSONEditor(element, {
        schema: schema,
        theme: 'bootstrap3',
    });

    this._editor.setValue(this.data.meta);

    this._editor.enable();
});

Template.roomMetaEditor.onDestroyed(function() {
    if (this._editor) {
        this._editor.destroy();
    }
});


Template.roomList.helpers({
    'rooms': function() {
        return Rooms.find({}, {sort: {name: 1}});
    }
});


var history = function(spec_ids) {
    var ids = spec_ids.filter(function (id) { return id; });
    var where = {};
    if (ids.length > 0) {
        where = {$or: [
                    {     _id: { $in: ids }},
                    { room_id: { $in: ids }}
                ]};
    };
    return RoomHistory.find( where, {
        sort: { created: -1 },
        transform: function (room) {
            var author = Meteor.users.findOne({ _id: room.author });
            if (author) {
                room.author = author;
            }
            return room;
        }
    }); 
    
};

Template.roomHistory.helpers({
    'versions': function() {
        return history([ this._id, this.room_id ]);
    }
});

Template.allRoomHistory.helpers({
    'roomchanges': function() {
            return history([]);
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
    },
    timestamp: function() {
        return this.ts.toLocaleString();
    }
});


// search functionality

Template.searchResults.helpers({
    roomResults: function() {
        var searchValue = Router.current().params.query.q;
        Meteor.subscribe("RoomSearch", searchValue);
        if (searchValue) {
            return Rooms.find({}, { sort: [["score", "desc"]] });
        } else {
            console.log("No searchValue found");
            return Rooms.find({});
        }
    }
});

Template.searchBox.events({
    'click #searchButton': function(e) {
        var searchValue = $('#searchValue').val();
        Router.go('searchResults', {}, {query: { q: searchValue}});
    }
});

