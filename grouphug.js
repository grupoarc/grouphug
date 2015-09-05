
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

Template.addPage.events({
    'click .savePage': function(event) {
        event.preventDefault();
        var pageName = $('[name=pageName]').val();
        var pageText = $('[name=pageText]').val();
        Pages.insert({
            name: pageName,
            text: pageText,
            created: Date()
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

}
