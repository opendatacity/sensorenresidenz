
$(function() {
	$('#activator').click(function(){
	$('#overlay').fadeIn('fast',function(){
	$('#box').animate({'top':'5%'},500);
	});
	Clock.pause();
});

$('#close').click(function(){
	$('#box').animate({'top':'-1000px'},500,function(){
	$('#overlay').fadeOut('fast');
	Clock.start();
		});
	});

});	