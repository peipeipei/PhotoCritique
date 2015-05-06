$(document).ready(function(){

	var critiqueID = getQueryVariable("q")

	var critiqueRef = new Firebase("https://6813-aperture.firebaseio.com/critiques/" + critiqueID);
	var annotationsRef = new Firebase("https://6813-aperture.firebaseio.com/" + critiqueID + "/annotations");
	var commentsRef = new Firebase("https://6813-aperture.firebaseio.com/" + critiqueID + "/comments");
	var current_id = 0;
	var this_id = 0;
	var dragging = false;
	var drawable = false;


	critiqueRef.once("value", function(snapshot) {
  		var critique= snapshot.val();
  		var imgName = critique.imageName;

  		$("#photo").attr("src", "gallery_photos/" + imgName);

  		console.log($("#photo"))
	});

            //display all annotations and circles in firebase table
            annotationsRef.once("value", function(snapshot) {
                snapshot.forEach(function(data) {
                    var annotation = data.val();

                    // create new div for different groups
                    if (annotation.currentID != current_id){
                        current_id = annotation.currentID;
                        this_id++;
                        var div = document.createElement("div");
                        div.id = "div_" + current_id;
                        div.className = "circle-group";
                        $("#photo-wrapper").append(div);
                    }

                    var circleObject = saveCircle(annotation.originX, annotation.originY, annotation.radius, data.key(), "div_" + current_id);
					setCircleInactive(circleObject);
                })
            });

            commentsRef.once("value", function(snapshot){
                snapshot.forEach(function(data){
                    var comment = data.val();
                    var c = getComment("comment_" + comment.currentID, comment.text);
                    $("#comments").append(c);
                })
            });

    // activate comment that is clicked on or hovered and deactivate others
	function activate2(id){
		console.log("Activating " + id);
		
		$(".comment").each(function(i, obj){
			var comment_id = obj.id.substring(8);
			
			// activate comment and circles
			if (id === comment_id){
				$("#comment_" + id).addClass("active");
				
				$("#div_" + id).children().each(function (){
					$(this).removeClass("inactive");
					$(this).addClass("circle");
				})
				
				$("#div_" + id).css("z-index", "100");
			}
			//deactivate all other comments
			else {
				$("#comment_" + comment_id).removeClass("active");
				
				$("#div_" + comment_id).children().each(function (){
					setCircleInactive($(this));
				});
				
				$("#div_" + comment_id).css("z-index", "50");
			}
		});
	}

	$(document).on("click", ".circle", function(){
			var parent_id = $(this).parent().attr("id")
			var id = parent_id.substring(4);
			activate2(id);
	});
	
	$(document).on("click", ".comment", function(){
			var id = this.id.substring(8)
			activate2(id);
	});
// From: https://css-tricks.com/snippets/javascript/get-url-variables/
function getQueryVariable(variable)
{
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
}

        // generate html for a comment
        function getComment(commentID, msg){
            var comment = document.createElement("div");
            $(comment).addClass("comment");
            comment.id = commentID;
            $(comment).append(msg);

            return $(comment);
        }
})
