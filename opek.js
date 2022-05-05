/* Displays results from IOF XML REST-based web-services
Author: Olav Kvittem
License: Anyone can use and modify it accordingto GPLv2
*/

/* using jquery to check i jquery fails fails ..
  if (! ($.support.ajax && $.support.boxModel )){
   alert ('Ajax and the Box model is not supported in your browser - please upgrade to a modern browser.');
}
*/

var debugging=false;
var my_events={};
var www_proxy='';  // proxy to your for requests (set by config)
var result_prefix; // active url prefix for getting results
var result_tail; // active url prefix for getting results
    var cur_class;
var class_object=[]; // object per Class by class name.
var last_rep=[];
var ut=''; // buffer for html
var fradato;
var tildato;

var kodetabell=[{}]; // codes per runner
var navnene=[], strekktider=[];
var tottid=[]; // secs per runner
var legtime=[]; // time used by leg
var runners;
var className;
var legsums=[]; 
var legdelta=[];
var urlParams;
var made_grafs=false;

var class_xml=[]; // list of class objects
var class_title=[]; // list of class titles
var coursevariation=[]; // list of cources controls
var courselength=[]; // length by courseid

var rapport=["oppsett", "eventstab", "klasser","resultat", "metwho"];
var resultattabs=["liste", "graf", "snitt", "tabell", "controls"];
var eventstabs=["events", "my_events"];
var venn=[];
venn["events"]=["eventshead"];
venn["graf"]=["grafer1", "grafer2", "grafer3", "grafer4", "grafer5", ];

var mettable;
var mettable_filter=''; // remember filter values
var mettable_filter_pers=''; // remember filter values for person

function debug_log ( msg){
    if(typeof(console) === 'undefined') { /* ie < 9 adaption */
	if ( debugging){
	    alert( msg );	
	}
    } else {
	console.log( msg );
    }
}


function findEventorEvents (baseurl, delurl, tittel){
    result_prefix = baseurl;
    var url =  baseurl + delurl;
    debug_log('Events url: ' + url);
//    flip_events('events', 'disable');
//    $( "#progressbar" ).progressbar({ value: 10 });
//    $('#events', document).html('<h2>' + tittel + '</h2>');
    $('#events', document).html('<table id=eventtable align=left>' + '<caption><b>' + tittel + '</b></caption>');
    $('#eventtable', document).append('<thead><tr><th  align=left style="width:12em">Løp<th align=left>Web<th align=left>Arrangert<th align=left>Resultater</thead><tbody>');
    getEventor( url, eatEventorEvent );  // ntok og stok er 11,15 hedmark og møre orgid : 7,9,
}


function eatEventorEvent (xml){
//    $(xml).find('EventList').each(function(){
	$(xml).find('Event').each(function(){
	    var event=$(this).children('EventId').text();
	    var name=$(this).children('Name').text();
	    var dato=$(this).children('StartDate').children('Date').text();
//	    var club=$(this).children('Organiser').children('Club').children('ShortName').text();
	    var weburl=$(this).children('WebURL').text();
	    var official_results=false;
	    var last_results='';
	    $(this).children('HashTableEntry').each( function(){ // way to check for results ?
		if ( $(this).children('Key').text().indexOf('officialResult') > -1 ){
		    official_results=true;
		    var dt=$(this).children('Value').text();
		    last_results = dt.slice( dt.indexOf('-') + 1,  dt.lastIndexOf(':') );		    
		}		  		    
	    });
	    if ( official_results ){
		var row= '<tr><td><button class=knapp  onclick=\'javascript:getClassesEventor("' + name + '" , "/results/event?eventId=' + event + '&includeSplitTimes=true")\'>' + name  + '</button>';
		if ( weburl != ""){
		    row += '<td>' + '<button class=knapp><a target=arr-web href="' + weburl + '">Web</a></button>';
		} else {
		    row += '<td>';
		}
		row += '<td>' + dato + '<td>' + last_results;
		$('#eventtable', document).append(row);
	    }

	    if ( !  my_events[name]){  my_events[name]={}; }
	    my_events[name].StartDate = dato; 
	    my_events[name].ModifyDate = last_results; 
	    my_events[name].WebURL = weburl;

	});
//    });

    $('#eventtable', document).append('</tbody></table>');
    $('#eventtable', document).dataTable({"bPaginate": false, "aaSorting": [[2,'desc']]});
//   $( "#progressbar" ).progressbar({ value: 100 });
    flip_events('events', 'enable');
    see_it('eventstab');
    see_event('events');
    
}

function getClassesEventor( tittel, url){
//      $( "#progressbar" ).progressbar({ value: 10 });
//    $('#klasser', document).html('<h2>' + tittel + '</h2>');
//<caption>'+tittel+'</caption>
    
    debug_log('result url: ' + result_prefix + url);
    $('#klasser', document).html('<table id=classtable border=1 align=left><thead><th>'+tittel+'</thead><tbody>');
    getEventor( result_prefix + url, getClasses ) ;
    see_it('klasser');
//    $( "#progressbar" ).progressbar({ value: 100 });

}

function getEventor (url, eat_func){
    var api= url;
    $.support.cors = true;
    debug_log('Eventor url: ' + url);

    $.ajax({url: 'eventor.php?method=GET&url=' + encodeURIComponent(url), 
            type: 'GET',
	    crossDomain: true, // xhrFields: { withCredentials: true }, 
	    error: function(  jqXHR,  textStatus,  errorThrown ){
		debug_log('ajax error for url ' + jqXHR.getAllResponseHeaders() + ' : ' + textStatus + ' : ' + errorThrown + ' : ' + jqXHR);
	    },
	    success: eat_func

    });
}


function findSiteEvents( site){
    if ( false && site.proxy){
	findEventorEvents(site.events,  '&fromDate=' + $('#fradato').val() + '&toDate=' + $('#tildato').val(), site.title);
    } else {
	findBrikkesys( site.events + '&fromDate=' + $('#fradato').val() + '&toDate=' + $('#tildato').val(), site.title, site.results, site.results_tail, site.proxy);
    }
    
}


function getXML(resurl, eat_func, eat_parm){

    var proxy = www_proxy || 'cross-domain.php?method=get&url=';
	
    $.support.cors = true;
    console.log ('Ajax url: ' + proxy + encodeURIComponent(resurl));
    $.ajax({url: proxy + encodeURIComponent(resurl) ,
//    $.ajax({url: resurl ,
            type: 'GET',
	    crossDomain: true, // xhrFields: { withCredentials: true }, 
	    error: function(  jqXHR,  textStatus,  errorThrown ){
		debug_log('ajax error for url ' + resurl + ' : ' + textStatus + ' : ' + errorThrown + ' : ' + jqXHR);
	    },
	    success: function(data){ eat_func(data, eat_parm); }
//	    success: eat_func
    });
}

function findBrikkesys(url, tittel, res_prefix, res_tail, proxy){
    www_proxy = proxy; //global
 
    if ( res_prefix){ 
	result_prefix = res_prefix;
    } else { 
	result_prefix = 'http://brikkesys.no/iof-results30.php?download=true&id='
    }
    if ( res_tail) {result_tail = res_tail} else {result_tail=''};
    debug_log('event url: ' + url);
//    flip_events('events', 'disable');

    $('#events', document).html('<table id=eventtable border=1 align=left><caption><b>' + tittel + '</b></caption>');
    $('#eventtable', document).append('<thead><tr><th  style="width:12em">Løp<th align=left>Web<th align=left>Arrangert<th align=left>Resultater</thead><tbody>');

    getXML( url, eatEventBrikkesys);
}


function eatEventBrikkesys(xml){
//    $(xml).find('EventList').each(function(){
//	var official_results= $(this).attr('status') == 'complete';
			
    $(xml).find('Event').each( function(){
	if ( $(this).children('EventRace').length > 0 ){
	    var name=$(this).children('Name').text();
	    $(this).children('EventRace').each( function(){
		registerEvent(this, name);
	    });
	} else { // brikkesys
	    registerEvent(this);
	}
    });
//    });
    $('#eventtable', document).append('</tbody></table>');
    $('#eventtable', document).dataTable( {"aaSorting": [[2,'desc']], "bPaginate": false });
    flip_events('events', 'enable');
    see_it('eventstab');
    see_event('events');

}


