var accessToken = "f52cfe54fd7f4c7a90cd187d915629b1";
var baseUrl = "https://api.api.ai/v1/";

var recognition;
var SpeechGrammarList;
var $userInputEl;
// https://drive.google.com/file/d/1trRg7ny-uINSBynubEJPlCyFUDS1pyTF/preview
$(document).ready(function() {
  $userInputEl = $("#input");

  $('#view-transcript').on('click', function() {
    $('#transcript').show();
  });

  $('#hide-transcript').on('click', function() {
    $('#transcript').hide();
  });

  $('#hide-transcript-bottom').on('click', function() {
    $('#transcript').hide();
  });

  $('#client-id-update-btn').on('click', function() {
    accessToken = $('#client-id-input').val();
    resetAll();
  });

  var fileInput = $('#fileInput');
  var fileDisplayArea = $('#fileDisplayArea');

  fileInput.on('change', function(e) {
    var file = fileInput[0].files[0];
    var textType = /text.*/;
    if (file.type.match(textType)) {
      var reader = new FileReader();
      reader.onload = function(e) {
        fileDisplayArea.html(reader.result);
      }
      reader.readAsText(file);
    } else {
      fileDisplayArea.html("File type not supported!");
    }
  });

  $userInputEl.keypress(function(event) {
    if (event.which == 13) {
      event.preventDefault();
      send();
    }
  });

  function formatDate(date) {
    var monthNames = [
      "January", "February", "March",
      "April", "May", "June", "July",
      "August", "September", "October",
      "November", "December"
    ];

    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();

    return day + ' ' + monthNames[monthIndex] + ' ' + year;
  }

  var dateInfo = formatDate(new Date());

  $('#day-info').html(dateInfo);

  $('body').keypress(function(event) {
    if (event.which == 32) {
      event.preventDefault();
      switchRecognition();
    }
  });

  $("#rec").click(function(event) {
    switchRecognition();
  });

  $('#start-button').on('click', function() {
    send("Hi");
    $(this).hide();
    $('#user-input-container').show();
  });

  $('#reset-button').on('click', function() {
    var confirm = window.confirm("This action will clear all the chat transcript and current progress. Are you sure?");
    if (confirm == true) {
        resetAll();
    }
  });
});

function resetAll() {
  $('#user-input-container').hide();
  $('#pdf-main-container').hide();
  $('#transcript').hide().find('.chat-item').remove();
  $('#start-button').show();
  clearFileInput($("#file-to-upload")[0]);
}

function startRecognition() {
  recognition = new webkitSpeechRecognition();
  SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;

  // Adding grammar
  var fillers = ["huh", "uh", "erm", "um", "well", "so", "like", "eh"];
  var grammar = '#JSGF V1.0; grammar fillers; public <filler> = ' + fillers.join(' | ') + ' ;'
  var speechRecognitionList = new SpeechGrammarList();
  speechRecognitionList.addFromString(grammar, 1);
  recognition.grammars = speechRecognitionList;
  // -- end grammar


  recognition.onstart = function(event) {
    updateRec();
  };

  recognition.onresult = function(event) {
    var text = "";
    for (var i = event.resultIndex; i < event.results.length; ++i) {
      text += event.results[i][0].transcript;
    }
    setInput(text);
    stopRecognition();
  };
  recognition.onend = function() {
    stopRecognition();
  };
  recognition.lang = "en-US";
  recognition.start();
}

function stopRecognition() {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
  updateRec();
}

function switchRecognition() {
  if (recognition) {
    stopRecognition();
  } else {
    startRecognition();
  }
}

function setParticipantInput(text) {
  var data = {
    "message": text
  };
  var html = tmpl("participant-template", data);
  $('#transcript').append(html);

}

function setInput(text) {
  $userInputEl.val(text);
  setTimeout(function() {
    $userInputEl.val('');
  }, 2000);
  setParticipantInput(text);
  send();
}


function clearFileInput(ctrl) {
  try {
    ctrl.value = null;
  } catch(ex) { }
  if (ctrl.value) {
    ctrl.parentNode.replaceChild(ctrl.cloneNode(true), ctrl);
  }
}

function updateRec() {
  $("#rec").text(recognition ? "Stop" : "Speak");
}

function send(txt) {
  var text = $userInputEl.val() || txt;
  $.ajax({
    type: "POST",
    url: baseUrl + "query?v=20150910",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    headers: {
      "Authorization": "Bearer " + accessToken
    },
    data: JSON.stringify({
      query: text,
      lang: "en",
      sessionId: "somerandomthing"
    }),

    success: function(data) {
      // console.log(data);
      setData(JSON.stringify(data, undefined, 2));
      response = data['result']['fulfillment']['speech']
      if (response == "") {
        response = data['result']['fulfillment']['messages'][1]['speech'];
      }
      setResponse(response);
      speakResponse(response);
    },
    error: function() {
      setResponse("Internal Server Error");
    }
  });
  setLoadingResponse("Loading...");
}

function setResponse(val) {
  $('#transcript').find(".loading").remove();
  var data = {
    "message": val
  };
  var html = tmpl("agent-template", data);
  $('#transcript').append(html);
  $("#response").text(val);
}

function setLoadingResponse(val) {
  var data = {
    "message": val,
    "loadingClass": "loading"
  };
  var html = tmpl("agent-template", data);
  $('#transcript').append(html);
}

function setData(val) {
  $("#data").text(val);
}
