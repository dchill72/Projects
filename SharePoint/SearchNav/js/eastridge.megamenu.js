var eastridge = window.eastridge || {};
//Type.registerNamespace('eastridge');
eastridge.megamenu = eastridge.megamenu || {};

ko.bindingHandlers.level1hover = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        //console.log(bindingContext);
        $(element).hoverIntent({
            interval: 50,
            sensitivity: 20,
            timeout: 50,
            over: function () {
                var $li = $(this);
                                
                var $childDiv = $('div:first', $li);
                var $childLi = $li.find('li:first-child');

                // show flyout               
                var $childChildDiv = $li.addClass('hovering').find('li:first-child').find('div:first');
                $childLi.addClass('hovering').siblings().removeClass('hovering');

                // cache original height in dom
                var cacheHeight = $childDiv.height();
                
                if (!$childDiv.data('height')) $childDiv.data('height', cacheHeight);

                // update height based on children
                var childHeight = $childChildDiv.height();
				//console.log('Level 1 childHeight: ' + childHeight + ' cacheHeight: ' + cacheHeight );
				                
                var correctHeight = cacheHeight > childHeight ? cacheHeight : childHeight;
                $childDiv.height(correctHeight);
                $childChildDiv.height(correctHeight);
            },
            out: function () {
                $(this).removeClass('hovering');    
                
				var $li = $(this);
				var $childDiv = $('div:first', $li);
				var $childChildDiv = $li.find('li:first-child').find('div:first');
				
				$childDiv.height('');
				//$childChildDiv.height('');           
            }
        });
    }
};

ko.bindingHandlers.level2hover = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        //console.log(bindingContext);
        $(element).hoverIntent({
            interval: 50,
            sensitivity: 20,
            timeout: 50,
            over: function () {
                var $li = $(this);
                //var $childUL = $li.find('ul');
                //var childCount = $li.find('ul > li').length;
                //var columns = Math.floor(Math.sqrt(childCount));
                
                var $parentDiv = $li.parents('div:first');
                var $childDiv = $('div:first', $li);

                // update to height of children
                var childHeight = $childDiv.height();
                var cacheHeight = $parentDiv.data('height');
                
                //console.log('Level 2 childHeight: ' + childHeight + ' cacheHeight: ' + cacheHeight );
                var correctHeight = childHeight > cacheHeight ? childHeight : cacheHeight;
                
                $parentDiv.height(correctHeight);
                $childDiv.height(correctHeight);
                //if ( columns > 1 ) {
                //	$childDiv.width( (200*columns) + 'px' );
                //	$childDiv.height( '' );
                //}

                // show flyout
                $li.addClass('hovering').siblings().removeClass('hovering');
            },
            out: function () {
            	var $li = $(this);
				var $parentDiv = $li.parents('div:first');
                var $childDiv = $('div:first', $li);
                
                //$parentDiv.height('');
                //$childDiv.height('');

            }
        });
	}
};