function registerEvent(eventobj, prefix){  // eventobj is event or eventRace
    var event=$(eventobj).children('EventId').text();
    var raceid= $(eventobj).children('EventRaceId').text();

    var name = $(eventobj).children('ShortName').text() || $(eventobj).children('Name').text();
    if ( prefix && name != "") name = prefix + ' - ' + name; 
    if ( name == "") name=prefix;

    var dato= $(eventobj).children('StartDate').children('Date').text() 
	|| $(eventobj).children('StartDate').text()
	|| $(eventobj).children('RaceDate').children('Date').text()
	|| $(eventobj).children('RaceDate').text();
    var weburl=$(eventobj).children('WebURL').text();
    var dt='ingen', last_results;

	
    if ( $(eventobj).children('ModifyDate') ){
	    if ( $(eventobj).children('ModifyDate').children('Date').text()){
		dt = $(eventobj).children('ModifyDate').children('Date').text() + ' ' +  $(eventobj).children('ModifyDate').children('Clock').text()
	    } else {
		dt = $(eventobj).children('ModifyDate').text(); // brikkesys
	    }
    } else {
	    if ( $(eventobj).children('AlternativeDates') ){
		dt = $(eventobj).children('AlternativeDates').children('Date').text() + ' ' + $(eventobj).children('AlternativeDates').children('Clock').text();
	    } else {
		// dt=dato;
	    }
    }
    last_results = dt.slice( dt.indexOf('-') + 1,  dt.lastIndexOf(':') );
    
  
    var race='';
    if (raceid) race = ', ' + raceid;
    var row='<tr><td><button  class=knapp onclick=\'javascript:findClasses("' + name + '" , "' + result_prefix + event + result_tail +'"'  + race + ')\'>' + name  + '</button>';
    if ( weburl != ""){
	row += '<td>' + '<button class=knapp><a target=arr-web href="' + weburl + '">Web</a></button>';
    } else {
	row += '<td>';
    }
    row += '<td>' + dato + '<td>' + last_results;
    //	    debug_log(row);
    $('#eventtable', document).append( row);

    if ( !  my_events[name]){  my_events[name]={}; }
    //	    my_events[name]={ 'StartDate': dato, 'ModifyDate': dt, 'WebURL': weburl };
    my_events[name].StartDate = dato; 
    my_events[name].ModifyDate = dt; 
    my_events[name].WebURL = weburl;
}


function findClasses( tittel, url, raceid){
     flip_it('klasser', 'disable');
     flip_it('metwho', 'disable');
     debug_log('result url: ' + url);
     $("#metwho").html('<button class=liten_knapp onclick=javascript:met_who(' + raceid + ')>Lag : Hvem traff jeg på posten !</button>');
    getXML(url, getClasses, raceid);
}

function getClasses(xml, raceid) {
    class_xml=[];
    var tittel=eatClasses(xml, raceid);
    // store the event
    
    if ( !  my_events[tittel]){  my_events[tittel]={}; }
    my_events[tittel].xml = xml;

    var my_string=JSON.stringify(my_events);
    try {
	localStorage.my_events = my_string;  // QuotaExceededError ?
    } catch (QuotaExceededError){
	alert ('QuotaExceededError - lokalt lager overskredt. Nullstill lager under Løp->Lagret eller utvid kvoten i innstillinger');
    }

    show_my_events(my_events);
}

function eatClasses(xml, raceid){
    var tittel;
    $(xml).find('Event').each(function(){
	tittel=$(this).children('ShortName').text();
	if ( tittel.length < 1){
	    tittel=$(this).children('Name').text();
	}	    
	if ( !  my_events[tittel]){  my_events[tittel]={}; }
	my_events[tittel].StartDate = $(this).children('StartDate').text();
	my_events[tittel].ModifyDate = $(this).children('ModifyDate').text();
	my_events[tittel].WebURL = $(this).children('WebUrl').text();

    });	    

    $(xml).find('Course').each(function(){
	var id=$(this).children('CourseId').text();
	var coursevarid=0;
	var name=$(this).children('CourseName').text();
	var lth=0;
	$(this).children('CourseVariation').each( function(){
	    lth=$(this).children('CourseLength').text();
	    var variant=[];
	    $(this).children('CourseControl').each( function(){
//		variant[ $(this).children('Sequence').text() ] = $(this).children('ControlCode').text();
		variant=$(this).children('ControlCode').text();
	    });
	    coursevariation[id + '-' + coursevarid] = variant;
	    coursevarid++;
	});
	courselength[id]=lth;
    }); 


    $('#klasser', document).html('<table id=classtable border=1 align=left><thead><th>'+tittel+'</thead><tbody>');

    var cno=0;
    $(xml).find('ClassResult').each(function(classresult){
	// if ( $(this).children('EventRace')  // limit classes to raceid
	if ( $(this).children('PersonResult').length > 0  ){
	    cno++;
	    butt1= 'class' + cno;
	    var cname=$(this).children('ClassShortName').text() // brikkesys
		|| $(this).children('EventClass').children('ClassShortName').text() // eventor
		|| $(this).children('Class').children('Name').text() // html 3.0

	    $('#classtable', document).append('<tr><td><button class=knapp  id=' + butt1 + '>' + cname + '</button>');
	    // need two level closure to capture the current value of this ..
	    class_object[cname]=this;
 	    $("#"+butt1).click( function(her){ return function(){make_it(her, raceid); see_it('resultat') } }(this) ); 

	    class_xml.push(this);
	    class_title.push(cname);
	}
    });

    $('#classtable', document).append('</tbody></table>');
    $('#classtable', document).dataTable({
	"bPaginate": false,
	"fnDrawCallback": function(){ // higlight row under mouse
	    $('table#classtable td').bind('mouseenter', function () { $(this).parent().children().each(function(){$(this).addClass('datatablerowhighlight');}); });
	    $('table#classtable td').bind('mouseleave', function () { $(this).parent().children().each(function(){$(this).removeClass('datatablerowhighlight');}); });
	}

    });

    flip_it('klasser', 'enable');
    $("#metwho").html('<button class=liten_knapp onclick=javascript:met_who(' + raceid + ')>Lag : Hvem traff jeg på posten!</button>');
    flip_it('metwho', 'enable');
    see_it('klasser');
    return tittel;
}


function show_my_events(my_events){
//    var my_events = localStorage['my_events'];
    var ut='<table id=my_events_table border=1><thead><th>Løp<th>Web<th>Arrangert<th>Resultater</thead><tbody>';
    for ( name in my_events){
	if ( my_events[name] &&  my_events[name].xml){  
	    ut += '<tr><td><button class=liten_knapp onclick=\'javascript:eatClasses(my_events["'+ name + '"].xml)\'>'
		+ name + '</button>';
	    if(my_events[name].WebURL){
		ut += '<td><button class=liten_knapp><a target=arr-web href="'  + my_events[name].WebURL + '">Web</a></button>';
	    } else {
		ut += '<td>na';
	    }
	    ut += '<td>' + my_events[name].StartDate;
	    ut += '<td>' +my_events[name].ModifyDate;
	}

    }
    ut+='</tbody></table>';
    $('#my_events').html(ut);
    $('#my_events_table', document).dataTable( {"aaSorting": [[2,'desc']], "bPaginate": false });
    $('#my_events_table_filter').append(' <button class=liten_knapp onclick=\'javascript:my_events={}; localStorage.my_events=my_events; show_my_events(my_events);\' title=\'Slett lagrede data\'>Nullstill lager</button>');
}


