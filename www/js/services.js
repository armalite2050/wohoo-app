angular.module('starter.services', [])

  .service('ContactService', function (localStorageService) {

    this.formatContact = function (contacts, country) {
      var contactsResult = [];
      angular.forEach(contacts, function (value) {
        var phoneNumbers = [];
        if (value.phoneNumbers != null) {
          angular.forEach(value.phoneNumbers, function (value1) {
            var number = value1;
            number.value = number.value.replace(/\s/g, '');
            if (number.value.indexOf('+') === -1) {
              if (number.value[0] == 0) {
                number.value = number.value.substr(1);
              }
              number.value = '+' + country.callingCodes[0] + number.value;
            }

            phoneNumbers.push(number);
          });
        }
        var obj = {};
        if (phoneNumbers.length) {
          obj.phone = phoneNumbers[0].value
        }
        if (value.name) {
          obj.name = value.name.formatted
        }
        contactsResult.push(obj)
      });

      console.log(contactsResult)

      return contactsResult;
    }

    this.searchContact = function (contact) {
      var users = localStorageService.get('userInfo').contacts;
      if (contact.phoneNumbers && contact.phoneNumbers.length) {
        for (var i = 0; i < users.length; i++) {
          for (var j = 0; j < users[i].users.length; j++) {
            if (users[i].users[j].phoneNumbers && users[i].users[j].phoneNumbers.length && users[i].users[j].phoneNumbers[0].value == contact.phoneNumbers[0].value) {
              return users[i].users[j]
            }
          }
        }
      }
      return contact;
    }
  })

  .directive('compile', ['$compile', function ($compile) {
    return function(scope, element, attrs) {
      scope.$watch(
        function(scope) {
          return scope.$eval(attrs.compile);
        },
        function(value) {
          element.html(value);
          $compile(element.contents())(scope);
        }
      )};
  }])

  .service('codeService', function () {
    // Define the string
    var string = 'viber-clone';
    var encodedString = btoa(string);
    this.decode = function (string) {
      return atob(string);
    };
  })

  .service('unixString', function () {
    this.uniqueString = function () {
      var text = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

      for (var i = 0; i < 8; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
    };
  })

  .directive('ionBottomSheetView', function() {
    return {
      restrict: 'E',
      compile: function(element) {
        element.addClass('bottom-sheet modal');
      }
    };
  })

  .directive('holdRecord', ['$document', '$ionicGesture', '$ionicPlatform', function($document, $ionicGesture, $ionicPlatform ) {
    return {
      link: function(scope, element, attr) {

        // start audio capture
        var src = 'recording_' + Math.round(new Date().getTime()/1000) + '.wav';
        var path;
        var audioRecording;
        document.addEventListener("deviceready", function () {
          if ($ionicPlatform.is('android')) {
            path = cordova.file.externalRootDirectory;
          } else if ($ionicPlatform.is('ios')) {
            path = cordova.file.tempDirectory;
          }
        }, false);


        var getFileBlob = function (url, cb) {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", url);
          xhr.responseType = "blob";
          xhr.addEventListener('load', function() {
            cb(xhr.response);
          });
          xhr.send();
        };

        var getFileObject = function(filePathOrUrl, cb) {
          getFileBlob(filePathOrUrl, function (blob) {
            cb(blob);
          });
        };

        function onSuccess() {
          getFileObject(path + src, function (fileObject) {
            scope.sendVoiceMessage(fileObject);
          });
          scope.updateRecording(false)
        }

        function onError(error) {
          scope.updateRecording(false)
          scope.$apply();
        }

        var holdGesture = $ionicGesture.on('hold', function () {
          audioRecording = new Media(src, onSuccess, onError);
          audioRecording.startRecord();
          scope.updateRecording(true);
          scope.$apply();
        }, element);

        var releaseGesture = $ionicGesture.on('release', function() {
          audioRecording.stopRecord();
        }, element);

        scope.$on('$destroy', function () {
          $ionicGesture.off(holdGesture, 'hold');
          $ionicGesture.off(releaseGesture, 'release');
        });
      }
    };
  }])

  .directive('voiceMessage', ['$document', '$ionicGesture', function() {
    return {
      scope: {
        link: '=link'
      },
      templateUrl: './templates/audio.html',
      link: function(scope, element, attr) {
        scope.percent = 0;
        scope.audio = {
          percent: 0,
          isStart: 1
        };
        var audio;
        scope.play = function () {
          audio = new Audio(scope.link);
          scope.audio.isStart = 3;

          audio.play();

          audio.onended = function () {
            scope.audio.isStart = 1;
            scope.$apply();
          };

          audio.onloadeddata = function () {
            scope.audio.isStart = 2;
          };

          // Gets audio file duration
          audio.addEventListener('timeupdate',function () {
            scope.audio.percent = audio.currentTime/audio.duration * 100 + '%';
            scope.$apply();
          })
        };

        scope.pause = function () {
          audio.pause();
          scope.audio.isStart = 1;
        };
      }
    };
  }])



