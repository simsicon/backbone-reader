(function($){

	window.KeyWord = Backbone.Model.extend({
	});

	window.KeyWordView = Backbone.View.extend({
		template: _.template("<input id='key-word' placeholder='What do you want to read?' type='text' />"),
		
		events: {
			"keypress #key-word"			:	"search"
		},

		initialize: function(){
			_.bindAll(this, 'render');
		},

		render: function(){
			$(this.el).html(this.template(this.model.toJSON()));
			this.input = this.$('#key-word');
			return this;
		},

		search : function(e){
			var text = this.input.val();
			if(!text || e.keyCode != 13) return;
			
			this.searchRSSAjax(text, function(data){
				this.collection = new RssList();
				$('#rss-list').empty();
				_.each(data.entries, function(json, num){
					var rss = new Rss({title : json.title, link : json.link, url : json.url, contentSnippet : json.contentSnippet});	
					this.collection.add(rss);
					var rssView = new RssView({model: rss});
					$('#rss-list').append(rssView.render().el);						
				});	
				
			});
			
		},

		searchRSSAjax : function(key, callback) {
			$.ajax({
    			url: document.location.protocol + '//ajax.googleapis.com/ajax/services/feed/find?v=1.0&callback=?&q=' + encodeURIComponent(key),
    			dataType: 'json',
    			success: function(data) {
      				callback(data.responseData);
    			}
  			});
		}
	});


	window.Rss = Backbone.Model.extend({});

	window.RssList = Backbone.Collection.extend({
		model: Rss
	});
	
	window.RssListView = Backbone.View.extend({
			
		template: _.template("<div id='search-result'><ul id='rss-list'></ul></div>"),

		initialize: function(){
			_.bindAll(this, 'render');
		},

		render : function(){
			$(this.el).html(this.template());
			return this;
		},

		renderRss : function(){

		}
			
	});

	window.RssView = Backbone.View.extend({
		template: "#rss-template",
		tagName: 'li',
		className: 'rss',
		
		events: {
			'click button.add' : 'add',
			'click button.read-more' : 'readmore'
		},

		initialize: function(){
			_.bindAll(this, 'render', 'add', 'readmore');
			this.model.bind('change', this.render);
			this.initializeTemplate();
		},

		initializeTemplate: function(){
			this.template = _.template($(this.template).html());
		},

		render: function(){
			$(this.el).html(this.template(this.model.toJSON()));
			$(this.el).attr('id', 'rss-' + this.model.cid);
			return this;
		},
	
		add : function(){
			console.log("add", this.model);
		},

		readmore : function(){
			console.log("read more", this.model);
			this.parseRss(this.model.get('url'), this.model,  function(model, data){
				console.log("into rss:", data);
				this.collection = new Items();
				this.itemsView = new ItemsView({items:this.collection});
				_.each(data.feed.entries, function(json, num){
					var item = new Item({	author:json.author, 
											categories:json.categories, 
											content:json.content, 
											contentSnippet:json.contentSnippet, 
											link:json.link, 
											publishedDate:json.publishedDate, 
											title:json.title
					});

					this.collection.add(item);
				});
				this.collection.trigger('select', model);
			});	
		},

		parseRss : function(url, model, callback) {
  			$.ajax({
    			url: document.location.protocol + '//ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=-1&callback=?&q=' + encodeURIComponent(url),
    			dataType: 'json',
    			success: function(data) {
      				callback(model, data.responseData);
    			}
  			});
		}
	});


	window.Item = Backbone.Model.extend({
				
	});

	window.Items = Backbone.Collection.extend({
		model: Item
	});

	window.ItemView = Backbone.View.extend({
		template: "#item-template",
		tagName: 'li',
		classname: 'item',

		events: {
			
		},
		
		initialize: function(){
			_.bindAll(this, 'render');
			this.template = _.template($(this.template).html());
		},

		render: function(){
			$(this.el).html(this.template(this.model.toJSON()));
			return this;
		},
	});

	window.ItemsView = Backbone.View.extend({
		template: _.template("<ul id='item-list'></ul>"),
		
		initialize : function(){
			_.bindAll(this, 'render', 'showItems');
			this.items = this.options.items;
			this.items.bind('select', this.showItems);
		},

		render : function(){
			$(this.el).html(this.template());
			this.renderItems();	
			return this;
		},

		renderItems : function(){
			$items = this.$("#item-list");
			this.options.items.each(function(item){
				var itemView = new ItemView({model: item});	
				$items.append(itemView.render().el);
			});	
		},

		showItems : function(rss){
			$('.items', '#rss-' + rss.cid).empty();
			$('.items', '#rss-' + rss.cid).append(this.render().el);
			
		}

	});

	window.BackboneReader = Backbone.Router.extend({
		routes:{
			'':	'home'
		},

		initialize:function(){
			this.keyWord = new KeyWord();
			this.keyWordView = new KeyWordView({model:this.keyWord});
			this.rssListView = new RssListView();
		},

		home: function(){
			$('#container').empty();
			$('#container').append(this.keyWordView.render().el);	
			$('#container').append(this.rssListView.render().el);	
		},
	})

	$(document).ready(function(){
		window.App = new BackboneReader();
		Backbone.history.start({pushState: true});	
	});
	
	
})(jQuery);