function controls_table( myclass, raceid){
    var nr=0;

    var ut ='<table id=controlstable class=display border=1>';
    ut += '<caption><b>' + $(myclass).find('ClassShortName').text() + '</b></caption>';
    ut += '<thead><tr><th>Nr<th>Navn<th>Sluttid';
    var maxcols=0; 
    var ncols=[]; 
    var rows=[];

    
    $(myclass).find('PersonResult').each(function(){
	nr++; // runner no
	var row=[];
	var family = $(this).find('Family').text();
	var given =  $(this).find('Given').text();
	var myut = '<tr><td>' + nr + ' <td align=left>' + family + ', ' + given;
	var status='';

	var keepon=true; 
	var motherofresult=this;

	$(this).children('RaceResult').each( function(){
	    motherofresult=this;
	    $(this).children('EventRace').each( function(){
		if ($(this).children('EventRaceId').text() == raceid){
		    keepon=false;  // continue until found Raceresult for raceid
		}
		return keepon;
	    });
	    return keepon;
	});

	$(motherofresult).children('Result').each(function(){
	    var tottid, ttid, startsek;
	    tottid=$(this).children('Time').text();
	    if ( tottid.indexOf(':') < 0){
			tottid = secs2hhmmss( tottid ); // iof 3.0
	    }
	    startsek=hhmmss2ss( $(this).children('StartTime').children('Clock').text() ) ;
	    status = $(this).children('Status').text() // iof 3.0
		|| $(this).children('CompetitorStatus').text();
	    if ( ! status ){
		status = $(this).children('CompetitorStatus').attr('value'); 
	    }
//	    if (!status) status="OK";
	    myut += '<td>' + tottid ;
	    var ntid=0;
	    var cseq=0;
	    var plass=0;
	    
	    $(this).children('SplitTime').each(function(){
		cseq++;
		if ($(this).attr('sequence')){
		    plass = parseInt( $(this).attr('sequence') );
		} else {
		    plass = cseq;
		}
		var tid=$(this).children('Time').text();
		var code=$(this).children('ControlCode').text();

		if ( tid.length > 0 && plass > 0 && code.length > 0){
		    var secs= hhmmss2ss(tid);
		    var ms = secs2mmss(secs);
		    myut += '<td>' +code + '<br> ' + ms;
		    if ( nr === 1){ // only first runner
			ut += '<td>' + plass;
		    }
		    ntid++;
//		    debug_log( 'passering ' + code + ' ' + (startsek+secs) );
		}
//		debug_log('ms ' + tid + ' ' + ms);
	    });


	    if ( status && status.indexOf("Arrang") ){
		ncols[nr]=ntid;
		rows[nr]=myut;
		maxcols = Math.max( maxcols, ntid);
	    } else {
		ntid--; nr--;
	    }
	    return false; // only first Result
	});
    });

    rows[0]=ut; 
    ncols[0]=ncols[1]; // first runner
    ut='';
    for ( runner = 0; runner <= nr; runner++ ){ // fill up table rows for datatables
	for (var col=ncols[runner]; col < maxcols; col++){
	    rows[runner] += '<td>&nbsp;';
	}
    }
    rows[0] += '</thead><tbody>'; 

   for ( runner = 0; runner <= nr; runner++ ){ 
	ut+=rows[runner];
   }    
    ut+='</tbody></table>';
       
    $('#controls', document).html( ut );	
    $('#controlstable', document).dataTable( {
	"aaSorting": [], "bPaginate": false, /*, "bSort": false*/ 
	"fnDrawCallback": function(){ // higlight row under mouse
	    $('table#controlstable td').bind('mouseenter', function () { $(this).parent().children().each(function(){$(this).addClass('datatablerowhighlight');}); });
	    $('table#controlstable td').bind('mouseleave', function () { $(this).parent().children().each(function(){$(this).removeClass('datatablerowhighlight');}); });
	}

}); // contains emtpy cells and can't be sorted
//	$('#controls', document).text(ut + myut);	

}

function secs2mmss(secs){
    var ss=(secs%60).toString();
    if (ss.length==1){
	ss = '0' + ss;
    }
    var mm=Math.floor( secs/60).toString();
    if (mm.length==1){
	mm = '0' + mm;
    }
    return mm + ':' + ss;  // mm:ss
}

function secs2hhmmss(secs){
    var ss = Math.floor( secs % 60 ).toString();
    var mm = (Math.floor( secs / 60 ) % 60).toString();
    var hh = Math.floor( secs / 3600 ).toString();
    if (ss.length==1){
	ss = '0' + ss;
    }
    if (mm.length==1){
	mm = '0' + mm;
    }
   if (hh.length==1){
	hh = '0' + hh;
    }

    return hh + ':' + mm + ':' + ss;  // mm:ss
}


function hhmmss2mm(tid){
    var hms=tid.split(':');
    var mm= parseInt(hms[0],10) * 60 + parseInt(hms[1],10); 
    var ms= mm.toString() + "." + hms[2];
    return ms;
}

function hhmmss2ss(tid){
    var secs=0;
    var hms=[];
    if (tid.length > 0) {
	if (tid.indexOf("T") > 0 ){ // 2016-09-06T18:09:03
	    var t2=tid.split('T');
	    hms=t2[1].split(':'); // 18:09:03
	} else { // 18:09:03
	    hms=tid.split(':'); 
	}
	while (hms.length < 3){ hms.unshift('00')}; // mm:ss -> hh:mm:ss
	var secs=parseInt(hms[0],10) * 3600 + parseInt(hms[1],10)*60 + parseInt(hms[2],10);
    }
    return secs;
}