(function($, mm){

	var cacheKey = 'eastridge.megamenu.cachekey';
	var cacheExpiresKey = 'eastridge.megamenu.cachekey.expires';
				

	mm.Nodes = ko.observableArray();
	
	mm.statusText = ko.observable('');
	mm.isDynamicNavActive = ko.observable(false);
	mm.isHeaderLink = ko.observable(false);
	mm.siteNavigationPaths = ko.observable('');
	
	mm.isBound = false;
	
	LinkItem = function(title, url){ 
		var obj = this; 
		 
		obj.title = title; 
		obj.url = url;
		obj.description = title;
		obj.Nodes = ko.observableArray(); 
	}; 
 
	_createLinkItem = function(title, url, paths, headerLink) {
	
		//console.log( 'Title: ' + title + ', URL: ' + url + ', Paths: ' + paths );
		
		for(var c = 0; c < paths.length; c ++ ) {

			var path = paths[c];

			var newLink = new LinkItem(title, url);
			
			var parentNode = _ensurePath (path);
			if ( headerLink ) {
				parentNode.url = url;
				parentNode.Nodes.unshift(newLink);
			} 
			else {			
				parentNode.Nodes.push(newLink);				
			}
		}
		
	}
	
	_appendSearch = function(){
		var searchNode = new LinkItem('Search', '/SearchCenter');
		mm.Nodes.push(searchNode);
	}
	
	_ensurePath = function(path){
	
		var leaves = path.split(',');
		
		var level1Title = (leaves[0] || "Other").trim();					
		var level2Title = (leaves[1] || "Other").trim();		
			
		var level1 = ko.utils.arrayFirst(mm.Nodes(), function(item){
			return item.title == level1Title;
		});
		
		if (!level1) {
			level1 = new LinkItem(level1Title, '#');
			if ( level1.title == 'Home' )
				level1.url = '/';
				
			mm.Nodes.push(level1);
			
			var level2 = new LinkItem(level2Title, '#');
			level1.Nodes.push(level2);
			
			return level2;
		}
		
		var l1Nodes = level1.Nodes instanceof Array ? level1.Nodes : level1.Nodes();
		var level2 = ko.utils.arrayFirst(l1Nodes, function(item){
			return item.title == level2Title;
		});	
		
		if(!level2){
			level2 = new LinkItem(level2Title, '#');
			level1.Nodes.push(level2);
		}
		
		return level2;
	}
	
	_addMinutes = function(date, minutes) {
        return new Date(date.getTime() + minutes * 60000);
    };
	 
	_escapeHTML = function(str) { 
		return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); 
	} 
	
	mm.search = function() { 
			
		$.ajax({
                //url:"/_api/search/query?querytext='DynamicNavigation:1'&selectproperties='Path,Url,Title,Author,NavigationCategory,NavigationPath'",
                url:"/_api/search/query?querytext='DynamicNavigation:1'&trimduplicates=false&selectproperties='Path,Url,Title,Author,DynamicNavigation,NavigationPath,HeaderLink'&rowlimit=500",
				method: "GET",
                headers:
                {
					"accept": "application/json;odata=verbose",
                }
        }).done( function(data) { 
			var resultCount = data.d.query.PrimaryQueryResult.RelevantResults.RowCount;
			
			var masterLinksList = [];
			
			for( var i = 0; i < resultCount; i ++ ){
				var result = data.d.query.PrimaryQueryResult.RelevantResults.Table.Rows.results[i];
				
				var props = {};
						
				for( var k = 0; k < result.Cells.results.length; k ++ ){
					var prop = result.Cells.results[k];
				
					props[prop.Key] = prop.Value;	
				}
				
				var match = ko.utils.arrayFirst(masterLinksList, function(item){
					return props.Url == item.Url;
				});
				
				if (match)
					continue;
					
				masterLinksList.push(props);											
			}
			
			masterLinksList.sort(function(left, right){
				return left.Title.localeCompare(right.Title);
			});
			
			for( var i = 0; i < masterLinksList.length; i ++ ) {
				var props = masterLinksList[i];
								
				var paths = props.NavigationPath.split(';');
				
				var headerLink = props.HeaderLink == 1 ? true : false;
				
				_createLinkItem(props.Title, props.Url, paths, headerLink);
			}
			
			mm.Nodes.sort(function(left, right){
				if ( left.title == 'Home' ) return -1;
				if ( right.title == 'Home' ) return 1;
				return left.title.localeCompare(right.title);
			});
			
			for(var i = 1; i < mm.Nodes().length; i ++ ){
				mm.Nodes()[i].Nodes.sort(function(left, right){
					return left.title.localeCompare(right.title);
				});
			}
			
			_appendSearch();
			
			if (typeof(Storage) !== "undefined") {
                var expiration = new Date();
                expiration = _addMinutes(expiration, 5);
                sessionStorage.setItem(cacheExpiresKey, expiration.toString());
                sessionStorage.setItem(cacheKey, ko.toJSON(mm));
            }
			
			mm.completeBinding ();	
			
		}).fail(function( jqxhr, textStatus, error ) {
		    var err = textStatus + ", " + error;
		    //console.log( "Request Failed: " + err );
		    
		    window.setTimeout(mm.search, 100);
		});	
	} 
	
	mm.completeBinding = function() {		
		if ( !mm.isBound ) {			
						
			ko.applyBindings(mm);
			mm.isBound = true;	
			
			$('#eastridge-megamenu').show();
		}
	}
	
	mm.generateNavigation = function() {
		if ( $('#rem-content-container').length > 0 ) {
			//1$('#eastridge-megamenu').insertAfter($('#zz12_TopNavigationMenu'));			
			$('#eastridge-megamenu').appendTo($('#DeltaTopNavigation'))
		} 
		
		mm.Nodes.removeAll();
		
		if (typeof(Storage) !== "undefined") {
		//if ( false ) {
			try {
                var cacheExpires = new Date(sessionStorage.getItem(cacheExpiresKey));
                if ( cacheExpires == NaN ) {
                	mm.loadHomeLinks();
                	return;
                }
                                    
                var now = new Date();
                if ( cacheExpires < now ) {
                	mm.loadHomeLinks();
                	return;
                }
                
                var cachedViewModel = JSON.parse(sessionStorage.getItem(cacheKey));
                if ( cachedViewModel.Nodes.length == 0 ) {
                	mm.loadHomeLinks();
                	return;
                }
                
                mm.Nodes(cachedViewModel.Nodes);
                
                mm.completeBinding ();	
                return;
            }
            catch(e)
            {
            }
		}
	
		mm.loadHomeLinks();
	};
		
	mm.loadHomeLinks = function(){
	
		var url = "/_api/lists/getbytitle('HomeLinks')/items";
		
		$.ajax({
			url: url,
			headers:{
			"Accept": "application/json; odata=verbose",
		    "Content-Type": "application/json;odata=verbose"
		    }
		}).done(function(data){
			//console.log(data);
			var results = data.d.results;
			
			for(var i = 0; i < results.length; i ++ ) {
				var listItem = results[i];
				
				var title = listItem.Title;
				var subheader = listItem.LinkHeading;
				var linkUrl = listItem.URL;
				var headerSort = listItem.HeadingSort;
				var itemSort = listItem.ItemSort;
				
				var paths = [ 'Home,' + subheader ];
				
				_createLinkItem(title, linkUrl, paths, false);

			}
			
			mm.search();
		});
	};
	
	var _8to16 = function(input){
	    var output = '';
	    
	    for( var i = 0; i < input.length; i ++ ) {
	        output += String.fromCharCode(input.charCodeAt(i));
	        output += String.fromCharCode(0);
	    }
	    
	    return output;
	}
	
	var _16to8 = function(input){
	    var output = '';
	    
	    for( var i = 0; i < input.length; i ++ ) {        
	    	var t = input.charCodeAt(i);
	    	if( t == 0 )
	    		continue;
	        
	        output += String.fromCharCode(input.charCodeAt(i));
	    }
	    
	    return output;
	}
	
	var _encodeIndexedKeys = function() {
		var keys = ['DynamicNavigation', 'NavigationPaths', 'HeaderLink'];
		
		var output = '';
		
		for(var i = 0; i < keys.length; i ++ ){
			var key16 = _8to16(keys[i]);
			output += btoa(key16);
			output += '|';
		}
		
		return output;
	}
	
	mm.cancelNavSettings = function() {
		_hideNavSettings();
	}
	
	_hideNavSettings = function() {
		$('#megamenu-blackoverlay').fadeOut(); 
		$('#megamenu-admin-container').fadeOut();
	}
	
	_showNavSettings = function() {
		$('#s4-workspace').animate({ scrollTop: 0 }, "fast"); 

		$('#megamenu-blackoverlay').fadeIn(); 
		$('#megamenu-admin-container').fadeIn();
	}
	
	mm.saveNavSettings = function(){
	
		var scriptbase = '/_layouts/15/';
 
        $.getScript(scriptbase + "SP.Runtime.js",
            function () {
                $.getScript(scriptbase + "SP.js", function() {		                    								
					var ctx = new SP.ClientContext.get_current();
					var web = ctx.get_web();
					var webProperties = web.get_allProperties();
					
					ctx.load(web);
					ctx.load(webProperties);
					
					webProperties.set_item("DynamicNavigation", mm.isDynamicNavActive() ? 1 : 0);
					webProperties.set_item("NavigationPaths", mm.siteNavigationPaths() );
					webProperties.set_item("HeaderLink", mm.isHeaderLink() ? 1 : 0);
					webProperties.set_item("vti_indexedpropertykeys", _encodeIndexedKeys() );
					web.update();
					
					ctx.executeQueryAsync(
					function() {
						mm.statusText("Save Success!");			
						window.setTimeout(function(){_hideNavSettings()}, 2000);
					},
					function() {
						mm.statusText("Save Failure!");
					});
				
                });
            }
        );		
		
		
	};	
		
	mm.init = function(){			
		mm.generateNavigation();	
	};
	
	
	$(document).ready(function(){
		mm.init();
	});

})(jQuery, eastridge.megamenu);
