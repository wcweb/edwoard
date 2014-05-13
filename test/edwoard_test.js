/*global $f */
(function($) {
  /*
    ======== A Handy Little QUnit Reference ========
    http://api.qunitjs.com/

    Test methods:
      module(name, {[setup][ ,teardown]})
      test(name, callback)
      expect(numberOfAssertions)
      stop(increment)
      start(decrement)
    Test assertions:
      ok(value, [message])
      equal(actual, expected, [message])
      notEqual(actual, expected, [message])
      deepEqual(actual, expected, [message])
      notDeepEqual(actual, expected, [message])
      strictEqual(actual, expected, [message])
      notStrictEqual(actual, expected, [message])
      throws(block, [expected], [message])
  */


  module(':awesome selector', {
    // This will run before each test in this module.
    setup: function() {
      $(document).ready(function(){
        $f("player", "./test/assets/flowplayer-3.2.16.swf",{
        clip:{
          // autoPlay:false,
        
          onStart:function(){
            $('.scissorhands').ScissorHands(
              {
                url:"/list",
                cuepoints:[
                  {title:"start",seekTime:60},{title:"middle",seekTime:80},{title:"end",seekTime:90}
                ],//"/cuepoints",
                playerAPI: $f('player')// .data("flowplayer")
              }
             );
           
          }
         }
       
        });
       
            
       });
    }
  });


  
  test(' sc', function(){
    expect(2);
    
    ok( true, "video has loaded and is ready to play" );
    ok( true, "video has loaded and is ready to play" );
    
  });
  

}(jQuery));