function tegn(myclass, raceid) {
    var tider=[]; // strekktider array 
    var tidsekv=[];
    navnene=[], strekktider=[];
    var beste=[], vinner=[], snitt=[];
    var koder=[]; // control codes
    kodetabell=[{}]; // codes per runner
    var npost=[];
    tottid=[]; // secs per runner
    var offtid=[]; // hhmmss
    var plassnr=[];
    className=$(myclass).find('ClassShortName').text();
    made_grafs=false;

 
    var nr=0;
    runners=0;

    var resut ='<table id=restabell border=1 align=left>';
    resut += '<caption><b>' + className + '</b></caption>';
    resut += '<thead><tr><th style="width:3em">Nr<th class=tab_navn style="width:15em">Navn<th>Sluttid<th>Min/Km<th>Status</thead><tbody>';

    var coursetxt =  courselength[ $(myclass).children('CourseId').text() ] || $(myclass).children('Course').children('Length').text() || '0' ;
    var courselth = parseInt( coursetxt );

    $(myclass).find('PersonResult').each( function(){
 	var vinnertider=[]; 
	var plass, status;
	var navn= $(this).find('Family').text() + ', ' + $(this).find('Given').text();

	var racefound=true; 
	var motherofresult=this; // Just Result for Brikkesys

	$(this).children('RaceResult').each( function(){ // eventor 
	    racefound=false;
	    motherofresult=this;
	    $(this).children('EventRace').each( function(){ // multtirace events
		if ($(this).children('EventRaceId').text() == raceid){
		    racefound=true;  // continue until found Raceresult for raceid
		}
		return ! racefound;
	    });
	    return ! racefound;
	});

	if (racefound){
	$(motherofresult).children('Result').each(function(){
//	$(this).children('Result').each( function(){
	    $(this).children('Time').each(function(){
		if ($(this).text()){
		    var t = $(this).text();
		    if ( t.indexOf(':') < 0){
			offtid[nr] = secs2hhmmss( t ); // iof 3.0
		    } else {
			offtid[nr] = t;
		    }
		} else {
		    offtid[nr] = "99:00:00";
		}
		tottid[nr] = hhmmss2ss( offtid[nr] );
		return false; // want first total time
	    });
	    plass=$(this).children('ResultPosition').text() || $(this).children('Position').text() || 999;
	    status = $(this).children('Status').text()   // iof 3.0
		|| $(this).children('CompetitorStatus').text()
		||  $(this).children('CompetitorStatus').attr('value');

	    var kmtid=0;
	    if ( courselth <= 0  && $(this).children('Course').children('Length')){ // per person
		courselth= parseInt( $(this).children('Course').children('Length').text());
	    }
	    if ( courselth > 0){
		kmtid = tottid[nr] / 60 * 1000 / courselth;
	    } 

//	    if (  status && ( status.indexOf("Arrang") === -1 ) ){
		resut += '<tr><td>' + plass + '<td>'+ navn + '<td>'+ offtid[nr]  + '<td align=right>' + kmtid.toFixed(2) + '<td>' + status;
//	    }
	    var rcode=["0"];
	    var rtime=[0];
	    var stime=[0];
	    var postno=0;
	    var pkode='';

	    $(this).children('SplitTime').each(function(){
		if ( ! ( $(this).attr('status') == "Missing") ){
		    var tid=$(this).children('Time').text();
		    var kode=$(this).children('ControlCode').text();
		    if ( tid.length > 0 && kode.length > 0 ){
			if ( kode != "99" && kode != pkode ){
			    postno++;
			    stime[postno]=hhmmss2ss(tid);
			    rcode[postno]=kode;
			    pkode=kode;
			} else {
			    console.log("utelatt kode"+ kode + " for " + navn);
			}
		    }
		}
	    });
	    if ( stime.length > 1 && ( status.indexOf('OK') >= 0 ) ){
		tidsekv[nr]=stime;
		kodetabell[nr]=rcode;
		npost[nr]=postno;
		runners=nr+1;
		plassnr[nr]=plass;
		navnene.push(navn);
		nr++;
	    }
	    
	});
//	nr++;
	}
    });	

    resut+='</tbody></table>'; 
    $('#lister').html(resut);
    var restabell=$('#restabell').dataTable( {
	"aaSorting": [[0, 'asc']], "bPaginate": false, bsortCellsTop: true,
	"fnDrawCallback": function(){ // higlight row under mouse
	    $('table#restabell td').bind('mouseenter', function () { $(this).parent().children().each(function(){$(this).addClass('datatablerowhighlight');}); });
	    $('table#restabell td').bind('mouseleave', function () { $(this).parent().children().each(function(){$(this).removeClass('datatablerowhighlight');}); });
	}, 
	"sDom": '<"H"Tfr>t<"F"ip>',
	"oTableTools": {
	    "sRowSelect": "multi",
	    "aButtons": [ 
		{   "sExtends":    "text", "sButtonText": "Grafer",
                    "fnClick": function ( nButton, oConfig, oFlash ) {
                        tegn_selected( restabell, 'restabell', navnene, tider, legdelta, legsums); }
		},
		"select_all", "select_none" , "csv",
	    ]
	}

 
    } );
    flip_it('resultat','enable');
    see_it('resultat'); // start å se med en gang
 
    // choose first runner with median length as best estimate

    var model_nr; // number of model track
    var models=[]; // set of unique approved legs
    var modelstring=[]; // array of controls strings
    debug_log('før ' + npost.length + ' npost ' + npost) ;
    // 99 battery check killed median Math.floor(runners/e);
    var npost_med = Math.min.apply(Math, npost);
    for ( var i=0; i < runners; i++){
	if (npost[i] === npost_med){  // beste som har riktig antall poster
	    var legstring= kodetabell[i].toString();
	    if ( modelstring.indexOf( legstring) < 0){ // new leg sequence
		var koder = kodetabell[i].slice();  // copy the array to let it be changed
		models.push(koder);
		modelstring.push(legstring);

		debug_log('model nr ' + (i+1) + ' - ' + navnene[i]);
		debug_log('koder ' + koder.length + ': ' + koder);
		debug_log('antall poster ' + npost_med + ' npost ' + npost) ;
	    }
	}
    }
    // remove 99 bad battery from etime
    for ( var variant=0; variant < models.length; variant++){
	var koder= models[variant];
	while ( koder.indexOf("99") >= 0 ){
	    koder.splice( koder.indexOf("99"), 1);
	}
	while ( koder.indexOf("254") >= 0 ){ // brikkeleser
	    koder.splice( koder.indexOf("254"), 1);
	}
	modelstring[variant]=koder.toString();
	debug_log('koder netto ' + koder.length + ': ' + koder);

/* cheat - remove undefined controls
	var undefs=[];
	for ( leg in koder){
	    if(! koder[leg]) undefs.push(leg);
	}
	for ( leg in undefs){
	    koder.splice( leg, 1);
	    console.log ('Undefined leg i koder: '+ leg);
	}
*/
    }


    // define legal legs
    var okleg=[];
    var legids=[];
     
    for ( var variant=0; variant < models.length; variant++){
	okleg[variant]=[];
	legids[variant]=[];
	for ( var leg = 0; leg < (models[variant].length-1); leg++){
	    var legid= models[variant][leg] + '-' + models[variant][leg+1];
	    okleg[variant][legid] = true;
	    legids[variant][leg] = legid;
	    //	to_leg[leg+1]=leg_id;
	}
    }


   // define legs and compute leg time 
   // find next  controls from model legs 

   legtime=[]; // time used by leg
   var legvariant=[]; // course variant by runner
   for ( var runner=0; runner < runners; runner++){
       if (kodetabell[runner]){
	   for ( var variant=0; variant < models.length; variant++){
	       var mylegtime=[]; var nok=0;

	       for ( var leg = 0; leg < (tidsekv[runner].length);){
		   // search for next valid control
		   var newleg=-1; 
		   for ( var next = leg+1; next < (tidsekv[runner].length); next++){
		       var legid = kodetabell[runner][leg] + '-' + kodetabell[runner][next];
		       if ( okleg[variant][legid] ){
			   mylegtime[legid] = tidsekv[runner][next] - tidsekv[runner][leg] ;
			   newleg=next;
			   nok++;
			   break;
		       } else { 
			   var nextlegid= kodetabell[runner][next] + '-' + kodetabell[runner][next+1];
			   if ( okleg[variant][nextlegid] && kodetabell[runner][next] != '99'
			       && kodetabell[runner][next] != '99' ) { 
			       // assume horisontal fork = different controls
			       var legt =  tidsekv[runner][next] - tidsekv[runner][leg] ;
			       if ( legt > 0 ) {
				   mylegtime[legids[variant][leg]] = legt;
				   newleg=next;
				   nok++;
				   break;				   
			       }
			   } else { // ignore unknown controls
			       ;
			   }
		       }
		   }
		   if ( newleg >= 0){
		       leg = newleg;
		   } else {
		       leg++;
		   }
	       }
	       if ( nok == ( legids[variant].length ) ){
		   legtime[runner]=mylegtime;
		   legvariant[runner]=variant;
		   break; // exit variant loop
	       } // else legtime will be emty for this runner
	   }
       }
   }

 
    // make table  for legs
    var nrline='';

    var variant=0; 
    var koder = models[variant];
    var ctrline='<tr><td>' + '<th>Postkode<td>';
    if (models.length > 1) ctrline +=  '<td>' ;

    for ( var leg = 0; leg < (koder.length-1); leg++){
	nrline += '<th>' + (leg+1);
	ctrline += '<th>' + koder[leg+1];
    }

    var uts ='<table id=strekktabell border=1>';
    uts += '<caption><b>' + className + '</b></caption>';
    uts += '<thead><tr><th>Nr<th>Navn<th>Sluttid';
    if (models.length > 1) uts +=  '<td>Løype';
    uts += nrline + ctrline + '</thead><tbody>';

   // compute total time by control in model sequence (loops rolled out)

    for ( var runner=0; runner < runners; runner++){
       if (! kodetabell[runner] || ! legtime[runner] ){continue};
       uts +=  '<tr><td>' + plassnr[runner] + '<td>'+ navnene[runner] + '<td>'+ offtid[runner] ;
	if (models.length > 1) uts +=  '<td>' + (legvariant[runner] +1);

       var mylegsum=[]; mylegdelta=[];
       var legsum=0; // sum for each runner

       for ( var leg = 0; leg < (legids[legvariant[runner]].length); leg++){
	   var legid = legids[legvariant[runner]][leg];
	   if ( legtime[runner][legid]){
	       mylegdelta.push(legtime[runner][legid]);
	       uts +=  '<td>' + secs2mmss( legtime[runner][legid] );
	       legsum+=legtime[runner][legid];
	       mylegsum.push(legsum);
	   } else {
	        uts +=  '<td>' + '99:00';
	       debug_log('undefined leg ' + legid + ' for '  + navnene[runner] + ' leg ' + leg + ' id ' + legid);
	   }
       }
       
       legsums[runner]=mylegsum;
       legdelta[runner]=mylegdelta;
   }
    uts+='</tbody></table>';
    $('#tabell').html(uts);

    var strekktabell=$('#strekktabell').dataTable( { 
	"bPaginate": false, bSortCellsTop: true, 
	"fnDrawCallback": function(){ // higlight row under mouse
	    $('table#strekktabell td').bind('mouseenter', function () { $(this).parent().children().each(function(){$(this).addClass('datatablerowhighlight');}); });
	    $('table#strekktabell td').bind('mouseleave', function () { $(this).parent().children().each(function(){$(this).removeClass('datatablerowhighlight');}); });
	}, 
	"sDom": '<"H"Tfr>t<"F"ip>',
	"oTableTools": {
	    "sRowSelect": "multi",
	    "aButtons": [ 
		{   "sExtends":    "text", "sButtonText": "Grafer",
                    "fnClick": function ( nButton, oConfig, oFlash ) {
                        tegn_selected( strekktabell, 'strekktabell', navnene, tider, legdelta, legsums); }
		},
		"select_all", "select_none" , "csv"
	    ]
	}

    } );  

    // button for coloring the strekktabell

    $('#strekktabell_filter').append(' <button class=liten_knapp onclick=\'javascript: color_strekk("strekktabell", legdelta, leg_best(legdelta), $("#percent_after").val());\' title=\'Fargelegg hvor mye etter beste\'>Fargelegg</button>');
    $('#strekktabell_filter').append('<select id=percent_after><option value=0>0%</option><option value=10>10%</option><option value=20>20%</option><option value=30>30%</option></select> etter.');

    $('#strekktabell_filter').append(' <button class=liten_knapp onclick=\'javascript: color_medals("strekktabell", legdelta, leg_best(legdelta) );\' title=\'Fargelegg med medaljefarger\'>Medaljer</button>');

    $('#strekktabell_filter').append(' <button class=liten_knapp onclick=\'javascript: color_reset( );\' title=\'Fjern spesielle farger\'>Reset farger</button>');



/*
    $('td', strekktabell.fnGetNodes()).hover( function() {
	var iCol = $('td').index(this) % (legids.length + 3);
	var nTrs = strekktabell.fnGetNodes();
	$('td:nth-child('+(iCol+1)+')', nTrs).addClass( 'highlighted' );
    }, function() {
	$('td.highlighted', strektabell.fnGetNodes()).removeClass('highlighted');
    } );
*/
/*
    // compute differences
    for ( var runner=0; runner < runners; runner++){
      if (! kodetabell[runner]){break};
 	var tet_diff=[]; tet_diff.push([0,0]); 
	for ( var leg=0; leg < (koder.length-1); leg++){
	    if ( legsums[runner][leg]){ // skip missing contols
		var diff = tet[leg] - legsums[runner][leg];
		tet_diff.push( [ tet[leg]/60, diff/60] );
	    } else {
		debug_log('missing legsums for runner : ' + navnene[runner] + ' and leg ' + leg);
	    }
	}
	tider.push ( {name: (runner+1) + ' ' + navnene[runner], data:tet_diff} );
//	debug_log(tet_diff);
    }
*/
//    leg_band = make_band(tet);
//ok testing removal graph
}

