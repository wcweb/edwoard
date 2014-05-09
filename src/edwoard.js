/*
 * Edwoard
 *
 *
 * Copyright (c) 2014 Chan9ry.ian
 * Licensed under the MIT license.
 */

(function($) {

  (function() {
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
    cuepoints = [],
    colors = ["#fcfcfc", "#fcfcfc"],
    //tracker={start:time,end:time,id:id}

    defaults = {
      url: '',
      paramsData: ''
    },
    contorl_panel_template = tmpl(
      '<div id="content_panel"><div id="panel_cues" class="panel"><div class="rail_cues" id="rail_cues"> </div></div><div id="trackers"></div><div id="panels_line" ' + ' style="display:none;"></div></div><div class="control_panel" id=control_panel><p><div class="btn-group' + ' dropup"><button type="button" class="btn btn-default add_track"  id=add_track><span class="">增加轨道</span></button><button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown"><span class="caret"></span><span' + ' class="sr-only">Toggle Dropdown</span> </button><ul class="dropdown-menu add_track_cuepoints_content" id="add_track_cuepoints_content" ></ul></div>' + '<a id=finish_button class="finnish_button btn btn-default" href="#">完成截取</a></p><p><span class="output_codeline">等待截取...</span></p></div>'
    ),
    cuepoints_templeate = tmpl(
      '<% for(var key in cuepoints){ %>' +
      '<a class="cue" style="left:<%= cuepoints[key]["position"]%>px; background:<%= cuepoints[key]["color"]%>;" title=" <%= cuepoints[key]["title"] %> | <%= cuepoints[key].seekTime.toString().toHHMMSS() %>" ><p class=""></p></a>' +
      '<% } %>'
    ),
    cuepoints_list_template = tmpl(
      '<% for(var key in cuepoints){ %>' +
      '<li><a class="add_track_by_cue" title=" <%= cuepoints[key]["title"] %> | <%= cuepoints[key].seekTime.toString().toHHMMSS() %>" id="cue_<%= key %>" data-cue-start="<%=cuepoints[key]["start"]%>" data-cue-end="<%=cuepoints[key]["end"]%>"><p class=""><%= cuepoints[key]["title"] %></p></a></li>' +
      '<% } %>'
    ),
    track_template = tmpl(
      '<div id="panel_<%= id %>" class="panel"><div id="rails_<%= id %>" class="rails"></div><div id="tracer_<%= id %>" class="tracer" style="width: <%= clip_width %>px; left: <%= clip_left %>px;" ></div><div id="handler_<%= id %>" class="handler"><a class="right_handler " ></a><a class="left_handler " ></a></div><p class="count_timer"><span class="clip_name"><%= clip_name %>:  </span><span class = ""> <a href="#" class="delete_track" data-target="<%= id %>">删除 </a></span><span class="left_time"><%= clip_start %></span><span> - </span><span class="right_time"><%= clip_end %></span></p></div>'
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
    this.cuepoints = this.getCuepointsList();


  }

  Plugin.prototype.init = function() {
    // Place initialization logic here
    // You already have access to the DOM element and
    // the options via the instance, e.g. this.element
    // and this.options
    $(this.element).contents().remove();

    $(this.element).append($(contorl_panel_template({})));

    //var start_clip = this.addTrack('片头'),
    //    end_clip = this.addTrack('片尾'),
    var init_one = this.addTrack(),
      that = this;


    // control panel intrativities
    $("#add_track").click(function(e) {
      e.preventDefault();
      var new_one = that.addTrack();
    });
    
    
    $("#finish_button").click(function(e) {
      e.preventDefault();
      var trackers = that.trackers.slice(0),
        output_string = '';

      trackers = reOrder(trackers, "startTime");

      output_string += "0B,";
      for (var x = 0; x <= trackers.length - 1; x++) {
        output_string += Math.round(trackers[x].startTime) + "-" + Math.round(trackers[x].endTime) + ",";
      }
      output_string += "0A";
      $(".output_codeline").html(output_string);
      $("input[name='Cutout']").val(output_string);
    })
    
    
    // playerAPI.on
    
    // 
    $(document).on('click','.add_track_by_cue',function(e){

      e.preventDefault();
      var name = $(e.target).parent().attr('title');

      var start = $(e.target).parent().attr('data-cue-start');
      var end = $(e.target).parent().attr('data-cue-end');
      var new_one = that.addTrack(name, start, end);
    })
    
  }

  function reOrder(arr, option) {
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

  function randomColor() {

    var bg_colour = Math.floor(Math.random() * 16777215).toString(16)
    bg_colour = "#" + ("000000" + bg_colour).slice(-6)
    return bg_colour;

  }
  Plugin.prototype.renderCuePoints = function() {
    cuepoints = this.options.cuepoints;
    cuepoints = reOrder(cuepoints, "seekTime");

    for (var i=cuepoints.length-1; i>=0 ; i--) {

      var totalLen = _getDuration();

      if (totalLen > 0) {
        cuepoints[i].position = cuepoints[i].seekTime * $(".rails").width() / totalLen;
      } else {
        cuepoints[i].position = 0;
      }
      cuepoints[i].color = randomColor();
      cuepoints[i].start = cuepoints[i].seekTime;
      if(i===cuepoints.length-1 ){
       cuepoints[i].end = totalLen;
     }else{
       cuepoints[i].end = cuepoints[i+1].start;
     }
    }
    
    
    $(this.element).find("#rail_cues").contents().remove();

    $(this.element).find("#rail_cues").append(
      $(cuepoints_templeate({
        cuepoints: cuepoints
      })));

    $(this.element).find("#add_track_cuepoints_content").append(
      $(cuepoints_list_template({
        cuepoints: cuepoints
      })));


  }

  Plugin.prototype.addTrack = function(name,start,end) {
    var trackers = this.trackers,
      trackers_sum = this.trackers_sum;
    if (!name) name = '片段 ' + trackers_sum;
    
    console.log(name, start, end);
    
    var new_one = new tracker(trackers_sum, this, name,start, end);
    currentTracker = new_one;
    trackers.push(new_one);

    $(this.element).children("#content_panel").children("#trackers").prepend(new_one.html());

    new_one.genneratEvent();

    this.trackers_sum += 1;

    return new_one;
  }


  function tracker(id, root, name, start, end) {
    this.id = id;

    this.startTime = start ? start : 0;

    
    this.endTime = end ? end : _getDuration();
    this.root = root;
    this.name = name;
  }

  tracker.prototype.duration = function() {
    return {
      startTime: this.startTime,
      endTime: this.endTime
    };
  }
  tracker.prototype.html = function() {
    
    var width = $('.rails').width();
    var left =0;
    
    if(this.startTime){
      left = (this.startTime)*width/_getDuration();
      width = (this.endTime-this.startTime)*width/_getDuration();
      
    }
    
    
    
    return $(track_template({
      'id': this.id,
      'clip_name': this.name,
      'clip_width': width,
      'clip_left': left,
      'clip_start': this.startTime.toString().toHHMMSS(),
      'clip_end': this.endTime.toString().toHHMMSS()
    }));
  }

  tracker.prototype.genneratEvent = function() {
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

    handlers.width(tracer.parent().width())
      .height(tracer.height())

      .css("position", "absolute")
      .css("z-index", "1002");

    var orgin_stat_right = right_handler.offset().left;

    left_handler.draggable({
      cursor: "col-resize",
      containment: 'parent',
      axis: "x",
      refreshPositions: true
    });

    right_handler.draggable({
      cursor: "col-resize",
      containment: 'parent',
      axis: "x",
      refreshPositions: true
    });
    
    
    
    left_handler.offset(tracer.offset());
    var r = left_handler.offset().left+tracer.width()-right_handler.width();
    right_handler.offset({top:'0px', left:r});
    // handlers.width(tracer.width())
    //   .offset(tracer.offset())
    //right_handler.on("mouseenter", function (event) {
    //    //$("#panels_line").offset({ left: tracer.offset().left + tracer.width() });
    //    $("#panels_line").fadeIn();

    //})
    right_handler.on("mouseleave", function(event) {
      $("#panels_line").fadeOut();
    })
    right_handler.on("drag", {
      currentTracker: this
    }, function(event, ui) {
      if (ui.position.left < left_handler.position().left - $(this).width()) return false;

      var new_width = Math.round(ui.position.left - left_handler.position().left + left_handler.width());

      if (new_width > handlers.width()) {
        tracer.width(handlers.width());
      } else {
        tracer.width(new_width);
      }

      $("#panels_line").show();
      $("#panels_line").offset({
        left: tracer.offset().left + tracer.width()
      });


      _jumpTo((ui.offset.left - handlers.offset().left + $(this).width()) / handlers.width() * 10,
        currentTracker,
        function() {
          // var time = playerAPI.ready ? playerAPI.getTime() : playerAPI.getClip().duration;
          // if (!time) time = 0;
          var time = _getCurrentTime();
          console.log("left :"+ time);
          handlers.siblings('.count_timer').find("span.right_time").html((time).toString().toHHMMSS());
          that.endTime = time;
        }
      );

    });
    //left_handler.on("mouseenter", function (event) {
    //    //  $("#panels_line").fadeIn();
    //    //$("#panels_line").offset({ left: tracer.offset().left });
    //    $("#panels_line").fadeIn();
    //})
    left_handler.on("mouseleave", function(event) {
      $("#panels_line").fadeOut();
    })
    left_handler.on("drag", function(event, ui) {
      if (ui.position.left > right_handler.position().left + $(this).width()) return false;

      tracer.width(Math.round(right_handler.position().left - ui.position.left + $(this).width()));
      tracer.offset({
        top: null,
        left: Math.round(ui.offset.left + 0.5)
      });

      $("#panels_line").show();
      $("#panels_line").offset({
        left: tracer.offset().left
      });

      _jumpTo((ui.offset.left - handlers.offset().left) / handlers.width() * 10,
        currentTracker,
        function() {
          // var time = playerAPI.ready ? playerAPI.video.time : 0;
          //if (!time) time = 0;
          var time = _getCurrentTime();
          console.log("left :"+ time);
          if (time != null) {
            
            handlers.siblings('.count_timer').find("span.left_time").html((time).toString().toHHMMSS());
            that.startTime = time;
          }
        }
      );

    });


    delete_track.on("click", function(event) {
      event.preventDefault();
      //$(wrapper).contents.remove($($(this).attr('data-target')));
      var target_id = $(this).attr('data-target');
      $("#panel_" + target_id).remove();
      trackers.splice(target_id, 1);

    })
  }

  function _jumpTo(persence, currentTracker, callback) {
    if (playerAPI.seekTo == undefined) {
      playerAPI.seek(persence * _getDuration());
      callback.call(currentTracker);
    } else {
      playerAPI.seekTo(persence, callback);
    }
  }

  function _getCurrentTime() {
    // @TODO playerAPI.video???
    console.log(playerAPI.getTime());
    if(playerAPI){
      return playerAPI.getTime()|| -1;
      //return playerAPI.ready ? playerAPI.video.time : playerAPI.video.duration;
    }
    return -1;
    //return playerAPI.getTime();
  }

  function _getDuration() {


    if (playerAPI) {
      //return playerAPI.ready ? playerAPI.video.duration : -1;
      return playerAPI ? playerAPI.getClip().duration : 0;
    }
    return -1;

  }

  Plugin.prototype.getCuepointsList = function() {
    var that = this;
    if (this.options.url.constructor.name == "Array") {
      $(this.options.url).each(function(index) {
        $.ajax({
          type: "GET",
          url: that.options.url[index],
          data: that.paramsData,
          // crossDomain:true,
          //dataType: "json",
          dataType: "xml",
          jsonp: false

        }).done(function(results) {

          var cps = $(results).find("item");
          cps.each(function(index, el) {
            that.options.cuepoints.push({
              title: $(el).children("title").text(),
              seekTime: $(el).children("seekTime").text() / 1000
            });

          })

          that.renderCuePoints();
        }).fail(function(jqXHR, textStatus, errorThrown) {

        });
      });
    } else {

      $.ajax({
        type: "GET",
        url: this.options.url,
        data: this.paramsData,
        // crossDomain:true,
        //dataType: "json",
        dataType: "xml",
        jsonp: false

      }).done(function(results) {

        var cps = $(results).find("item");
        cps.each(function(index, el) {
          that.options.cuepoints.push({
            title: $(el).children("title").text(),
            seekTime: $(el).children("seekTime").text() / 1000
          });

        })

        that.renderCuePoints();
      }).fail(function(jqXHR, textStatus, errorThrown) {

      });
    }
  };





  (function() {
    String.prototype.toHHMMSS = function() {
      var sec_num = parseInt(this, 10); // don't forget the second parm
      var hours = Math.floor(sec_num / 3600);
      var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
      var seconds = sec_num - (hours * 3600) - (minutes * 60);
      var minseconds = Math.round((this - sec_num) * 10);
      if (hours < 10) {
        hours = "0" + hours;
      }
      if (minutes < 10) {
        minutes = "0" + minutes;
      }
      if (seconds < 10) {
        seconds = "0" + seconds;
      }
      //var time    = hours+':'+minutes+':'+seconds;
      var time = minutes + ':' + seconds + ':' + minseconds;
      return time;
    }
  })();

  // Closure
  (function() {

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

  $.fn[pluginName] = function(options) {
    return this.each(function() {
      if (!$.data(this, 'plugin_' + pluginName)) {
        $.data(this, 'plugin_' + pluginName,
          new Plugin(this, options));
      }
    });
  }





}(jQuery));
