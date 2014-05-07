/* @charset 'UTF-8'; */
/* globale jQuery */
String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10); // don't forget the second parm
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);
    var minseconds = Math.round10((this - sec_num )*10);
    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    //var time    = hours+':'+minutes+':'+seconds;
    var time    = minutes+':'+seconds+':'+minseconds;
    return time;
}

$(document).ready(function() {
	console.log("init");
  
  
  $(".handler").width($(".tracer").width())
                .height($(".tracer").height())
                .offset($(".tracer").offset())
                .css("position","absolute")
                .css("z-index","1002");
  var orgin_stat_right=$(".right_handler").offset().left;
  console.log(orgin_stat_right);
  $(".left_handler").draggable({ cursor: "col-resize" ,containment: "parent" ,axis: "x",refreshPositions: true});
  $(".right_handler").draggable({ cursor: "ew-resize" ,containment: "parent" ,axis: "x",refreshPositions: true});
  
  $(".right_handler").on( "drag", function( event, ui ) {
    
    //if(ui.position.left > $(this).parent().width()-$(this).width()) return ;
    console.log(ui.offset.left < orgin_stat_right);
    // if(ui.offset.left < orgin_stat_right){
      if(ui.position.left < $(".left_handler").position().left-20 )return false;
      var new_width = Math.round10(ui.position.left -$(".left_handler").position().left+$(".left_handler").width(), -2)
      if(new_width > $(".handler").width()) {
        $(".tracer").width($(".handler").width());
      
      }else{
        $(".tracer").width(new_width);
      }
    
    
      var playerAPI=$(".flowplayer").data("flowplayer");
      playerAPI.seekTo(ui.offset.left / $(".handler").width()*10, function(){
        $("span.right_time").html((playerAPI.ready ? playerAPI.video.time : 0).toString().toHHMMSS());
      }
    );
    // }else{
 //      ui.offset.left = orgin_stat_right;
 //      return false;
 //    }
    
   
    
    
  } );
  
  
  
  
  $(".left_handler").on( "drag", function( event, ui ) {
    if(ui.position.left > $(".right_handler").position().left)return false;
    
      $(".tracer").width(Math.round10($(".right_handler").position().left - ui.position.left + $(this).width(),-2) );
      
    $(".tracer").offset({top:null,left:Math.round10(ui.offset.left+0.5,-2)});
   
    var playerAPI=$(".flowplayer").data("flowplayer");
    playerAPI.seekTo(($(".tracer").offset().left-$(this).width()) / $(".handler").width()*10, function(){
      $("span.left_time").html((playerAPI.ready ? playerAPI.video.time : 0).toString().toHHMMSS());
    });
    
    
  } );
  
  
  
  
  
  
});
(function () {
    var cache = {};

    this.tmpl = function tmpl(str, data) {
        // Figure out if we're getting a template, or if we need to
        // load the template - and be sure to cache the result.
        var fn = !/\W/.test(str) ?
            cache[str] = cache[str] ||
            tmpl(document.getElementById(str).innerHTML) :

        // Generate a reusable function that will serve as a template
        // generator (and which will be cached).
        new Function("obj",
            "var p=[],print=function(){p.push.apply(p,arguments);};" +

        // Introduce the data as local variables using with(){}
        "with(obj){p.push('" +

        // Convert the template into pure JavaScript
        str
            .replace(/[\r\t\n]/g, " ")
            .split("<%").join("\t")
            .replace(/((^|%>)[^\t]*)'/g, "$1\r")
            .replace(/\t=(.*?)%>/g, "',$1,'")
            .split("\t").join("');")
            .split("%>").join("p.push('")
            .split("\r").join("\\'") + "');}return p.join('');");

        // Provide some basic currying to the user
        return data ? fn(data) : fn;
    };
})();

// Closure
(function(){

	/**
	 * Decimal adjustment of a number.
	 *
	 * @param	{String}	type	The type of adjustment.
	 * @param	{Number}	value	The number.
	 * @param	{Integer}	exp		The exponent (the 10 logarithm of the adjustment base).
	 * @returns	{Number}			The adjusted value.
	 */
	function decimalAdjust(type, value, exp) {
		// If the exp is undefined or zero...
		if (typeof exp === 'undefined' || +exp === 0) {
			return Math[type](value);
		}
		value = +value;
		exp = +exp;
		// If the value is not a number or the exp is not an integer...
		if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
			return NaN;
		}
		// Shift
		value = value.toString().split('e');
		value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
		// Shift back
		value = value.toString().split('e');
		return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
	}

	// Decimal round
	if (!Math.round10) {
		Math.round10 = function(value, exp) {
			return decimalAdjust('round', value, exp);
		};
	}
	// Decimal floor
	if (!Math.floor10) {
		Math.floor10 = function(value, exp) {
			return decimalAdjust('floor', value, exp);
		};
	}
	// Decimal ceil
	if (!Math.ceil10) {
		Math.ceil10 = function(value, exp) {
			return decimalAdjust('ceil', value, exp);
		};
	}

})();


