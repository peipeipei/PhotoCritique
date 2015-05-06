	var STROKE_SIZE = 2;
	var OUTLINE_SIZE = 1;
	var STROKE_COLOR = "#ffffff";
	var OUTLINE_COLOR = "#000000";

	// Flag for hovering over an existing circle
	var circleHover = false;

	// Get the Euclidean distance between two points (x1, y1) and (x2, y2)
	var euclidDist = function(x1, y1, x2, y2) {
		var dx = x2 - x1;
		var dy = y2 - y1;
		
		return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
	}
	
	// Draw a circle in a given context
	var drawCircle = function(context, originX, originY, radius) {
		context.beginPath();
		context.arc(originX, originY, radius - OUTLINE_SIZE, 0, 2 * Math.PI, false);
		context.lineWidth = OUTLINE_SIZE + 1;
		context.strokeStyle = OUTLINE_COLOR;
		context.stroke();
		context.closePath();
		
		context.beginPath();
		context.arc(originX, originY, radius - OUTLINE_SIZE - STROKE_SIZE, 0, 2 * Math.PI, false);
		context.lineWidth = STROKE_SIZE + 1;
		context.strokeStyle = STROKE_COLOR;
		context.stroke();
		context.closePath();
		
		context.beginPath();
		context.arc(originX, originY, radius - 2 * OUTLINE_SIZE - STROKE_SIZE, 0, 2 * Math.PI, false);
		context.lineWidth = OUTLINE_SIZE + 0.5;
		context.strokeStyle = OUTLINE_COLOR;
		context.stroke();
		context.closePath();
	}
	
	// Save a circle to its own canvas
	// Returns the jQuery object for the circle
	var saveCircle = function(originX, originY, radius, circleID, groupID) {
		if (!circleID) {
			circleID = "" + originX + "-" + originY;
		}
		
		console.log("Saving circle " + circleID + " to group " + groupID);
		
		$("<canvas>").attr({
			id: circleID,
			class: "circle",
			width: 2 * radius,
			height: 2 * radius
		}).css({
			width: 2 * radius + "px",
			height: 2 * radius + "px",
			position: "absolute",
			top: (originY - radius) + "px",
			left: (originX - radius) + "px"
		}).appendTo("#" + groupID);
		
		var canvas = document.getElementById(circleID);
		var context = canvas.getContext('2d');
		
		drawCircle(context, radius, radius, radius);
		
		var circleObject = $("#" + circleID);
		circleObject.draggable();
		
		console.log("Circle saved");
		return circleObject;
	}
	
	// Make the circle given by the jQuery object active
	var setCircleActive = function(circleObject) {
		circleObject.hover(
			function(e) {
				circleHover = true;
				circleObject.addClass("draggable");
				$(document).keydown(function(e) {
					// 8 = backspace, 46 = delete
					if (e.keyCode == 8 || e.keyCode == 46) {
						circleObject.remove();
						circleHover = false;

						deleted.push(circleObject.attr("id"));
					}
				});
			},
			function(e) {
				circleHover = false;
				circleObject.removeClass("draggable");
				$(document).off("keydown");
			}
		);
		
		circleObject.draggable("enable");
		
		console.log("Circle set to active");
	}
	
	// Make the circle given by the jQuery object inactive
	var setCircleInactive = function(circleObject) {
		circleObject.removeClass("circle");
        circleObject.addClass("inactive");
        circleObject.off("mouseenter mouseleave");
		
		circleObject.draggable("disable");
		
		console.log("Circle set to inactive");
	}

    $(document).ready(function() {
		var photoOffset = $("#photo-wrapper").offset();
		var photoTop = photoOffset.top;
		var photoLeft = photoOffset.left;
		
        // Add a canvas over the photo
        var photoWidth = $("#photo-wrapper").width();
        var photoHeight = $("#photo-wrapper").height();
		
		$("<canvas>").attr({
			id: "drawing-canvas",
			width: photoWidth,
			height: photoHeight
		}).css({
			width: photoWidth + "px",
			height: photoHeight + "px",
			position: "absolute",
			top: "0px",
			left: "0px",
			zIndex: "10"
		}).appendTo("#photo-wrapper");
		
		// Listen for mousedown on photo
        $("#photo-wrapper").mousedown(function(e) {
			// Check for active drawing and don't count clicks on existing circles

			console.log(circleHover);
			if (!drawable || circleHover) {
				return;
			}
			
            var origin = {top: Math.round(e.pageY - photoTop), left: Math.round(e.pageX - photoLeft)};
			
			$("#drawing-canvas").css("z-index", "200");
			
			var canvas = document.getElementById("drawing-canvas");
			var context = canvas.getContext('2d');
            
            // Start listening for mouse movements
            $(document).mousemove(function(e) {
                var top = e.pageY - photoTop;
                var left = e.pageX - photoLeft;
				
				// If cursor has been dragged far enough, show a circle
                var distance = euclidDist(origin.left, origin.top, left, top);
				if (distance > 2 * OUTLINE_SIZE + STROKE_SIZE) {
					context.clearRect(0, 0, canvas.width, canvas.height);
					
					drawCircle(context, origin.left, origin.top, distance);
				}
            });
			
			// Finish up on mouse release
            $(document).one("mouseup", function(e) {
				var top = e.pageY - photoTop;
                var left = e.pageX - photoLeft;
				
				// If valid circle drawn, save it
                var distance = euclidDist(origin.left, origin.top, left, top);
				if (distance > 2 * OUTLINE_SIZE + STROKE_SIZE) {
					var circleObject = saveCircle(origin.left, origin.top, distance, null, "div_" + this_id);
					setCircleActive(circleObject);
				}
				
				// Make sure drawing canvas is clear
				context.clearRect(0, 0, canvas.width, canvas.height);
                $(document).off("mousemove");
				$("#drawing-canvas").css("z-index", "10");
            });
        });
    });