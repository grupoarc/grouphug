
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
Router.route('/room', function() {
    if (this.params.query.view == 'history') {
        this.render('allRoomHistory');
    } else {
        this.render('roomList') 
    }
},{
        name: 'roomList'
});
Router.route('/rooms', function() {
        this.redirect('roomList')
});
Router.route('/room/:roomName', function () {
    var roomName = this.params.roomName;
    var room = undefined;
    if (this.params.query.asof) {
        // turn asof into a timestamp
        var when = moment(this.params.query.asof, 'X');
        if (!when) {
            console.log("Invalid date '" + this.params.query.asof + "' specified.");
        }
        // query RoomHistory for it
        room = RoomHistory.findOne({
            $and: [
                { name: roomName },
                { created: { $lte: when.unix() } }
            ]},
            { sort: [[ "created", "desc" ]] }
        );
        if (!room) {
            console.log("No room found for date '" + this.params.query.asof + "'");
        };
    }
    if (!room) {
        // no (valid) timestamp specified, search just by name
        room = Rooms.findOne({ name: roomName });
    }
    //console.log("Raw room returned " + room);
    if (!room) {
        room = Rooms.findOne({ name: "__empty_room__" });
        if (!room) {
            console.log("Database not initialized! No __empty_room__ found!");
        } else {
            room.name = roomName;
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
    if (!oldRoom) {
	Rooms.insert(room);
	oldRoom = Rooms.findOne({ name: room.name });
    }
    room.room_id = oldRoom.room_id || oldRoom._id;
    Rooms.update({ _id: oldRoom._id }, room, {upsert: true});
    RoomHistory.insert(room);
}

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

