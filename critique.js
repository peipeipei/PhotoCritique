        var annotationsRef = new Firebase("https://6813-aperture.firebaseio.com/annotations");
        var commentsRef = new Firebase("https://6813-aperture.firebaseio.com/comments");

    	$(document).ready(function(){
            var offsetLeft = $("#photo").offset().left;
            var offsetTop = $("#photo").offset().top;
            var current_id = 0;
            var circle_list = [];


    $('[data-toggle="tooltip"]').tooltip({
        placement : 'bottom'
    });

            annotationsRef.once("value", function(snapshot) {
                snapshot.forEach(function(data) {
                    var annotation = data.val();

                    if (annotation.currentID > current_id){
                        current_id = annotation.currentID;
                    }
                    displayCircle(annotation.className, data.key(), annotation.left, annotation.top, annotation.currentID);
                })
            });

            commentsRef.once("value", function(snapshot){
                snapshot.forEach(function(data){
                    var comment = data.val();
                    displayComment(comment.commentID, comment.text);
                })
            });

            function displayCircle(className, id, xPos, yPos, current){
                var img = document.createElement("img");
                img.className = className;
                img.src = "circle-faded.png";
                img.id = id;

                img.style.position = "absolute"
                img.style.left = xPos + "px";
                img.style.top = yPos + "px";

                if (!circle_list[current]){
                    circle_list[current] = []
                }
                circle_list[current].push(img);

                $("#photo").append(img);
            }

        $("#image").on("click", function(e){
            if ($("#annotate").hasClass("active")){
                var img = document.createElement("img");
                img.className = "circle img_" + current_id;
                img.src = "circle.png";
                var w = img.width;

                // center image on mouse click
                xPos = e.pageX - offsetLeft - w/2;
                yPos = e.pageY - offsetTop - w/2;

                img.style.position = "absolute"
                img.style.left = xPos + "px";
                img.style.top = yPos + "px";

                circle_list[current_id].push(img);

                $("#photo").append(img);

                var annotationRef = annotationsRef.push({
                    className: img.className,
                    currentID: current_id,
                    radius: w,
                    left: xPos,
                    top: yPos
                });
                img.id = annotationRef.key();

                //$("#annotate").removeClass("active");
                //$(document.body).css({'cursor' : 'default'});  
            }
        })

        $("#add_comment").on("click", function(){
            current_id++;
            var comment = document.createElement("div");
            $(comment).addClass("comment");
            comment.id = "comment_" + current_id;

            var textarea = document.createElement("textarea");
            textarea.id = "text_" + current_id;
            $(comment).append(textarea);

            var new_div = '<div class = "btn-toolbar"><button id = "annotate" class = "annotate btn btn-default" title = "Add annotation"><img src="circle-small.png"></button><button class = "cancel btn btn-danger pull-right" id = "cancel_' + current_id + '">Cancel</button><button class = "post btn btn-danger pull-right" id = "post_' + current_id + '">Post Comment</button></div>'

            $(comment).append(new_div);

            $("#comments").append(comment);

            $(this).attr("disabled", true);

            circle_list[current_id] = []
        })

        $(document).on("click", ".cancel", function() {
            var id = this.id.substring(7);
            $(".img_" + id).remove();
            $("#comment_" + id).remove();
            circle_list[current_id] = [];
            current_id--;

            $("#annotate").removeClass("active");
            $(document.body).css({'cursor' : 'default'}); 
            $("#add_comment").attr("disabled", false);
        })

        $(document).on("click", ".post", function() {
            var id = this.id.substring(5);
            var msg = $("#text_" + id).val();
            $("#comment_" + id).remove();


           /*var comment = document.createElement("div");
            $(comment).addClass("comment");
            comment.id = "comment_" + current_id;

            icons = '<span id="delete_' + id + '" class="delete glyphicon glyphicon-remove"></span>'
            $(comment).append(msg);
            $(comment).append(icons);

            $("#comments").append(comment);
            $(comment).addClass("active");*/

            displayComment("comment_" + id, msg);
            addIcons("comment_" + id)
            $("#comment_" + id).addClass("active");

            $("#annotate").removeClass("active");
            $(document.body).css({'cursor' : 'default'});  
            $("#add_comment").attr("disabled", false);

            commentsRef.push({
                commentID: "comment_" + id,
                text: msg,
            });

        })

        $(document).on("click", ".delete", function(){
            var id = this.id.substring(7);
            $("#comment_" + id).remove();
            $(".img_" + id).remove();

            commentsRef.orderByChild("commentID").equalTo("comment_" + id).on("value", function(snapshot) {
                 snapshot.forEach(function(data) {
                    var key = data.key();
                    commentsRef.child(key).remove();
                })
            });

            annotationsRef.orderByChild("className").equalTo("circle img_" + id).on("value", function(snapshot){
                snapshot.forEach(function(data){
                    var key = data.key();
                    annotationsRef.child(key).remove();
                })
            })
        })

        $(document).on("click", ".edit", function(){
            var id = this.id.substring(5);
            var text = ""
            commentsRef.orderByChild("commentID").equalTo("comment_" + id).once("value", function(snapshot) {
                 snapshot.forEach(function(data) {
                    text = data.val().text;


            var comment = document.createElement("div");
            $(comment).addClass("comment");
            comment.id = "comment_edit_" + id;

            var textarea = '<textarea id="text_' + id + '">' + text + '</textarea>'
            $(comment).append(textarea);

            var new_div = '<div class = "btn-toolbar"><button id = "annotate" class = "annotate btn btn-default" title = "Add annotation"><img src="circle-small.png"></button><button class = "cancel_edit btn btn-danger pull-right" id = "cancel_edit_' + id + '">Cancel</button><button class = "edit_comment btn btn-danger pull-right" id = "edit_comment_' + id + '">Edit Comment</button></div>'

            $(comment).append(new_div);

            $("#comment_" + id).replaceWith(comment);

            $(comment).addClass("active");
            //$("#comments").append(comment);

            $(this).attr("disabled", true);

                })
            });

        })

        $(document).on("click", ".edit_comment", function(){
            var id = this.id.substring(13);
            var text = $("#text_" + id).val();
            commentsRef.orderByChild("commentID").equalTo("comment_" + id).once("value", function(snapshot) {
                console.log(snapshot)
                 snapshot.forEach(function(data) {
                    var key = data.key();
                    commentsRef.child(key).update({text: text});
                })

                var comment = getComment("comment_" + id, text); 
                $("#comment_edit_" + id).replaceWith(comment);

            });   
        })

        $(document).on("click", ".cancel_edit", function(){
            var id = this.id.substring(12);

            commentsRef.orderByChild("commentID").equalTo("comment_" + id).once("value", function(snapshot) {
                 snapshot.forEach(function(data) {
                    text = data.val().text;
                })

                var comment = getComment("comment_" + id, text); 
                $("#comment_edit_" + id).replaceWith(comment);
            });
        })

        function getComment(commentID, msg){
            var comment = document.createElement("div");
            $(comment).addClass("comment");
            comment.id = commentID;
            $(comment).append(msg);

            return $(comment);
        }

        function displayComment(commentID, msg){
            var comment = document.createElement("div");
            $(comment).addClass("comment");
            comment.id = commentID;
            $(comment).append(msg);

            $("#comments").append(comment);  
        }

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

        function removeIcons(commentID){
            var id = commentID.substring(8);
            var icons_id = "icons_" + id;
            $("#" + icons_id).remove();
        }

        function activate(id, state){
            $('.comment').each(function(i, obj) {
                var photo_id = obj.id.substring(8);
                if (photo_id.length > 5){
                    photo_id = photo_id.substring(5);
                }

                console.log(circle_list)
                if (id === photo_id || "edit_" + id === photo_id){
                    if (state != "none"){
                        $("#" + obj.id).addClass(state);
                        circle_list[photo_id].forEach(function(circle){
                            circle.src = "circle.png"
                        })
                    }
                    else{
                       $("#" + obj.id).removeClass("hover");
                        if ($(this).hasClass("active")){
                            circle_list[photo_id].forEach(function(circle){
                                circle.src = "circle.png"
                            })
                        }
                        else {
                            circle_list[photo_id].forEach(function(circle){
                                circle.src = "circle-faded.png"
                            })    
                        }
                    }
                }
                else {
                    $("#" + obj.id).removeClass(state);
                    if (!$(this).hasClass("active")){
                        circle_list[photo_id].forEach(function(circle){
                            circle.src = "circle-faded.png"
                        })
                    }
                }
            });  
        }
        $(document).on("mouseover", ".circle", function(){
            var id = this.className.substring(11);
            activate(id, "hover");
        })

        $(document).on("mouseout", ".circle", function(){
            var id = this.className.substring(11)
            activate(id, "none");
        })

        $(document).on("click", ".circle", function(){
            var id = this.className.substring(11);
            activate(id, "active");
            addIcons("comment_" + id)
        })

        $(document).on("mouseover", ".comment", function(){
            var id = this.id.substring(8);
            activate(id, "hover");
        })

    	$(document).on("click", ".comment", function(){
    		var id = this.id.substring(8)
            activate(id, "active");
            addIcons(this.id);
    	})

        $(document).on("mouseout", ".comment", function(){
            var id = this.id.substring(8)
            activate(id, "none");
        })

        $(document).on("click", "#annotate", function(){
            if ($(this).hasClass("active")){
                $(this).removeClass("active");
                $(document.body).css({'cursor' : 'default'});     
            }
            else {
                $(this).addClass("active");
                $(document.body).css({'cursor' : 'url("circle.png"), auto'});     
            }
        })

        $("#send_message").on("click", function(){
            window.location = "inbox.html";
        })

    	})
 