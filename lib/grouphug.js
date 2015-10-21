
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

/**
 * Fetch a room's record
 * @param {string} roomName - name of the room
 * @param {string} asof - point in the room's history to fetch the room at
 */
var getRoom = function(roomName, asof) {
    var room = undefined;
    if (asof) {
        // turn asof into a timestamp
        var when = moment(asof, 'X');
        if (!when) {
            console.log("Invalid date '" + asof + "' specified.");
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
            console.log("No room found for date '" + asof + "'");
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
    // we should definitely have something by now
    return room;
};

Router.route('/room/:roomName/meta', function() {
    var room = getRoom(this.params.roomName, this.params.query.asof);

    var template = "roomMetaShow";
    if (this.params.query.view === 'editor') {
        template = 'roomMetaEditor';
    } else if (this.params.query.view === 'history') {
        template = 'roomHistory';
    }

    this.render(template, { data: room });
}, { 
        name: 'roomMeta'
});

Router.route('/room/:roomName/contents', function() {
    var room = getRoom(this.params.roomName, this.params.query.asof);
    var template = "roomAddFile";
    this.render(template, { data: room });
}, {
    name: 'roomContents'
});

Router.route('/room/:roomName', function () {
    var room = getRoom(this.params.roomName, this.params.query.asof);

    var template = "roomShow";
    if (this.params.query.view === 'editor') {
        template = 'roomEditor';
    } else if (this.params.query.view === 'history') {
        template = 'roomHistory';
    }

    this.render(template, { data: room });
}, {
        name: 'room'
});


Router.route('/search', {
        template: 'searchResults',
        name: 'searchResults',
        data: function() {
        return { q: this.params.query.q }
        }
});

Router.route('/admin');


// create/prepopulate (if necessary) room collection
Rooms = new Mongo.Collection('rooms');
RoomHistory = new Mongo.Collection('room_history');
Messages = new Mongo.Collection('messages');

Files = new FS.Collection("files", {
	stores: [new FS.Store.FileSystem("files", { path: "/tmp/files" })]
});

/**
 * Update a room, both the current collection (Rooms) and in history (RoomHistory).
 * A full room object need not be supplied; a deep copy is performed, from the supplied
 * room onto the existing one.
 * @param {object} room - New version of the room
 */
roomUpdate = function (room) {
    var defaults = {
        created: moment().unix(),
        author: Meteor.userId()
    };
    var oldRoom = Rooms.findOne({ name: room.name }) || {};
    var newRoom = $.extend(true, oldRoom, defaults, room);
    newRoom.room_id = oldRoom.room_id || oldRoom._id;
    Rooms.update({ _id: oldRoom._id }, newRoom, {upsert: true});
    delete newRoom._id;
    RoomHistory.insert(newRoom);
}

/**
 * Update a room's contents
 * @param {string} roomname - name of the room to update
 * @param {list} newcontents - object to add to the specifed room's contents
 */
roomAddContents = function(roomname, newcontents) {
    var room = Rooms.findOne({ name: roomname});
    if (!room) return; // TODO: Error somehow
    var contents = room.contents || [];
    if (Array.isArray(newcontents)) {
        contents = contents.concat(newcontents);
    } else {
        contents.push(newcontents);
    }
    room.contents = contents; 
    roomUpdate(room);
}

roomDelContents = function(roomnamee, rmcontents) {
    var room = Rooms.findOne({ name: roomname});
    if (!room) return; // TODO: Error somehow
    var newContents = room.contents || [];
 
}

/**
 * whether a given username is an admin or not
 * @param {string} username - name of the user to check
 */
isAdmin = function (username) {
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