// make all graphs for a class

function make_graf_all (){
    var sumtid=0, ntid=0, runner, next=0, grafno=1;
    for (runner=0; runner < runners; runner++){
	if (! kodetabell[runner] /* || ! legtime[runner] */ ){return};

 	sumtid+=tottid[runner]; ntid++;

//	if ( (ntid > 10) || ( ( ntid > 2 ) && ((sumtid/ntid*1.2) < tottid[runner]) && (runner+2) < runners ) ){  // break up if next runner to distant	
	if ( ntid > 10 || runner == (runners-1) ){  // break up if next runner to distant

	    make_graf( className, legdelta.slice( next, runner+1), legsums.slice( next,runner+1), 
		       navnene.slice( next, runner+1), grafno, next);

	    next = runner; // take two on next page
	    ntid=1; sumtid=tottid[runner];
	    grafno++;  
	    
	}
//	time_slice.push( tider[runner] );
    }
}

// compare arrays

Array.prototype.compare = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (var i = 0; i < this.length; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].compare(array[i]))
                return false;
        }
        else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}

// accumulate array values
function sum_array( arr){
    var sums=[arr[0]];
    for (var i=1; i < arr.length; i++){
	sums[i] = sums[i-1] + arr[i];
    }	
    return sums;
}

function plukk_array(arr, plukk){
    var plukket=[];
    for ( var i=0; i < plukk.length; i++ ){
	plukket.push( arr[plukk[i]]);
    }
    return plukket;
}

function make_band(x_leg){
    // make bands for legs	   
    var leg_band=[];
    for ( var leg=0; leg < (x_leg.length-1); leg++){
	if( ((leg+1)%2) == 1 ){ // band every second leg
	    leg_band.push({from: x_leg[leg]/60, to: x_leg[leg+1]/60 , label:{text:leg+2, verticalAlign: 'middle'}, color: '#FCFFC5'});	
	}
    }
    return leg_band;
}


function leg_median( leg_delta){
    var median=[];
    for ( var leg=0; leg < leg_delta[0].length; leg ++){
	var leg_time=[];
	for ( var runner=0; runner < leg_delta.length; runner++){
	    if (leg_delta[runner]){
		leg_time.push(leg_delta[runner][leg]);
	    }
	}
	leg_time.sort();
	median[leg] = leg_time[ Math.floor(leg_time.length/2)];
    }
    return median;
}

function leg_best( leg_delta){
    var best=[];
    for ( var leg=0; leg < leg_delta[0].length; leg ++){
	var leg_time=[];
	for ( var runner=0; runner < leg_delta.length; runner++){
	    if (leg_delta[runner]){
		if ( best[leg]){
		    best[leg]=Math.min( best[leg], leg_delta[runner][leg]);
		} else {
		    best[leg] =  leg_delta[runner][leg];
		}
	    }
	}
    }
    return best;
}

function leg_tet(legsums){
    var my_tet=[];

    if ( legsums.length > 0 ){
	for ( var leg=0; leg < legsums[0].length; leg ++){
	    for ( var runner=0; runner < legsums.length; runner++){
		if (legsums[runner]){
		    if ( my_tet[leg]){
			my_tet[leg]=Math.min(my_tet[leg], legsums[runner][leg] );
		    } else {
			my_tet[leg]=  legsums[runner][leg];
		    }
		}
	    }
	}
    } 
    return my_tet;
}

function make_series(next, leg_sum, x_leg, navnene){
    var median_tider=[];

    // y-coordinates
    for ( var runner=0; runner < leg_sum.length; runner++){
	if (leg_sum[runner]){
	    var series=[0];
	    for ( var leg=0; leg < x_leg.length; leg ++){
		series.push([ x_leg[leg] / 60,  ( x_leg[leg] - leg_sum[runner][leg] ) / 60 ]);
	    }
	    median_tider.push( { name: (next+runner+1) + ' ' + navnene[runner], data: series} );
	}
    }
    return median_tider;
    
}

// this function  is not used integrated in tegn
function strekk_tabell ( tittel, delta, koder, navnene){
    var ut ='<table border=0>';
    ut += '<caption><b>' + tittel + '</b></caption>';
    ut += '<tr><th>Nr<th>Navn<th>Sluttid<th>Status';

    for (var runner=0; runner < runners; runner++){
	for ( var leg=0; leg < (koder.length-1); leg++){
	    ut += '<tr><td>' + plass + '<th>'+ navn + '<th>'+ tid ;

	}
    }
}

function color_strekk(tabell, legdelta, best, percent){
//    var best=leg_best(legdelta);
    $('.strekkvinner').removeClass('strekkvinner');
    for (var runner=0; runner < legdelta.length; runner++){
	for ( var leg=0; leg < (legdelta[0].length); leg++){
	    if ( legdelta[runner][leg] <= (best[leg]*(100+parseInt(percent))/100)){
		$('#' + tabell + ' tbody tr:nth-of-type(' + (runner+1) + ') td:nth-of-type(' + (leg+4) +')' ).addClass('strekkvinner');
	    }
	}
    }
}

var medals=["gold", "silver", "bronze"];

