/* @charset 'UTF-8'; */
/* globale jQuery*/
/*!
* scissorhands plugin
* Original author: @wcweb
* Licensed under the MIT license
*
* jQuery lightweight video eidtor plugin 
* Original author: @wcweb
* Further changes, comments: @wcweb
* Licensed under the MIT license
*/

// the semi-colon before the function invocation is a safety
// net against concatenated scripts and/or other plugins
// that are not closed properly.
;
(function ($, window, document, undefined) {
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


    var pluginName = 'ScissorHands',
        playerAPI = null,
        wrapper = {},
        events = [],
        cuepoints=[],
        //tracker={start:time,end:time,id:id}

        defaults = {
            url: '',
            paramsData: ''
        },
        contorl_panel_template = tmpl(
            '<div id="content_panel"><div id="trackers"></div><div id="panels_line" style="display:none;"></div></div><div class="control_panel" id=control_panel><p><a href="#" class="add_track" id=add_track><span class="">增加轨道</span></a>'
            +'<a id=finish_button class="finnish_button" href="#">完成截取</a><span class="output_codeline">等待截取...</span></p></div>'
        ),
        cuepoints_templeate = tmpl(
            '<div id="panel_cues" class="panel"><div class="rails">'+'<% for(var key in cuepoints){ %>'+
            '<a class="cue" style="width:auto; display:block; position:absolute;left:<%= cuepoints[key]["position"]%>px;display: inline-block;background:green;" title=" <%= cuepoints[key]["title"] %> | <%= cuepoints[key].seekTime.toString().toHHMMSS() %>"><p class="">o</p></a>'+
            '<% } %>'+
            '</div></div>'
        ),
        track_template = tmpl(
            '<div id="panel_<%= id %>" class="panel"><div id="rails_<%= id %>" class="rails"></div><div id="tracer_<%= id %>" class="tracer"></div><div id="handler_<%= id %>" class="handler"><a class="right_handler" ></a><a class="left_handler" ></a><p class="count_timer"><span class="clip_name"><%= clip_name %>:  </span><span class = ""> <a href="#" class="delete_track" data-target="<%= id %>">删除 </a></span><span class="left_time"><%= clip_start %></span><span> - </span><span class="right_time"><%= clip_end %></span></p></div></div>'
        );
    // The actual plugin constructor

    function Plugin(element, options) {
        this.element = $(element);
        wrapper = this.element;
        this.options = $.extend({}, defaults, options);

        playerAPI = this.options.playerAPI;
        // playerAPI.seekTo(time,fn)
        
        this.cuepoints = this.options.cuepoints;
        
        this._name = pluginName;

        this.trackers = [];
        this.trackers_sum = 0;
        this.init();
        this.cuepoints=this.getCuepointsList();
        
        
    }

    Plugin.prototype.init = function () {
        // Place initialization logic here
        // You already have access to the DOM element and
        // the options via the instance, e.g. this.element
        // and this.options
        $(this.element).contents().remove();
        
        
        // if(playerAPI.video.duration == null){
            //this.options.playerAPI.getCommonClip().onUpdate(function(e){console.log("hwhwhwhwh")});
        // }
        
        
        
        $(this.element).append($(contorl_panel_template({})));
        
        
        //var start_clip = this.addTrack('片头'),
        //    end_clip = this.addTrack('片尾'),
        var init_one = this.addTrack(),
            that = this;

        
        // control panel intrativities
        $("#add_track").click(function (e) {
            e.preventDefault();
            var new_one = that.addTrack();
        });
        $("#finish_button").click(function (e) {
            e.preventDefault();
            var trackers = that.trackers.slice(0),
                output_string = '';
            //console.log(trackers);
            trackers=reOrder(trackers,"startTime");
            
            output_string += "0B,";
            for (var x = 0; x <= trackers.length - 1; x++) {
                //console.log(trackers[x].startTime);
                output_string += Math.round(trackers[x].startTime) + "-" + Math.round(trackers[x].endTime) + ",";
            }
            output_string += "0A";
            $(".output_codeline").html(output_string);
            $("input[name='Cutout']").val(output_string);
        })

    }
    function reOrder(arr, option){
        for (var i = 0; i <= arr.length - 1; i++) {
            for (var j = i; j < arr.length; j++) {
                if (arr[i][option] > arr[j][option]) {
                    var temp = arr[j];
                    arr[j] = arr[i];
                    arr[i] = temp;
                }
            }
        }
        return arr
    }
    Plugin.prototype.renderCuePoints=function(){
        cuepoints= this.options.cuepoints;
        cuepoints= reOrder(cuepoints, "seekTime");
       
        for(var key in cuepoints){
            cuepoints[key].position= cuepoints[key].seekTime*$(".rails").width()/playerAPI.getClip().duration;
        }
        
        console.log(cuepoints);
        $(this.element).children("#content_panel").prepend($(cuepoints_templeate({cuepoints:cuepoints})));
        
    }
     
    Plugin.prototype.addTrack = function (name) {
        var trackers = this.trackers,
            trackers_sum = this.trackers_sum;
        if (!name) name = '片段 ' + trackers_sum;
        var new_one = new tracker(trackers_sum, this, name);
        currentTracker = new_one;
        trackers.push(new_one);

         $(this.element).children("#content_panel").children("#trackers").prepend(new_one.html());

        new_one.genneratEvent();

        this.trackers_sum += 1;

        return new_one;
    }


    function tracker(id, root, name) {
        this.id = id;
        this.startTime = 0;
        this.endTime = playerAPI.getClip().duration;
        this.root = root;
        this.name = name;
    }

    tracker.prototype.duration = function () {
        return { startTime: this.startTime, endTime: this.endTime };
    }
    tracker.prototype.html = function () {
        return $(track_template({ 
            'id': this.id, 
            'clip_name': this.name ,
            'clip_start':this.startTime.toString().toHHMMSS(),
            'clip_end':this.endTime.toString().toHHMMSS()}));
    }

    tracker.prototype.genneratEvent = function () {
        var id = this.id,
            that = this,
            trackers = this.root.trackers,
            trackers_sum = this.root.trackers_sum;

        var left_handler = $("#handler_" + id + " .left_handler"),
            right_handler = $("#handler_" + id + " .right_handler"),
            handlers = $("#handler_" + id),
            tracer = $("#tracer_" + id),
            delete_track = $("#handler_" + id + " .delete_track"),
            startTime = 0,
            endTime = 0;

        handlers.width(tracer.width())
            .height(tracer.height())
            .offset(tracer.offset())
            .css("position", "absolute")
            .css("z-index", "1002");

        var orgin_stat_right = right_handler.offset().left;

        left_handler.draggable({
            cursor: "col-resize",
            containment: "parent",
            axis: "x",
            refreshPositions: true
        });

        right_handler.draggable({
            cursor: "col-resize",
            containment: "parent",
            axis: "x",
            refreshPositions: true
        });
        right_handler.on("mouseenter",function(event){
            $("#panels_line").fadeIn();
        })
        right_handler.on("mouseleave",function(event){
            $("#panels_line").fadeOut();
        })
        right_handler.on("drag",{currentTracker:this}, function (event, ui) {
            if (ui.position.left < left_handler.position().left - $(this).width()) return false;

            var new_width = Math.round(ui.position.left - left_handler.position().left
            + left_handler.width());

            if (new_width > handlers.width()) {
                tracer.width(handlers.width());
            } else {
                tracer.width(new_width);
            }

               $("#panels_line").show();
            $("#panels_line").offset({left:tracer.offset().left+tracer.width()});
            console.log($("#panels_line").offset().left);
            
            _jumpTo((ui.offset.left - handlers.offset().left + $(this).width()) / handlers.width() ,
                currentTracker,
                function () {
                    // var time = playerAPI.ready ? playerAPI.getTime() : playerAPI.getClip().duration;
                    // if (!time) time = 0;
                    var time= _getCurrentTime();
                    handlers.find("span.right_time").html((time).toString().toHHMMSS());
                    that.endTime = time;
                }
            );
            
        });
        left_handler.on("mouseenter",function(event){
           //  $("#panels_line").fadeIn();
           $("#panels_line").fadeIn();
        })
        left_handler.on("mouseleave",function(event){
            $("#panels_line").fadeOut();
        })
        left_handler.on("drag", function (event, ui) {
            if (ui.position.left > right_handler.position().left+$(this).width()) return false;
            
            tracer.width(Math.round(right_handler.position().left - ui.position.left + $(this).width()));
            tracer.offset({ top: null, left: Math.round(ui.offset.left + 0.5) });
            //console.log((ui.offset.left-20 - $(this).width()) / handlers.width() * 10);
            $("#panels_line").show();
            $("#panels_line").offset({left:tracer.offset().left});
            console.log($("#panels_line").offset().left);
            //console.log((ui.offset.left - handlers.offset().left) / handlers.width() );
            _jumpTo((ui.offset.left - handlers.offset().left) / handlers.width() ,
                currentTracker,
                function () {
                    // var time = playerAPI.ready ? playerAPI.video.time : 0;
                    //if (!time) time = 0;
                    var time= _getCurrentTime();
                    handlers.find("span.left_time").html((time).toString().toHHMMSS());
                    that.startTime = time;
                }
            );
        });
        
        
        delete_track.on("click", function (event) {
            event.preventDefault();
            //$(wrapper).contents.remove($($(this).attr('data-target')));
            var target_id = $(this).attr('data-target');
            $("#panel_" + target_id).remove();
            trackers.splice(target_id, 1);

        })
    }

    function _jumpTo(persence,currentTracker, callback){
        if(playerAPI.seekTo == undefined){
            playerAPI.seek(persence*playerAPI.getClip().duration);
            callback.call(currentTracker);
        }else{
            playerAPI.seekTo(time,callback);
        }
    }
    function _getCurrentTime(){
        return playerAPI.getTime();
    }



    Plugin.prototype.getCuepointsList = function () {
        var that = this;
        $.ajax({
            type: "GET",
            url: this.options.url,
            data: this.paramsData,
            // crossDomain:true,
            //dataType: "json",
            dataType:"xml",
            jsonp: false

        }).done(function (results) {
            console.log($(results).find("item").length);
            var cps = $(results).find("item");
            cps.each(function(index, el){
                that.options.cuepoints.push({
                    title:$(el).children("title").text(),
                    seekTime:$(el).children("seekTime").text()/1000
                });
                
            })
            console.log("success"+that.options.cuepoints);
            that.renderCuePoints();
        }).fail(function (jqXHR, textStatus, errorThrown) {
            // console.log(textStatus);
        });
        console.log(cuepoints);
    };





    (function () {
        String.prototype.toHHMMSS = function () {
            var sec_num = parseInt(this, 10); // don't forget the second parm
            var hours = Math.floor(sec_num / 3600);
            var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
            var seconds = sec_num - (hours * 3600) - (minutes * 60);
            var minseconds = Math.round((this - sec_num) * 10);
            if (hours < 10) { hours = "0" + hours; }
            if (minutes < 10) { minutes = "0" + minutes; }
            if (seconds < 10) { seconds = "0" + seconds; }
            //var time    = hours+':'+minutes+':'+seconds;
            var time = minutes + ':' + seconds + ':' + minseconds;
            return time;
        }
    })();

    // Closure
    (function () {

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
            Math.round10 = function (value, exp) {
                return decimalAdjust('round', value, exp);
            };
        }
        // Decimal floor
        if (!Math.floor10) {
            Math.floor10 = function (value, exp) {
                return decimalAdjust('floor', value, exp);
            };
        }
        // Decimal ceil
        if (!Math.ceil10) {
            Math.ceil10 = function (value, exp) {
                return decimalAdjust('ceil', value, exp);
            };
        }

    })();

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName,
                new Plugin(this, options));
            }
        });
    }

})(jQuery, window, document);
