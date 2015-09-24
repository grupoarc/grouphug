
if (typeof Rooms.findOne({ name: "__empty_room__" }) === "undefined") {
    var newRoom = {
        name: "__empty_room__",
        text: 'There is no room here.  You should <a href="?view=editor">create</a> one.',
        created: moment().unix(),
        author: null
    }
    roomUpdate(newRoom);
}


