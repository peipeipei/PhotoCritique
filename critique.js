var annotationsRef = new Firebase("https://6813-aperture.firebaseio.com/annotations");
var commentsRef = new Firebase("https://6813-aperture.firebaseio.com/comments");

var drawable = false;
var current_id = 0;
var this_id = 0;
var id_list = [];
var deleted = [];
var editing = false;

$(document).ready(function(){
            var offsetLeft = $("#photo").offset().left;
            var offsetTop = $("#photo").offset().top;

            // display tooltip for instructions
            $('[data-toggle="tooltip"]').tooltip({
                placement : 'bottom'
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

            // when add comment is clicked, allow user to type a comment and add annotations
            $("#add_comment").on("click", function(){
                current_id++;
                this_id = current_id;
                console.log(current_id, this_id)
                drawable = true;
				editing = true;
                var div = document.createElement("div");
                div.id = "div_" + current_id;
                div.className = "circle-group";
                $("#photo-wrapper").append(div);
				$("#div_" + this_id).css("z-index", "100");

                // add comment div
                var comment = document.createElement("div");
                $(comment).addClass("comment");
                comment.id = "comment_" + current_id;

                var textarea = document.createElement("textarea");
                textarea.id = "text_" + current_id;
                $(comment).append(textarea);

                // add post comment and cancel buttons
                var new_div = '<div class = "btn-toolbar"><button class = "cancel btn btn-danger pull-right" id = "cancel_' + current_id + '">Cancel</button><button class = "post btn btn-danger pull-right" id = "post_' + current_id + '">Post Comment</button></div>'

                $(comment).append(new_div);

                $("#comments").append(comment);

                // disable add_comment button
                $(this).attr("disabled", true);
				
				activate2(this_id);
				$(comment).addClass("active");
            })

            // cancel a comment
            $(document).on("click", ".cancel", function() {
                drawable = false;
				editing = false;
                var id = this.id.substring(7);
                $("#div_" + id).remove();
                $("#comment_" + id).remove();

                $("#add_comment").attr("disabled", false);
            })

            // post a comment
            $(document).on("click", ".post", function() {
                drawable = false;
				editing = false;

                var id = this.id.substring(5);

                console.log(id, this_id);
                var msg = $("#text_" + id).val();
                $("#comment_" + id).remove();

                var comment = getComment("comment_" + id, msg);
                $("#comments").append(comment);

                activate2(id);
  
                $("#add_comment").attr("disabled", false);

                $("#div_" + id).children().each(function (){
					setCircleInactive($(this));
                })
				
				$("#div_" + id).css("z-index", "50");

                // add each circle to firebase
            $("#div_" + current_id).children().each(function (){
                var radius = $(this).context.width / 2;
                var left = $(this).context.style.left;
                var top = $(this).context.style.top;

                var centerX = parseInt(left) + radius;
                var centerY = parseInt(top) + radius;

                var annotationRef = annotationsRef.push({
                    currentID: parseInt(current_id),
                    radius: radius,
                    originX: centerX,
                    originY: centerY
                });

                // set id of circle equal to firebase autogenerated id
                $(this).attr("id", annotationRef.key()); 
            })

                // add finished comment to firebase
                commentsRef.push({
                    currentID: parseInt(id),
                    text: msg,
                });
            })

            // delete a comment
            $(document).on("click", ".delete", function(){
                var id = this.id.substring(7);
                this_id = id;
                $("#comment_" + id).remove();

                $("#div_" + id).remove();

                // search for comment to be deleted and delete from firebase
                commentsRef.orderByChild("currentID").equalTo(parseInt(id)).once("value", function(snapshot) {
                     snapshot.forEach(function(data) {
                        var key = data.key();
                        commentsRef.child(key).remove();
                    })
                });

                // same thing for annotations
                annotationsRef.orderByChild("currentID").equalTo(parseInt(id)).once("value", function(snapshot){
                    snapshot.forEach(function(data){
                        var key = data.key();
                        annotationsRef.child(key).remove();
                    })
                })
            })

            // when you click on pencil, makes textarea appear
            $(document).on("click", ".edit", function(){
                editing = true;
                drawable = true;
                var id = this.id.substring(5);
                this_id = id;
                var text = "";
                id_list = [];
                deleted = [];

                // make circles of current id active and draggable
                $("#div_" + id).children().each(function (){
                    setCircleActive($(this));
                    id_list.push($(this).attr("id"));
                })
				
				$("#div_" + id).css("z-index", "100");
				
                // search for comment with specified id in firebase
                commentsRef.orderByChild("currentID").equalTo(parseInt(id)).once("value", function(snapshot) {
                     snapshot.forEach(function(data) {
                        console.log(data)
                        text = data.val().text;

                    // create textarea for user to edit comment
                    var comment = document.createElement("div");
                    $(comment).addClass("comment");
                    comment.id = "comment_edit_" + id;

                    var textarea = '<textarea id="text_' + id + '">' + text + '</textarea>'
                    $(comment).append(textarea);

                    var new_div = '<div class = "btn-toolbar"><button class = "cancel_edit btn btn-danger pull-right" id = "cancel_edit_' + id + '">Cancel</button><button class = "edit_comment btn btn-danger pull-right" id = "edit_comment_' + id + '">Edit Comment</button></div>'

                    $(comment).append(new_div);

                    $("#comment_" + id).replaceWith(comment);

                    $(comment).addClass("active");

                    $(this).attr("disabled", true);

                    })
                });

            })

        // save edited stuff to firebase
        $(document).on("click", ".edit_comment", function(){
            editing = false;
            drawable = false;
            var id = this.id.substring(13);
            this_id = id;
            var text = $("#text_" + id).val();

            // make circles with id not draggable
            $("#div_" + id).children().each(function (){
                setCircleInactive($(this));
            })
			
			$("#div_" + id).css("z-index", "50");

            // update text of comment
            commentsRef.orderByChild("currentID").equalTo(parseInt(id)).once("value", function(snapshot) {
                 snapshot.forEach(function(data) {
                    var key = data.key();
                    commentsRef.child(key).update({text: text});
                })

                var comment = getComment("comment_" + id, text); 

                // replace edit comment with textarea with a regular comment
                $("#comment_edit_" + id).replaceWith(comment);
				
				activate2(id);

                // remove old annotations
                annotationsRef.orderByChild("currentID").equalTo(parseInt(id)).once("value", function(snapshot){
                    snapshot.forEach(function(data2){
                        console.log(data2.key())
                        var key = data2.key();

                        var radius = document.getElementById(key).width / 2;
                        var left = document.getElementById(key).style.left;
                        var top = document.getElementById(key).style.top;

                        var centerX = parseInt(left) + radius;
                        var centerY = parseInt(top) + radius;                        

                        annotationsRef.child(key).update({radius: radius, originX: centerX, originY: centerY});
                    })
                });


                // add new annotations, need to not add duplicates
                $("#div_" + id).children().each(function (){

                    if (id_list.indexOf($(this).attr("id")) == -1){
                        var radius = $(this).context.width / 2;
                        var left = $(this).context.style.left;
                        var top = $(this).context.style.top;

                        var centerX = parseInt(left) + radius;
                        var centerY = parseInt(top) + radius;

                        var annotationRef = annotationsRef.push({
                            currentID: parseInt(id),
                            radius: radius,
                            originX: centerX,
                            originY: centerY
                        });
                        // set id of circle equal to firebase autogenerated id
                        $(this).attr("id", annotationRef.key()); 
                    }
                    else {
                        console.log("no added circles");
                    }

                })

                deleted.forEach(function(circle_id){
                        var circleRef = new Firebase('https://6813-aperture.firebaseio.com/annotations/' + circle_id);
                        circleRef.remove();
                })


            });
        })

        // cancel an edit
        $(document).on("click", ".cancel_edit", function(){
			var id = this.id.substring(12);
            this_id = id;
            editing = false;
            drawable = false;

            $("#div_" + id).css("z-index", "50");

            // set text of comments equal to old text
            commentsRef.orderByChild("currentID").equalTo(parseInt(id)).once("value", function(snapshot) {
                 snapshot.forEach(function(data) {
                    text = data.val().text;
                })

                var comment = getComment("comment_" + id, text); 
                $("#comment_edit_" + id).replaceWith(comment);


                // clear contents of div to remove newly drawn/moved circles
                $( "#div_" + id ).empty();

                // add original circles back
                annotationsRef.orderByChild("currentID").equalTo(parseInt(id)).once("value", function(snapshot) {
                    snapshot.forEach(function(data) {
                        console.log(data);
                        var annotation = data.val();

                        var circleObject = saveCircle(annotation.originX, annotation.originY, annotation.radius, data.key(), "div_" + id);
						setCircleInactive(circleObject);
                    });
					
					activate2(id);
                });
            });
        })

        // generate html for a comment
        function getComment(commentID, msg){
            var comment = document.createElement("div");
            $(comment).addClass("comment");
            comment.id = commentID;
            $(comment).append(msg);

            return $(comment);
        }

        // add edit and delete icons to comment
        function addIcons(commentID){
            $('.comment').each(function(i, obj) {
                if (commentID === obj.id){
                    if ($(this).children().length == 0){
                        icons = '<span class="pull-right" id="icons_' + commentID.substring(8) + '"><span id="edit_' + commentID.substring(8) + '" class="edit glyphicon glyphicon-pencil"></span> <span id="delete_' + commentID.substring(8) + '" class="delete glyphicon glyphicon-remove"></span></span>'
                        $(this).append(icons)
                    }
                }
                else {
                    var id = obj.id.substring(8);
                    var icons_id = "icons_" + id;
                    $("#" + icons_id).remove();
                }
            });

        }

        // activate comment that is clicked on or hovered and deactivate others
        function activate2(id){
			console.log("Activating " + id);
			
			$(".comment").each(function(i, obj){
                var comment_id = obj.id.substring(8);

                // activate comment and circles
                if (id === comment_id){
                    $("#comment_" + id).addClass("active");
                    addIcons("comment_" + id)
                    
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
                    })
					
					$("#div_" + comment_id).css("z-index", "50");
                }
            })

        }

        /*$(document).on("mouseover", ".circle", function(){
            var id = this.className.split(' ')[1].substring(4);
            //activate(id, "hover");
        })

        $(document).on("mouseout", ".circle", function(){
            var id = this.className.split(' ')[1].substring(4);
            //activate(id, "none");
        })*/

        $(document).on("click", ".circle", function(){
            if (!editing){
                var parent_id = $(this).parent().attr("id")
                var id = parent_id.substring(4);
                console.log(parent_id)
                activate2(id);
            }
        })

    	$(document).on("click", ".comment", function(){
            if (!editing){
    		  var id = this.id.substring(8)
                activate2(id);
            }
    	})

        $("#send_message").on("click", function(){
            window.location = "inbox.html";
        })
})
 