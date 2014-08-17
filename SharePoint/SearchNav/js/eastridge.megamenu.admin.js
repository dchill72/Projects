var eastridge = window.eastridge || {};
eastridge.megamenu = eastridge.megamenu || {};

(function($, mm){
	//mm.statusText = ko.observable('');
	//mm.isDynamicNavActive = ko.observable(false);
	//mm.siteNavigationPaths = ko.observable('');		
	
	var _queryNavigationProperties = function() {
		var url = _spPageContextInfo.webAbsoluteUrl + '/_api/web/allProperties';
		
		$.ajax({
			url: url,
			headers:{
			"Accept": "application/json; odata=verbose",
		    "Content-Type": "application/json;odata=verbose"
		    }
		}).done(function(data){
			//console.log(data);
			mm.webPropertiesObject = data.d;
			
			if( data.d.DynamicNavigation != undefined )
				mm.isDynamicNavActive(data.d.DynamicNavigation == 1);
				
			if( data.d.NavigationPaths != undefined )
				mm.siteNavigationPaths(data.d.NavigationPaths);
				
			if ( data.d.HeaderLink != undefined )
				mm.isHeaderLink(data.d.HeaderLink == 1);
		});
		    
	};
	/*
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
		var keys = ['DynamicNavigation', 'NavigationPaths'];
		
		var output = '';
		
		for(var i = 0; i < keys.length; i ++ ){
			var key16 = _8to16(keys[i]);
			output += btoa(key16);
			output += '|';
		}
		
		return output;
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
					webProperties.set_item("vti_indexedpropertykeys", _encodeIndexedKeys() );
					web.update();
					
					ctx.executeQueryAsync(
					function() {
						mm.statusText("Save Success!");			
					},
					function() {
						mm.statusText("Save Failure!");
					});
				
                });
            }
        );		
		
		
	};
	*/
	mm.siteSettingsConfig = function() {
	
		/*
		var title = $("title").text().trim();
		
		if ( title == "" ) {//not ready yet?
			console.log('Title not ready yet?');
			window.setTimeout(_siteSettingsConfig, 100);
			return;
		}
		*/
		//if ( title == "Site Settings" ) {
			var url = _spPageContextInfo.webAbsoluteUrl + '/_api/web/currentuser';
			
			$.ajax({
				url: url,
				headers:{
				"Accept": "application/json; odata=verbose",
			    "Content-Type": "application/json;odata=verbose"
			    }
			}).done(function(data){
			
				if ( data.d.IsSiteAdmin ){
					$('#DeltaPlaceHolderSearchArea').append($('#megamenu-admin-container'));
					_showNavSettings();
								
					_queryNavigationProperties ();								
				}
				
			});	
		//1}	
	}


})(jQuery, eastridge.megamenu);

eastridge.megamenu.siteSettingsConfig();