function color_medals( tabell, legdelta, best){
    var legplace=[];
 
    for ( medal in medals){ $('.' + medal).removeClass(medal); } // nullstill

    for ( var leg=0; leg < (legdelta[0].length); leg++){
	var runners=[];
	for (var runner=0; runner < legdelta.length; runner++){
	    runners.push(runner);
	}
	// sort runners 
	runners.sort( function(a,b){ return legdelta[a][leg] - legdelta[b][leg];});
	for ( place=0; place < Math.min(legdelta.length, 3); place++){
	    var selector='#' + tabell + ' tbody tr:nth-of-type(' + (runners[place]+1) + ') td:nth-of-type(' + (leg+4) +')';
//	    debug_log( 'Selector: ' + selector );
	    $( selector ).addClass(medals[place]);
	}
    }
}

function color_reset(){
    for ( i in medals){ $('.' + medals[i]).removeClass(medals[i]); } // nullstill
    $('.strekkvinner').removeClass('strekkvinner');

}

function tegn_selected(tabell, tabellid, navnene, tider, legdelta, legsums){
    var plukk=[];
    var stab = TableTools.fnGetInstance( tabellid );
    var selected=stab.fnGetSelected();
    if (selected.length <= 0){
	stab.fnSelectAll();
	selected=stab.fnGetSelected();
    }
    $.each( selected, function (index, item) {
        var rowValues = tabell.fnGetData(item);
 	plukk.push( parseInt(rowValues[0]) - 1);
    });
    var grafno=1;
    var klasse=$( '#' + tabellid + ' caption').text();
  
    $('[id^=grafer]').html(''); // blank them
    $('[id^=snitter]').html(''); // blank them
    $('[id^=bester]').html(''); // blank them

    var d_navn = plukk_array(navnene, plukk);
    var d_legdelta = plukk_array( legdelta, plukk);
    var d_legsums = plukk_array( legsums, plukk);

    make_graf( klasse, d_legdelta, d_legsums, d_navn, grafno, 0 );
    see_results('snitt');


//    debug_log('row column 0: ', + nrs);
}


function  make_graf( klasse, d_legdelta, d_legsums, d_navn, grafno, next){    

    if ( d_legdelta.length > 0 && d_legsums.length > 0){
	var tet = leg_tet( d_legsums);
	var tet_band= make_band( tet );
	var tet_series = make_series( next, d_legsums, tet, d_navn);
	tegn_graf( 'grafer', klasse, 'etter tet', tet_series, tet_band, grafno, tooltip_format_tet);

	
	var median = leg_median( d_legdelta );
	var median_sum = sum_array( median );
	var snitt_band = make_band( median_sum );
	tegn_graf( 'snitter', klasse, 'snitt',  
		   make_series( next, d_legsums, median_sum,  d_navn ), 
		   snitt_band, grafno, tooltip_format_snitt );

	var best = leg_best( d_legdelta );
	var best_sum = sum_array( best );
	var best_band = make_band( best_sum );
	tegn_graf( 'bester', klasse, 'best',  
		   make_series( next, d_legsums, best_sum,  d_navn ), 
		   best_band, grafno, tooltip_format_snitt );
    } else {
	debug_log("Make_graf no data for " + klasse + " grafno " + grafno);
    }
}

var grafene=[];

function  tegn_graf( div, tittel, subtittel, tider, leg_band, grafno, tooltip_format){
    var divid=div+(grafno); 
    if ( $('#' + divid).length <= null ){
	$('#'+div).append('<div id=' + divid + '></div>');
	debug_log('div created: ' + divid );
    }
//   $.highcharts({
//   $('#graf').highcharts({
//   $('#graf'+grafno).highcharts({
    grafene[grafno] = new Highcharts.Chart({

	chart: {
	    renderTo : divid,
            type: 'line',
            marginLeft: 50,
            marginRight: 5,
            marginBottom: 40 
	},
	title: {
            text: tittel,
            x: -20 //center
	},
	subtitle: { 
            text: subtittel,
            x: -20
	},
	xAxis: { title : {text: 'Minutes'}, minorTickInterval : 'auto',
          plotBands: leg_band
        },
	yAxis: { //max: 0,
	    title: { text: 'Minutes'}, minorTickInterval : 'auto',
            plotLines: [{ value: 0, width: 2, color: '#808080' }]
	},
	tooltip: {
	    formatter: tooltip_format
			       
	},
	legend: { title:{ text: 'Velg løpere, hold over',itemStyle: {fontSize: '18px'} },
		  layout: 'vertical',
		  align: 'middle',
		  verticalAlign: 'bottom',
		  x: 30,y:-20,
		  borderWidth: 0,
		  itemStyle: {
//		      color: '#000000',
//		      fontWeight: 'bold',
		      paddingBottom: '2px',
		      fontSize: '14px'
		  }
	},
	plotOptions: { series: {marker: { enabled: false, states: { hover: { enabled: true}}}}},
	series: tider
    });
    $('#'+divid).show();
} // of tegn


function tooltip_format_tet(){
    return this.series.name + '<br> ' + secs2hhmmss( ( this.x + this.y) * 60 ) + ' <b> +'+ Highcharts.numberFormat(-this.y, 2) + '</b>';
}

function tooltip_format_snitt(){
    var sign='';
    if (this.y < 0){ sign = '+'};
    return this.series.name + '<br> ' + secs2hhmmss( (this.x - this.y) * 60 ) + ' <b>' + sign + Highcharts.numberFormat(-this.y, 2) + '</b>';
}


/* make a table over passings at controls
read all classes 
*/

