
appDump.allow = function() {
    return this.user && isAdmin(this.user.username);
}

if (typeof Rooms.findOne({ name: "__empty_room__" }) === "undefined") {
    var newRoom = {
        name: "__empty_room__",
        text: 'There is no room here.  You should <a href="?view=editor">create</a> one.',
        created: moment().unix(),
        author: null
    }
    roomUpdate(newRoom);
}

Rooms._ensureIndex({
    "text": "text"
});

// If `searchValue` is not provided, we publish everything. If it is
// provided, we publish only items that match the given search value.
Meteor.publish("RoomSearch", function(searchValue) {
  if (!searchValue) {
    return Rooms.find({});
  }
  var search_clause = { $text: { $search: searchValue }};
  return Rooms.find(
    search_clause,
    {
      // `fields` is where we can add MongoDB projections. Here we're causing
      // each document published to include a property named `score`, which
      // contains the document's search rank, a numerical value, with more
      // relevant documents having a higher score.
      fields: {
        score: { $meta: "textScore" }
      },
      // This indicates that we wish the publication to be sorted by the
      // `score` property specified in the projection fields above.
      sort: {
        score: { $meta: "textScore" }
      }
    }
  );
});
