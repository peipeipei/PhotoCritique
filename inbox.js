var critiquesRef = new Firebase("https://6813-aperture.firebaseio.com/critiques");

$(document).ready(function(){

	console.log("hi")
	            //display all annotations and circles in firebase table
	critiquesRef.once("value", function(snapshot){
		console.log(snapshot)
		snapshot.forEach(function(data){
			var critique = data.val();
			createRow(critique.subject, critique.username, critique.time, data.key());
		})
	})


	function createRow(subject, sender, time, id){
		console.log("hi")
		col = "Hi"
		row = '<li><a href="message.html?q=' + id + '">Click</a></li>'
		$("#inbox").append(row)
	}
})