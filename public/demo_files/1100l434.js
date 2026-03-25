var tdetails=false;try{var pixel_key='_pz_clickref';function getUrlParam(name,url){var parameters=new RegExp('[\?&]'+name+'=([^&#]*)').exec(url);return parameters?decodeURI(parameters[1]):null;}
function getUrlSection(name,url){var sections=new RegExp('/'+name+':([^/?]*)').exec(url);return sections?decodeURI(sections[1]):null;}
function getCookie(name){var match=document.cookie.match(new RegExp('(^| )'+name+'=([^;]+)'));if(match)return match[2];}
function setCookie(name,value){var date=new Date();date.setFullYear(date.getFullYear()+1);var expires=";expires="+date.toUTCString();var domain=window.location.hostname.match(/^(?:.*?\.)?([a-zA-Z0-9\-_]{3,}\.(?:\w{2,8}|\w{2,4}\.\w{2,4}))$/)[1];document.cookie=name+"="+(value||"")+expires+";domain=."+domain+";path=/";}
var clickref=getUrlParam('clickref',window.location.href);if(clickref){localStorage[pixel_key]=clickref;setCookie(pixel_key,clickref);}
var pixel_element=document.querySelector("div[data-partnerize]")
if(pixel_element){var pixel_url=pixel_element.getAttribute('data-partnerize')
var stored_clickref=localStorage[pixel_key]||getCookie(pixel_key)
if(stored_clickref){var pixel_clickref=getUrlSection('clickref',pixel_url);if(pixel_clickref)
pixel_url=pixel_url.replace('/clickref:'+pixel_clickref,'');pixel_url+='/clickref:'+stored_clickref;}
var pixel_tmethod=getUrlSection('tmethod',pixel_url);if(!pixel_tmethod){pixel_url+='/tmethod:1';}
var pixel_tplatform=getUrlSection('tplatform',pixel_url);if(!pixel_tplatform){pixel_url+='/tplatform:3';}
var pixel_tdetails=getUrlSection('tdetails',pixel_url);if(!pixel_tdetails&&tdetails!==false){pixel_url+='/tdetails:'+tdetails;}
var pixel=document.createElement('img');pixel.src=pixel_url;pixel.style.display='none';pixel.onload=function(){document.body.removeChild(pixel);}
document.body.appendChild(pixel);}}
catch(e){}