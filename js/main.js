var accessToken = "0e7068a854c74fb9899811e05665257e";
var baseUrl = "https://api.api.ai/v1/";

$(document).ready(function() {
  var keysdown = {};
  $("#input").keypress(function(event) {
    if (event.which == 13) {
      event.preventDefault();
      send();
    }
  });

  // $('body').keydown(function(event) {
  //   // Do we already know it's down?
  //   if (keysdown[event.which]) {
  //     // Ignore it
  //     return;
  //   }
  //
  //   // Remember it's down
  //   keysdown[event.which] = true;
  //
  //   console.log("down: " + event.which);
  //   if (event.which == 32) {
  //     event.preventDefault();
  //     switchRecognition();
  //   }
  // });
  // $('body').keyup(function(event) {
  //   if (event.which == 32) {
  //     event.preventDefault();
  //     delete keysdown[event.which];
  //     switchRecognition();
  //   }
  // });

  $('body').keypress(function(event) {
    if (event.which == 32) {
      event.preventDefault();
      switchRecognition();
    }
  });

  $("#rec").click(function(event) {
    switchRecognition();
  });
});

var recognition;
var SpeechGrammarList;

function startRecognition() {
  recognition = new webkitSpeechRecognition();
  SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList


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
  $("#input").val(text);
  setParticipantInput(text);
  send();
}

function updateRec() {
  $("#rec").text(recognition ? "Stop" : "Speak");
}

function send() {
  var text = $("#input").val();
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
      setData(JSON.stringify(data, undefined, 2));
      response = data['result']['fulfillment']['speech']
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