function met_who(raceid){

//    if ( mettable){ /* remove data in table before repopulating */
/*	mettable.fnClearTable();
    }
*/
    $("#busy").show();
    $("#metwho").html('Vennligst vent mens vi går gjennom alle strekkene ! <img src=ajax-loader.gif>');

    var ut = '<table id=mettable border=1 align=left><caption><b>Hvem traff jeg på posten</b></caption>';
    ut +='<thead>';
//    ut +='<tr><th class=tab_velg style="width:3em;">Velg<th class=tab_post style="width:3em;">Post<th class=tab_tid>Tid<th class=tab_navn>Navn<th class=tab_klasse>Klasse';
    ut +='<tr><th class=tab_post style="width:3em;">Post<th class=tab_tid>Tid<th class=tab_navn>Navn<th class=tab_klasse>Klasse';

    var input_width=[3,3,6,12,6];
    var input_class=["s","s","m", "l", "m" ]; // small, medium, large
    var plh=["NA", "100|150", "18:2|18:3", "nilsen|sørensen", "55.*rød"];
    ut += '<tr>';
    for (i=1;i<plh.length;i++){ // skip nr 0
//	ut +='<th><input type=text class="search_init" placeholder=' + plh[i] + ' name=search_' + (i) + ' width=' + input_width[i] + 'em />';
//	ut +='<th><input type=text class="search_init" placeholder=' + plh[i] + ' name=search_' + (i) + ' />';
	ut +='<th><input type=text placeholder=' + plh[i] + ' name=search_' + (i) + ' class=input_' + input_class[i] + ' />';

    }

    ut +='</thead><tbody>';

    for ( i=0; i < class_xml.length; i++){
	$(class_xml[i]).find('PersonResult').each(function(){
	    var family = $(this).find('Family').text();
	    var given =  $(this).find('Given').text();
	    var name = family + ', ' + given;
	    var stamped = [];
	       
	    var racefound=true; 
	    var motherofresult=this; // Just Result for Brikkesys

	    $(this).children('RaceResult').each( function(){ // eventor 
		racefound=false;
		motherofresult=this;
		$(this).children('EventRace').each( function(){ // multtirace events
		    if ($(this).children('EventRaceId').text() == raceid){
			racefound=true;  // continue until found Raceresult for raceid
		    }
		    return ! racefound;
		});
		return ! racefound;
	    });

	    if (racefound){
		$(motherofresult).children('Result').each(function(){
		    //	    $(this).find('Result').each(function(){
		    var start_time=$(this).children('StartTime').children('Clock').text();
		    if ( start_time.length <= 1){
			var finish_time = $(this).children('FinishTime').children('Clock').text()
			    || $(this).children('FinishTime').text();
			var run_time = $(this).children('Time').text();
			var run_secs;
			if ( run_time.indexOf(':') > 0 ){
			    run_secs=hhmmss2ss(run_time);
			} else {
			    run_secs=parseInt(run_time);
			}
			if ( finish_time.length > 0 && run_secs > 0 ){
			    start_time = secs2hhmmss( hhmmss2ss( finish_time) - run_secs );
			}
		    }
		    if (start_time.length > 0){
			ut += emit_met_row( '00', start_time, name,  class_title[i]);
		    }
		    $(this).children('SplitTime').each(function(){
			var code=$(this).children('ControlCode').text();
			var tid=$(this).children('Time').text();
			var tids;
			if (tid.indexOf(':') < 0){ 
			    tids = parseInt(tid); // iof 3.0
			} else { 
			    tids=hhmmss2ss( tid );
			}
			if ( tid.length > 0 && code.length > 0){
			    var stampsec= hhmmss2ss( start_time ) + tids;
			    var stamp = secs2hhmmss( stampsec);
			    ut+=emit_met_row( code, stamp, name,  class_title[i]);
			}
		    });
		});
	    }
	});	
    }

    ut += '</tbody>';
//    ut += '<tfooter><th>Post<th>Tid<th>Navn<th>Klasse</tfooter>';
    ut += '</table>';
    $('#metwho').html(ut);

    mettable = $('#mettable').dataTable( { 
	"aaSorting": [ [1,'asc'] ], 
        "bRegex": false, bSmart : true,
	"oLanguage": { "sSearch": "Søk "}, // flere kolonner
	"bJQueryUI": true,
	"bPaginate": true,
	"aLengthMenu": [10,100,10000],
	"iDisplayLength": 100,
	"sDom": '<"H"flrp>t<"F"ip>',  // without filter
        "bSortCellsTop": true  ,
	"bAutoWidth": false ,
	"fnDrawCallback": function(){ // higlight row under mouse
	    $('table#mettable td').bind('mouseenter', function () { $(this).parent().children().each(function(){$(this).addClass('datatablerowhighlight');}); });
	    $('table#mettable td').bind('mouseleave', function () { $(this).parent().children().each(function(){$(this).removeClass('datatablerowhighlight');}); });
	}, 
	"aoColumnDefs": [{ "sType": 'num-html', "aTargets": [0]}] 
        /* ,
	"aoColumnDefs": [
	  { "sWidth": "60px", "aTargets": [0,1] },
	  { "sWidth": "100px", "aTargets": [2,4] },
	  { "sWidth": "200px", "aTargets": [3] }
	] */
    }); // .fnSettings().oPreviousSearch.bEscapeRegex = false;

    $('#mettable_filter').append('F.eks: 18:0 nilsen hvit.');
//    $('#mettable_filter input').attr( "placeholder", 'nilsen hvit');
    $('#mettable_filter').append(' <button class=liten_knapp onclick=\'javascript:met_filter_reset();\' title=\'Returnerer til søket\'>Nullstill post</button>');


//    $('#mettable_filter').append('<label>Avansert filter<input id="metfilter"  type="text" width=200px/>Bruk "|" for å skille. Eks: ( navn1|navn2)</label>');
//    $('#metfilter').keyup( function() { mettable.fnFilter( $('#metfilter').val(), null, true, false, false); } );
//    $('#mettable_filter').keyup( function() { mettable.fnFilter( $('#mettable_filter').val(), null, true); } );
//   mettable.fnSettings().oPreviousSearch.bEscapeRegex = false;
//    mettable.fnFilter( '44', 0 );
    
	$("thead input").keyup( function () {
		/* Filter on the column (the index) of this element */
	    mettable.fnFilter( this.value, $("thead input").index(this) , true );
	} );
	
		
	/*
	 * Support functions to provide a little bit of 'user friendlyness' to the textboxes in 
	 * the footer
	 */

 /*       var asInitVals = new Array();

	$("thead input").each( function (i) {
		asInitVals[i] = this.value;
	} );
	
	$("thead input").focus( function () {
		if ( this.className == "search_init" )
		{
			this.className = "";
			this.value = "";
		}
	} );
	
	$("thead input").blur( function (i) {
		if ( this.value == "" )
		{
			this.className = "search_init";
			this.value = asInitVals[$("thead input").index(this)];
		}
	} );
*/

    $("#busy").hide();

}

// make row for mettable
function emit_met_row( code, stamp, name, class_name){

/*    if ( code.length < 3){
	code = "0" + code;
    }
*/
    var klikk = 'onclick=\'javascript:met_filter(' + code + ', "' + stamp + '");\'';
    var href = 'javascript:met_filter(' + code + ', "' + stamp + '");';
//			klikk='';
//			ut += '<tr><td ' + klikk + '>Post' + '<td>' + code + '<td>'  + stamp + '<td>' + name + '<td>' + class_title[i];
//    var ut = '<tr><td ' + '><a href=\'' + href + '\'>Post</a>' + '<td>' + code + '<td>'  + stamp + '<td>' + name + '<td>' + class_name;
    var ut = '<tr>' + '<td>' + '<a href=\'' + href + '\'>' + code + '</a><td>'  + stamp + '<td>' + name + '<td>' + class_name;
//			ut += '<tr><td><button ' + klikk + '>Post<td>'  + code + '</button><td>'  + stamp + '<td>' + name + '<td>' + class_title[i];
    return ut;
}


// reset post_filter
function met_filter_reset(){
    mettable.fnFilter("",0,true);
    mettable.fnFilter("",1,true)
    if ( mettable_filter_pers){
	mettable.fnFilter(mettable_filter_pers,2,true, false, true)
    }
    if ( mettable_filter ){
	mettable.fnFilter(mettable_filter, null, false, true, true); // get back old filter and show it
    }
}

function met_filter( ctrl, hhmmss){
    mettable_filter=$('#mettable_filter input').val();
    mettable_filter_pers=$('#search_3 input').val();
    var tfilt='', cfilt='';
    if (hhmmss){
	var ts=hhmmss2ss(hhmmss);
	var t1=ts-10*60;
	var t2=ts+10*60;
	var tfilt = hhmmss.substring(0, hhmmss.indexOf(':')+2) // hh:m
	    + '|' + secs2hhmmss(t1).substring(0, hhmmss.indexOf(':')+2)
	    + '|' + secs2hhmmss(t1).substring(0, hhmmss.indexOf(':')+2);
    }

    mettable.fnFilter(''); // reset global searches
    mettable.fnFilter( '', 2); // reset person field
    mettable.fnFilter( ctrl, 0, true, false, true);
    mettable.fnFilter( tfilt, 1, true, false, true);   
}

function extend_jquery_datatable (){
    
    jQuery.extend( jQuery.fn.dataTableExt.oSort, {
	"num-html-pre": function ( a ) {
	    var x = String(a).replace( /<[\s\S]*?>/g, "" );
	    return parseFloat( x );
	},
	
	"num-html-asc": function ( a, b ) {
	    return ((a < b) ? -1 : ((a > b) ? 1 : 0));
	},
	
	"num-html-desc": function ( a, b ) {
	    return ((a < b) ? 1 : ((a > b) ? -1 : 0));
	}
    } );
    
    jQuery.extend( jQuery.fn.dataTableExt.oSort, {
	"hhmmss-pre": function ( a ) {
	    var hms=tid.split(':');
	    while (hms.length < 3){ hms.unshift('00')}; // mm:ss -> hh:mm:ss
	    var secs=parseInt(hms[0],10) * 3600 + parseInt(hms[1],10)*60 + parseInt(hms[2],10); 
	    return secs;
	},
	
	"hhmmss-asc": function ( a, b ) {
	    return ((a < b) ? -1 : ((a > b) ? 1 : 0));
	},
	
	"hhmmss-desc": function ( a, b ) {
	    return ((a < b) ? 1 : ((a > b) ? -1 : 0));
	}
    } );
    
}


function tomin(hhmmss){
    
}


function see_it(it){
    $('#tabs').tabs({ active: rapport.indexOf(it) });
}

