
/*!
* 	FSVS - Full Screen Vertical Scroller
* 	https://github.com/lukesnowden/FSVS
* 	Copyright 2014 Luke Snowden
* 	Released under the MIT license:
* 	http://www.opensource.org/licenses/mit-license.php
*/

;( function($){

	$.fn.fsvs = function( options ) {

		/**
		 * [defaults description]
		 * @type {Object}
		 */

		var defaults = {
			speed : 5000,
			selector : '> .slide',
			mouseSwipeDisance : 40,
			afterSlide : function(){},
			beforeSlide : function(){},
			endSlide : function(){},
			mouseWheelEvents : true,
			mouseDragEvents : true,
			touchEvents : true,
			arrowKeyEvents : true,
			pagination : true,
			nthClasses : false,
			detectHash : true
		};

		for( var i in options ) {
			defaults[i] = options[i];
		}
		options = defaults;

		/**
		 * [currentSlideIndex description]
		 * @type {Number}
		 */

		var currentSlideIndex = 0;

		/**
		 * [body description]
		 * @type {[type]}
		 */

		var body = null;

		/**
		 * [scrolling description]
		 * @type {Boolean}
		 */

		var scrolling = false;

		/**
		 * [mouseWheelTimer description]
		 * @type {Boolean}
		 */

		var mouseWheelTimer = false;

		/**
		 * [pagination description]
		 * @type {Boolean}
		 */

		var pagination = false;

		/**
		 * [detectHash description]
		 * @return {[type]} [description]
		 */

		var detectHash = function(){
			$( options.selector, body ).each( function( i ) {
				var slide = $(this);
				if( ! slide.attr( 'id' ) ) {
					slide.attr( 'id', 'slide-' + (i+1) );
				}
			});
			if( window.location.hash !== '' ) {
				var slideID = window.location.hash;
				app.slideToIndex( $( '> ' + slideID, body ).index() );
			}
		};

		/**
		 * [hasTransition description]
		 * @return {Boolean} [description]
		 */

		var hasTransition = function(){
		    prefixes = ['Webkit','Moz','ms','O'];
		   	for( var i in prefixes ) {
		   		if( typeof document.getElementsByTagName( 'body' )[0].style[prefixes[i] + 'Transition' ] !== 'undefined' ) {
		   			return true;
		   		}
		   	}
		    return false;
		}

		/**
		 * [bindMouseDrag description]
		 * @return {[type]} [description]
		 */

		var bindMouseDrag = function() {
			var x, y;
			window.onmousedown = function(e) {
				e.preventDefault();
				y = e.y;
			}
			window.onmouseup = function(e) {
				if( e.y > ( y+options.mouseSwipeDisance ) ) {
					app.slideUp();
				} else if( e.y < ( y-options.mouseSwipeDisance ) ) {
					app.slideDown();
				}
			}
		};

		/**
		 * [bindTouchSwipe description]
		 * @return {[type]} [description]
		 */

		var bindTouchSwipe = function() {
			var startY = null;
			$(window).on( "touchstart", function(ev) {
    			var e = ev.originalEvent;
				if( e.target.nodeName.toLowerCase() !== 'a' ) {
					var touches = e.touches;
					if( touches && touches.length ) {
						startY = touches[0].pageY;
					}
					e.preventDefault();
				}
			});
			$(window).on( "touchmove", function(ev) {
    			var e = ev.originalEvent;
				if( startY !== null ) {
					var touches = e.touches;
					if( touches && touches.length ) {
						var deltaY = startY - touches[0].pageY;
						if ( deltaY >= options.mouseSwipeDisance ) {
							app.slideDown();
							startY = null;
						}
						if ( deltaY <= ( options.mouseSwipeDisance * -1 ) ) {
							app.slideUp();
							startY = null;
						}
					}
					e.preventDefault();
				}
			});
		};

		/**
		 * [mouseWheelHandler description]
		 * @param  {[type]} e [description]
		 * @return {[type]}   [description]
		 */

		var mouseWheelHandler = function( e ) {
			var e = window.event || e;
			var wheely = ( e.wheelDelta || -e.detail );
			var delta = Math.max( -1, Math.min( 1, wheely ) );
			if( ! scrolling && Math.abs( wheely ) > 70 ) {
				if( delta > 0 ) {
					app.slideUp();
				} else {
					app.slideDown();
				}
			}
		};

		/**
		 * [bindMouseWheelEvent description]
		 * @return {[type]} [description]
		 */

		var bindMouseWheelEvent = function() {
			var doc = window;
			if ( doc.addEventListener) {
				doc.addEventListener( "mousewheel", mouseWheelHandler, false );
				doc.addEventListener( "DOMMouseScroll", mouseWheelHandler, false );
			} else {
				doc.attachEvent( "onmousewheel", mouseWheelHandler );
			}
		};

		/**
		 * [bindKeyArrows description]
		 * @return {[type]} [description]
		 */

		var bindKeyArrows = function() {
			window.onkeydown = function(e) {
				e = e || window.event;
			    if ( e.keyCode == '38' ) {
			        app.slideUp();
			    }
			    else if ( e.keyCode == '40' ) {
					app.slideDown();
			    }
			}
		};

		/**
		 * [slideCallback description]
		 * @param  {[type]} index [description]
		 * @return {[type]}       [description]
		 */

		var slideCallback = function( index ) {
			currentSlideIndex = index;
			options.afterSlide( index );
			if( options.detectHash ) {
				var slide = $( options.selector, body ).eq( index );
				window.location.hash = slide[0].id;
			}
			if( ! app.canSlideDown() ) {
				options.endSlide( index );
			}
			if( ! mouseWheelTimer ) {
				scrolling = false;
			}
		};

		/**
		 * [nthClasses description]
		 * @param  {[type]} nthClassLimit [description]
		 * @return {[type]}               [description]
		 */

		var nthClasses = function( nthClassLimit ) {
			$( options.selector, body ).each( function( i ) {
				var nthClass = 'nth-class-' + ((i%nthClassLimit)+1);
				if( ! $(this).hasClass( nthClass ) ) {
					$(this).addClass( nthClass );
				}
			});
		};

		/**
		 * [app description]
		 * @type {Object}
		 */

		var app = {

			nthClasses : nthClasses,

			/**
			 * [addPagination description]
			 */

			addPagination : function() {
				pagination = $('<ul id="fsvs-pagination"></ul>');
				$( options.selector, body ).each( function(i) {
					var linkClass = currentSlideIndex === i ? 'pagination-link active' : 'pagination-link';
					$('<li class="' + linkClass + '"><span><span></span></span></li>').appendTo( pagination );
				});
				if( $('#fsvs-pagination').length !== 0 ) {
					$('#fsvs-pagination').remove();
				}
				pagination.appendTo( body );
				var paginationHeight = pagination.height();
				var speed = options.speed/1000;
				$('span', pagination).css({
					'-webkit-transition': 'all ' + speed + 's',
					'-moz-transition'	: 'all ' + speed + 's',
					'-o-transition'		: 'all ' + speed + 's',
					'transition'		: 'all ' + speed + 's'
				});
				pagination.css({
					marginTop : '-' + (paginationHeight/2) + 'px',
					right : '25px'
				});
				$('li', pagination).click( function(e){
					$('.active', pagination).removeClass( 'active' );
					$(this).addClass( 'active' );
					app.slideToIndex( $(this).index(), e );
				});
			},

			/**
			 * [setSpeed description]
			 * @param {[type]} _speed [description]
			 */

			setSpeed : function( _speed ) {
				speed = _speed/1000;
				body.css({
					'-webkit-transition': 'all ' + speed + 's',
					'-moz-transition'	: 'all ' + speed + 's',
					'-o-transition'		: 'all ' + speed + 's',
					'transition'		: 'all ' + speed + 's'
				});
			},

			/**
			 * [shouldRun description]
			 * @return {[type]} [description]
			 */

			shouldRun : function() {
				return $('html').hasClass( 'fsvs' );
			},

			/**
			 * [canSlideUp description]
			 * @return {[type]} [description]
			 */

			canSlideUp : function() {
				if( currentSlideIndex === 0 ) return false;
				return true;
			},

			/**
			 * [canSlideDown description]
			 * @return {[type]} [description]
			 */

			canSlideDown : function() {
				if( $( options.selector, body ).eq( (currentSlideIndex+1) ).length === 0 ) return false;
				return true;
			},

			/**
			 * [slideToIndex description]
			 * @param  {[type]} index [description]
			 * @return {[type]}       [description]
			 */

			slideToIndex : function( index, e ) {
				var e = e || false;
				scrolling = true;
				options.beforeSlide( index );
				if( ! e && pagination ) {
					$( 'li', pagination ).eq( index ).trigger( 'click' );
				}
				if( hasTransition() ) {
					body.css({ top : "-" + (index*100) + '%' });
					setTimeout( function(){
						slideCallback( index );
					}, options.speed );
				} else {
					body.animate({
						top : '-' + (index*$(window).height()) + 'px'
					}, options.speed, function() {
						slideCallback( index );
					});
				}
			},

			/**
			 * [slideDown description]
			 * @return {[type]} [description]
			 */

			slideDown : function(e) {
				if( app.canSlideDown() ) {
					app.slideToIndex( (currentSlideIndex+1), e );
				}
			},

			/**
			 * [slideUp description]
			 * @return {[type]} [description]
			 */

			slideUp : function(e) {
				if( app.canSlideUp() ) {
					app.slideToIndex( (currentSlideIndex-1), e );
				}
			},

			/**
			 * [init description]
			 * @return {[type]} [description]
			 */

			init : function() {
				body = $('body');
				app.setSpeed( options.speed );
				if( options.pagination ) {
					app.addPagination();
				}
				if( options.nthClasses ) {
					nthClasses( options.nthClasses );
				}
				if( options.mouseWheelEvents ) {
					bindMouseWheelEvent();
				}
				if( options.arrowKeyEvents ) {
					bindKeyArrows();
				}
				if( options.mouseDragEvents ) {
					bindMouseDrag();
				}
				if( options.touchEvents ) {
					bindTouchSwipe();
				}
				if( options.detectHash ) {
					detectHash();
				}
			}

		};

		if( app.shouldRun() ) {
			app.init();
		}
		return app;

	};

})( jQuery );