function see_event(it){
    $('#eventtabs').tabs({ active: eventstabs.indexOf(it) });
}

function flip_it(it, what){
    $('#tabs').tabs( what, rapport.indexOf(it) );
}

function flip_events(it, what){
    $('#eventtabs').tabs( what, eventstabs.indexOf(it) );
}

function flip_results(it, what){
    $('#resultat').tabs( what, resultattabs.indexOf(it) );
}

function see_results(it){
    $('#resultat').tabs({ active: resultattabs.indexOf(it)-1 });
}

function see_div(it){
    for (var i=0; i < rapport.length; i++){
	if ( it === rapport[i]){
	    $('#'+rapport[i]).show();
	    if ( venn[rapport[i]]){
		for (var j=0; j < venn[rapport[i]].length; j++){
		    $('#'+venn[rapport[i]][j]).show();
		}
	    }	    
	} else {	    
	    $('#'+rapport[i]).hide();
	    if ( venn[rapport[i]]){
		for (var j=0; j < venn[rapport[i]].length; j++){
		    $('#'+venn[rapport[i]][j]).hide();
		}
	    }	    
	}
    }	
}

function make_it(myclass, raceid){
    tider=[];
// not needed ?
//    $('#resultatnavn').html( '<b>' + $(myclass).children('ClassShortName').text() + '</b>' );
    $('[id^=grafer]').html(''); // blank them
    $('[id^=snitter]').html(''); // blank them
    $('[id^=bester]').html(''); // blank them
    $('[id^=tabell]').html(''); // blank them
    controls_table(myclass, raceid);
    tegn(myclass, raceid); 
//    $("#progressbar").progressbar("disable");
    $( "#resultat" ).tabs( {active: 0}  );
//    see_results('lister');
//    $('#resultat').tabs( 'select', '0');
}


/*(does not work)
// type to search 
$(function(){
    $('#velgklasse').change( function(text, obj) {
//	    $('.velger').hide();
	    $(".velger:not(:contains('text'))").hide();
    });
});
*/

function hide_class(text){
//    $(".velger:not(:contains('text'))").hide();
    $("li.velger").hide();
}



function yymmdd(date){
    return date.getFullYear() + '-' + ( "0" + (date.getMonth() + 1)).slice(-2) + '-' + ("0" + date.getDate()).slice(-2);
}


function hhmmss(date){
    return ( "0" + date.getHours()).slice(-2) + '-' + ( "0" + (date.getMinutes() + 1)).slice(-2) + '-' + ("0" + date.getSeconds()).slice(-2);
}

function stringify_array(arr){
    var stringa={};
    for ( elem in arr){
	stringa[elem]=JSON.stringify(arr[elem]);
    }
    return JSON.stringify(stringa);
}

function parse_array(arrstring){
    var obj=[];
    var stringa = JSON.parse(arrstring);
    for ( elem in stringa){
	obj[elem] = JSON.parse(stringa[elem]);
    }
    return obj;
}

// reading the list of sources and make a menu

var my_sites=[];
function get_sources (sources){ // sources is a json-file
    var html='<table border=1 id=kildetable> ';
    var json=$.getJSON(sources);
    json.done( function(sites){
	my_sites=sites;
	$.each( sites, function(site){
	    html+='<tr><th align=left><button class=knapp  onclick="javascript:findSiteEvents(my_sites['+ site + ']);">' + sites[site].title+'</button><td>' + sites[site].description;
	});
	html+='</table>';
	$("#oppsettlop").html(html);
    });
    json.fail(function( jqXHR, status, error){
            console.log(status+error+sources);
    });

}

// to be called from embedding <div id=opek>opek_init();</div>

function opek_init(){

    $.get("opek-mal.html", function(data){
	$('#opek').append(data);
	opek_setup();
    }, 'html' );
    if ( urlParams.init){
	get_sources( urlParams.init );
    } else {
	get_sources('opek-kilde.json');
    }
}

// needs to be after ajax get above completes
function opek_setup(){

    $("#busy").hide();
    $.ajaxSetup({
	beforeSend:function(){ $("#busy").show();},
	complete:function(){ $("#busy").hide();}
    });

    $( "#fradato" ).datepicker({ dateFormat: "yy-mm-dd", defaultDate: -91, firstDay: 1  });
    $( "#tildato" ).datepicker({ dateFormat: "yy-mm-dd", defaultDate: +1, firstDay: 1  });

    var fra=new Date();
    fra.setDate(fra.getDate()-91);
    $("#fradato").val(yymmdd(fra));

    var til=new Date();
    til.setDate(til.getDate()+1);
    $("#tildato").val(yymmdd(til));
    $("#ui-datepicker-div").hide();

    $(function() {
	$('.date-picker').datepicker( {
	    dateFormat: 'yy-mm-dd',
	    onSelect: function(dateText, inst) { 
		$(this).value(dateText);
		//	    document.getElementById("#tildato").value=dateText;
	    }
	})
    })



    // default datatables setting
    $.extend( $.fn.dataTable.defaults, {
	"bJQueryUI": true
    });
    extend_jquery_datatable();

/*
    for (var i=1; i < 20; i++){
	$('#graf').append('<div id=grafer' + i + '></div>');
    }
    $('#grafer1').append('<h2>Velg klasse</h2>');
    for (var i=1; i < 20; i++){
	$('#snitt').append('<div id=snitter' + i + '></div>');
    }
    $('#snitter1').append('<h2>Velg klasse</h2>');
*/

    $('#eventstab').tabs();

    if ( ! my_events){
	my_events={}
    }

    if( typeof(Storage) === "undefined" ){
	debug_log('No support for localStorage');
    } else {
	if (localStorage.my_events){
	    var my_events_string=localStorage.my_events;
	    try { my_events=JSON.parse(my_events_string);
		} catch (SyntaxError) { my_events={};}
	    if ( typeof( my_events === "object")){
		show_my_events(my_events);
	    } else {
		my_events={};
	    }
	}
//	    my_events = parse_array(localStorage.my_events);
	localStorage.test = 'Dette virker';
	debug_log('Local storage: ' + localStorage.test);
    }

    $( "#tabs" ).tabs({active:0}, "option", "show", { effect: "blind", duration: 800 } );
    $( "#dok" ).tabs({active:0}, "option", "show", { effect: "blind", duration: 800 } );

    if ( urlParams.result){
	findClasses( '' , urlParams.result );
    
	if ( urlParams.class){
	    make_it( '' , class_object[urlParams.class] );
	}
    }

    flip_it('eventstab', 'enable');
    flip_it('events', 'disable');
    flip_it('my_events', 'enable');

    flip_it('klasser', 'disable');
    flip_it('resultat', 'disable');
    flip_it('metwho', 'disable');

    $("#tabs").on("click","a.tab1", function(){
	console.log("selected tab id: " + $(this).attr("href"));
	//	console.log("selected tab name: " + $(this).find("span").text());
	id= $(this).attr("href");
	if ( id === "#metwho" && ! mettable){
	    met_who(); 
	}
    });
    $("#resultat").on("click","a.tab1", function(){
	console.log("selected tab id: " + $(this).attr("href"));
	//	console.log("selected tab name: " + $(this).find("span").text());
	id= $(this).attr("href");
	if ( id === "#snitter" || id === "#grafer"  || id === "#bester"){
	    if ( ! made_grafs){
		make_graf_all();
		made_grafs=true;
	    }
	}
    });

//   $("#tab_oppsett").tooltip({ content :'Velg kilde for liste over løp'});


}


$(document).ready( function(){

 /* get url parameteres*/ 

(window.onpopstate = function () {
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    urlParams = {};
    while (match = search.exec(query))
       urlParams[decode(match[1])] = decode(match[2]);
})();

    window.onbeforeunload = function() { return "Vil du forlate Opek?"; };

   opek_init();
//    $('#oppsett').append('min-width: ' + $('#oppsett').style.minWidth + 'max-width: ' +  $('#oppsett').style.maxWidth);
//    $('#oppsett').append('min-height: ' + $('#oppsett').style.minHeight + 'max-height: ' +  $('#oppsett').style.maxHeight);

});

