"use strict";

angular.module('starter.controllers', [])

  .controller('LoginCtrl', function ($scope, $ionicModal, $http, $location, $ionicScrollDelegate, config, $ionicLoading, $ionicPlatform, $state, localStorageService, ContactService, $ionicPopup) {

    $scope.data = {
      user: {}
    };

    $ionicModal.fromTemplateUrl('./templates/modals/country.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modal = modal;
    });

    $scope.openModal = function () {
      $scope.modal.show();
    };

    $scope.closeModal = function () {
      $scope.modal.hide();
    };

    $scope.selectCountry = function (country) {
      $scope.data.country = country;
      localStorageService.set('country', $scope.data.country);
      $scope.closeModal();
    };

    $scope.goTo = function (id) {
      $location.hash('group-' + id);
      $ionicScrollDelegate.anchorScroll();
    };

    $scope.login = function () {
      if ($scope.data.country) {
        var user = angular.copy($scope.data.user);
        user.country = $scope.data.country;
        user.contacts = ContactService.formatContact(user.contacts, $scope.data.country);
        user.phone = user.phone.replace(/\s/g, '');
        if (user.phone[0] == 0) {
          user.phone = user.phone.substr(1);
        }
        user.phone = '+' + $scope.data.country.callingCodes[0] + user.phone;
        if (user.contacts) {
          $ionicLoading.show();
          $http.post(config.url + config.api.login, user).then(function successCallback(response) {
            //localStorageService.set('user', response.data);
            localStorageService.set('verifyUser', response.data)
            $ionicLoading.hide();
            $state.go('verify');
          }, function errorCallback(response) {
            $ionicLoading.hide();
          });
        }
      }
    };

    var getAllContacts = function () {
      function onSuccess(contacts) {
        $scope.data.user.contacts = contacts;
      }

      function onError(contactError) {
        var alertPopup = $ionicPopup.alert({
          title: 'Error!',
          template: 'Cannot get your contacts. please check your device or send email support!'
        });
      }

      var options = new ContactFindOptions();
      options.filter = "";
      options.multiple = true;
      options.hasPhoneNumber = true;
      var fields = ["*"];
      navigator.contacts.find(fields, onSuccess, onError, options);
    };

    var _init = function () {
      $http.get('./js/json/countries.json').success(function (response) {
        $scope.data.countries = response;
        $http.get('http://ip-api.com/json').success(function (response) {
          var indexGroupCountry = _.findIndex($scope.data.countries, function (o) {
            return o.char == response.country[0];
          });
          var indexCountry = _.findIndex($scope.data.countries[indexGroupCountry].data, function (o) {
            return o.altSpellings == response.countryCode;
          });
          if (indexGroupCountry !== -1 && indexCountry !== -1) {
            $scope.data.country = $scope.data.countries[indexGroupCountry].data[indexCountry];
            localStorageService.set('country', $scope.data.country);

          }
        });
      });

      if (!$ionicPlatform.is('android') && !$ionicPlatform.is('ios')) {
        $http.get('./js/json/contacts.json').success(function (response) {
          $scope.data.user.contacts = response;
        })
      } else {
        document.addEventListener("deviceready", function () {

          if ($ionicPlatform.is('android')) {

            var checkPermissionCallback = function (status) {
              if (!status.hasPermission) {
                var errorCallback = function () {
                  //console.warn('Contact permission is not turned on');
                }

                permissions.requestPermission(
                  permissions.READ_CONTACTS,
                  function (status) {
                    if (!status.hasPermission) {
                      errorCallback();
                    } else {
                      getAllContacts();

                    }

                  },
                  errorCallback);
              } else {
                getAllContacts();
              }
            }
            var permissions = cordova.plugins.permissions;
            permissions.hasPermission(permissions.READ_CONTACTS, checkPermissionCallback, null);
          } else {
            getAllContacts();
          }

        }, false);
      }
    };
    _init();
  })

  .controller('VerifyCtrl', function ($scope, $http, config, $ionicLoading, $state, localStorageService) {

    $scope.data = {
      user: {
        phone: localStorageService.get('verifyUser').phone
      }
    };

    console.log(localStorageService.get('verifyUser'));

    $scope.verify = function () {
      $scope.data.err = false;
      $http.post(config.url + config.api.verify, $scope.data.user).then(function successCallback(response) {
        if (response.data.success) {
          localStorageService.set('wohoo-user', response.data.user);
          $state.go('tab.chat');
        } else {
          $scope.data.err = true;
        }
        $ionicLoading.hide();
      }, function errorCallback(response) {
        $ionicLoading.hide();
      });
    };
  })

  .controller('MainCtrl', function ($scope, $http, config, $ionicLoading, $state, localStorageService, $ionicModal, socket, $rootScope, $ionicPopup, $timeout, $interval, $ionicPlatform, $ionicActionSheet) {

    $ionicModal.fromTemplateUrl('./templates/modals/public.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modalPublic = modal;
    });

    $scope.openModalPublic = function () {
      $scope.modalPublic.show();
    };

    $scope.closeModalPublic = function () {
      $scope.modalPublic.hide();
    };


    $scope.sendSms = function (number, event) {
      if (event) event.stopPropagation()
      var message = 'Únase a mí en TamTam, una aplicación gratuita y sorprendente para llamadas y mensajes! www.tamtam.website';

      //CONFIGURATION
      var options = {
        replaceLineBreaks: false, // true to replace \n by a new line, false by default
        android: {
          intent: 'INTENT'  // send SMS with the native android SMS messaging
          //intent: '' // send SMS without open any other app
        }
      };

      var success = function () {
      };
      var error = function (e) {
      };
      sms.send(number, message, options, success, error);
    };

    $ionicModal.fromTemplateUrl('./templates/modals/create-group.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modalGroup = modal;
    });

    $scope.selectedUser = function (item) {
      item.selected = !item.selected;
    };

    $scope.createGroup = function (event) {
      event.preventDefault();
      var channel = {
        users: [],
        from: $scope.rootData.user._id,
        isGroup: true,
        lastMessage: 'Sin mensajes',
        name: $scope.rootData.groupName
      };
      var name = '';

      angular.forEach($scope.rootData.user.contacts, function (value) {
        if (value.selected) {
          channel.users.push({
            user: value.user._id
          });
        }
      });


      channel.users.push({
        user: $scope.rootData.user._id
      });

      if (channel.users.length > 1 && $scope.rootData.groupName) {
        $ionicLoading.show();
        $http.post(config.url + config.api.channel, channel).then(function (response) {
          $http.get(config.url + config.api.channel + response.data._id).then(function (response) {
            localStorageService.set('chatDetail', response.data);
            $state.go('tab.chatDetail', {id: response.data._id});
            $ionicLoading.hide();
            $scope.modalGroup.hide();
          })
        })
      }
    }

    $scope.showActionTop = function(event) {

     // Show the action sheet
     var hideSheet = $ionicActionSheet.show({
       buttons: [
         { text: 'New Chat' },
         { text: 'New Group' },
         { text: 'New Public Channel' },
         { text: 'Invite people to Wohoo' },
       ],
       cancelText: 'Cancel',
       cancel: function() {
            // add cancel code..
          },
       buttonClicked: function(index) {
          if (index == 0) {
            $scope.openModalContacts();
          } else if (index == 1) {
            $scope.modalGroup.show();
          } else if (index == 2) {
            $scope.modalPublic.show();
          } else if (index == 3) {
            $scope.sendSms('')
          }

         return true;
       }
     });

   };

    $ionicModal.fromTemplateUrl('./templates/modals/contacts.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modalContacts = modal;
    });

    $scope.openModalContacts = function () {
      $scope.modalContacts.show();
    };

    $scope.hideModalContacts = function () {
      $scope.modalContacts.hide();
    };

    $rootScope.getMap = 'https://maps.googleapis.com/maps/api/staticmap?key=AIzaSyB2em2A71pWii9i9m4Grt1HRytmTN-LISE&';

    $scope.rootData = {
      fonts: ['Pequeña', 'normal', 'Grande']
    };
    $scope.cropper = {};
    $scope.cropper.sourceImage = null;
    $scope.cropper.croppedImage = null;
    var colors = ['616161', '26a69a', 'C73e87', '4caf50', '26a69a', '4032e6', 'E5734c', 'Fc000', '888888', 'a46251'];

    $ionicModal.fromTemplateUrl('./templates/modals/crop-image.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modalCrop = modal;
    });

    $scope.openModalCropImage = function () {
      $scope.modalCrop.show();
    };

    $scope.hideModalCropImage = function () {
      $scope.modalCrop.hide();
    };

    $scope.getImageCrop = function () {
      $ionicLoading.show();
      $http.put(config.url + config.api.users + $scope.rootData.user._id, {
        avatar: $scope.cropper.croppedImage
      }).then(function (response) {
        $scope.rootData.user.avatar = response.data.avatar;
        localStorageService.set('wohoo-user', $scope.rootData.user)
        $ionicLoading.hide();
        $scope.modalCrop.hide();
      });
    };
    console.log($state.current.name)
    if ($state.current.name == 'tab.chatDetail' || $state.current.name == 'tab.publicDetail') {
      $rootScope.hideSlide = true;
    } else {
      $rootScope.hideSlide = false;
    }

    $scope.saveName = function () {
      $ionicLoading.show();

      $http.put(config.url + config.api.users + $scope.rootData.user._id, {
        name: $scope.rootData.user.name
      }).then(function (response) {
        localStorageService.set('userInfo', $scope.rootData.user)
        $ionicLoading.hide();
      });
    };

    $scope.saveStatus = function () {
      $ionicLoading.show();

      $http.put(config.url + config.api.users + $scope.rootData.user._id, {
        status: $scope.rootData.user.status
      }).then(function (response) {
        localStorageService.set('userInfo', $scope.rootData.user)
        $ionicLoading.hide();
      });
    };

    $scope.saveColor = function () {
      $ionicLoading.show();

      $http.put(config.url + config.api.users + $scope.rootData.user._id, {
        color: $scope.rootData.user.color
      }).then(function (response) {
        localStorageService.set('userInfo', $scope.rootData.user)
        $ionicLoading.hide();
      });
    };

    $scope.getFontSize = function () {
      localStorageService.set('fontSize', $scope.rootData.fontSize)
    };

    $scope.changeNotification = function () {

      $http.put(config.url + config.api.users + $scope.rootData.user._id, {
        notification: $scope.rootData.user.notification || false
      }).then(function (response) {
        localStorageService.set('userInfo', $scope.rootData.user)
        $ionicLoading.hide();
      });
    };

    $scope.changeInformation = function () {

      $http.put(config.url + config.api.users + $scope.rootData.user._id, {
        hideInfo: $scope.rootData.user.hideInfo || false
      }).then(function (response) {
        localStorageService.set('userInfo', $scope.rootData.user)
        $ionicLoading.hide();
      });
    };

    $scope.openAbout = function () {
      cordova.InAppBrowser.open('http://www.tamtam.website', '_blank', 'location=yes')
    };

    $scope.openAbout1 = function () {
      cordova.InAppBrowser.open('http://www.tamtam.website/tamtamnew/', '_blank', 'location=yes')
    };

    var urlRegEx = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/g;
    $scope.urlify = function (text) {
      return text.replace(urlRegEx, "<a ng-click=\"openLink('$1',\'_system\')\">$1</a>");
    };

    $scope.openLink = function (url) {
      cordova.InAppBrowser.open(url, '_blank', 'location=yes')
    };

    $scope.logOut = function () {
      localStorageService.clearAll();
      $state.go('intro');
    };

    $scope.refreshContact = function () {
      $ionicLoading.show()
      $http.get(config.url + config.api.users + $scope.rootData.user._id).then(function (response) {
        $scope.rootData.user.contacts = response.data.contacts;
        $ionicLoading.hide()
      })
    };

    var getRandomColor = function () {
      return '#' + colors[Math.floor(Math.random() * 10)];
    };


    var getChanelSocket = function (event, channel) {
      if (event == 'created') {
        for (var i = 0; i < $scope.rootData.channels.length; i++) {
          if (channel._id == $scope.rootData.channels[i]._id) {
            $http.get(config.url + config.api.channel + channel._id).then(function (response) {
              $scope.rootData.channels[i] = response.data;
              $rootScope.$broadcast('channel-event', response.data);
            })
            return;
          }
        }

        for (var j = 0; j < channel.users.length; j++) {
          if (channel.users[j].user == $scope.rootData.user._id) {
            $http.get(config.url + config.api.channel + channel._id).then(function (response) {
              $scope.rootData.channels.unshift(response.data);
              $rootScope.$broadcast('channel-event', response.data);
            })
            return
          }
        }
      }

      if (event == 'deleted') {
        for (var i = 0; i < $scope.rootData.channels.length; i++) {
          if (channel._id == $scope.rootData.channels[i]._id) {
            $scope.rootData.channels.splice(i, 1);
            if ($rootScope.stateName == 'tab.chatDetail') {
              $state.go('tab.chat');
            }
            return;
          }
        }
      }
    };

    $scope.getReadNumber = function (users) {
      for (var i = 0; i < users.length; i++) {
        if ($scope.rootData.user._id == users[i].user._id) {
          return users[i].read
        }
      }
      return 0;
    };

    $ionicModal.fromTemplateUrl('./templates/modals/video-call.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.videoCall = modal;
    });

    $scope.openUserCall = function (users) {
      for (var i = 0; i < users.length; i++) {
        if (users[i].user._id != $scope.rootData.user._id) {
          $scope.rootData.userCall = {
            name: users[i].user.name,
            phone: users[i].user.phone,
            avatar: users[i].user.avatar,
            _id: users[i].user._id
          };
          console.log($scope.rootData.userCall);
          break;
        }
      }
      $scope.videoCall.show();
    };

    var stop;
    $scope.fight = function () {
      // Don't start a new fight if we are already fighting
      if (angular.isDefined(stop)) return;

      stop = $interval(function () {
        if ($scope.rootData.timeoutCall) {
          $scope.rootData.timeoutCall--;
          console.log($scope.rootData.timeoutCall);
        } else {
          $scope.stopFight();
        }
      }, 1000);
    };

    $scope.stopFight = function () {
      if (angular.isDefined(stop)) {
        $interval.cancel(stop);
        $scope.rootData.timeoutCall = 0;
        stop = undefined;
      }
    };

    var iceServers = [{"url": "stun:global.stun.twilio.com:3478?transport=udp"}, {
      "url": "turn:global.turn.twilio.com:3478?transport=udp",
      "username": "19001b9bfbc741daae1cd31af3bfea1250fddf5b0297c05222e9de11a1e1cf5d",
      "credential": "x+Qc+Mfm8/bZuVqsM57fFRFC0AAgSJgS8fpeO4t26qg="
    }, {
      "url": "turn:global.turn.twilio.com:3478?transport=tcp",
      "username": "19001b9bfbc741daae1cd31af3bfea1250fddf5b0297c05222e9de11a1e1cf5d",
      "credential": "x+Qc+Mfm8/bZuVqsM57fFRFC0AAgSJgS8fpeO4t26qg="
    }, {
      "url": "turn:global.turn.twilio.com:443?transport=tcp",
      "username": "19001b9bfbc741daae1cd31af3bfea1250fddf5b0297c05222e9de11a1e1cf5d",
      "credential": "x+Qc+Mfm8/bZuVqsM57fFRFC0AAgSJgS8fpeO4t26qg="
    }]
    var peerConnectionConfig = {
      'iceServers': iceServers
    };

    var peerConnection;

    socket.socket.on('webrtc:save', function (message) {
      if (message.status == 2 && message.uuid == $scope.rootData.user._id) {
        gotMessageFromServer(message);
      }

      if (message.status == 3 && message.uuid == $scope.rootData.user._id) {
        $scope.destroyStream();
      }

      if (message.status == 1 && $scope.rootData.user._id == message.uuid) {
        var confirmPopup = $ionicPopup.confirm({
          title: 'Bạn có một cuộc gọi từ bác sĩ',
          cancelText: 'Cancel',
          okText: 'Ok'
        });

        confirmPopup.then(function (res) {
          if (res) {
            $scope.rootData.uuid = message.from._id;
            $scope.rootData.userCall = message.from;
            $scope.videoCall.show();
            $scope.rootData.streamOption = message.option;
            $scope.openVideoView(true);
          } else {

          }
        });

        $timeout(function () {
          confirmPopup.close();
        }, 45000);
      }
    });

    $scope.openVideoView = function (isStream) {
      $scope.rootData.isStreaming = isStream;
      if (isStream) {
        $scope.openVideoCall();
      }
    };

    $scope.openVideoCall = function (successCb) {
      navigator.webkitGetUserMedia($scope.rootData.streamOption, function (stream) {
        $scope.rootData.localStream = stream;
        $scope.rootData.localStream.src = window.URL.createObjectURL(stream);
        $scope.$apply();
        if ($scope.rootData.isStreaming) {
          $scope.connect(true)
        }
        if (successCb) {
          successCb(stream);
        }
      }, function (e) {
        console.log('No live audio input: ' + e);
      });
    };

    $scope.connect = function (isCaller) {
      peerConnection = new RTCPeerConnection(peerConnectionConfig);
      peerConnection.onicecandidate = gotIceCandidate;
      peerConnection.onaddstream = gotRemoteStream;
      peerConnection.addStream($scope.rootData.localStream);

      if (isCaller) {
        peerConnection.createOffer().then(createdDescription).catch(errorHandler);
      }
    };

    function gotMessageFromServer(message) {
      if (!peerConnection) $scope.connect(false);

      var signal = message;

      // Ignore messages from ourself
      if (signal.uuid == $scope.rootData.uuid) return;

      if (signal.sdp) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function () {
          // Only create answers in response to offers
          if (signal.sdp.type == 'offer') {
            peerConnection.createAnswer().then(createdDescription).catch(errorHandler);
          }
        }).catch(errorHandler);
      } else if (signal.ice) {
        peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
      }
    }

    function gotIceCandidate(event) {
      if (event.candidate != null) {
        $http.post(config.url + config.api.webrtc, {
          'ice': event.candidate,
          'uuid': $scope.rootData.uuid,
          status: 2
        }).then(function (responsive) {
          //console.log(responsive)
        });
      }
    }

    function gotRemoteStream(event) {
      $scope.rootData.remoteStream = event.stream;
      $scope.rootData.remoteStream.src = window.URL.createObjectURL(event.stream);
      $scope.$apply();
      $scope.rootData.timeoutCall = 0;
      if ($ionicPlatform.is('IOS')) {
        $timeout(function () {
          angular.forEach([0, 500, 1000, 1500], function (delay) {
            $timeout(function () {
              cordova.plugins.iosrtc.refreshVideos();
            }, delay);
          })

          cordova.plugins.audioroute.overrideOutput('speaker',
            function (success) {
              console.log('success', success)
              // Success
            },
            function (error) {
              console.log('error', error)

              // Error
            }
          );
        }, 1000)
      }

    }

    function createdDescription(description) {

      peerConnection.setLocalDescription(description).then(function () {

        $http.post(config.url + config.api.webrtc, {
          'sdp': peerConnection.localDescription,
          'uuid': $scope.rootData.uuid,
          status: 2
        }).then(function (responsive) {
          //console.log(responsive)
        });
      }).catch(errorHandler);
    }

    function errorHandler(error) {
      console.log(error);
    }

    $scope.calling = function (audio) {
      $scope.rootData.streamOption = {
        audio: true,
        video: true
      };

      $scope.rootData.uuid = $scope.rootData.userCall._id;

      if (audio) {
        $scope.rootData.streamOption.video = false;
      } else {
        $scope.rootData.streamOption.video = true;
      }

      $scope.rootData.timeoutCall = 45;
      $scope.fight();

      $http.post(config.url + config.api.webrtc, {
        'uuid': $scope.rootData.uuid, status: 1, option: $scope.rootData.streamOption, from: {
          name: $scope.rootData.user.name,
          phone: $scope.rootData.user.phone,
          avatar: $scope.rootData.user.avatar,
          _id: $scope.rootData.user._id
        }
      }).then(function (responsive) {
        //console.log(responsive)
      });
      $scope.openVideoCall();
    };

    $scope.destroyStream = function (isMyStop) {
      console.log('destroy stream')
      $scope.videoCall.hide();
      if ($scope.rootData.localStream) {
        $scope.rootData.localStream.getTracks().forEach(function (track) {
          track.stop(

          )
        })
        $scope.rootData.localStream = null;

      }
      if ($scope.rootData.remoteStream) {
        $scope.rootData.remoteStream.getTracks().forEach(function (track) {
          track.stop(

          )
        })
        $scope.rootData.remoteStream = null;

      }

      peerConnection = null;

      if (isMyStop) {
        $http.post(config.url + config.api.webrtc, {
          uuid: $scope.rootData.uuid,
          status: 3
        }).then(function (responsive) {
        });
      }

    };

    $scope.changeOptionSpeaker = function (type) {
      $timeout(function () {
        angular.forEach([0, 500, 1000, 1500], function (delay) {
          $timeout(function () {
            cordova.plugins.iosrtc.refreshVideos();
          }, delay);
        });

        cordova.plugins.audioroute.overrideOutput(type,
          function (success) {
            console.log('success', success)
            // Success
          },
          function (error) {
            console.log('error', error)

            // Error
          }
        );
      }, 1000)
      $scope.popoverCall.hide();
    };


    $scope.deleteChannelChat = function (channel, index) {
      console.log(channel)
      channel.lastMessage = '';
      $http.put(config.url + config.api.channel + channel._id, {
        lastMessage: ''
      })
    };

    var _init = function () {
      if (localStorageService.get('fontSize')) {
        $scope.rootData.fontSize = localStorageService.get('fontSize');
      } else {
        $scope.rootData.fontSize = 'normal';
      }

      $scope.rootData.user = localStorageService.get('wohoo-user');

      $http.get(config.url + config.api.users + $scope.rootData.user._id).then(function (response) {
        angular.forEach(response.data.contacts, function (value) {
          value.color = getRandomColor();
        });
        $scope.rootData.user = response.data;
        localStorageService.set('wohoo-user', response.data);
        socket.syncUpdates('user', function (event, user) {

          if ($rootScope.stateName == 'tab.chatDetail') {
            $rootScope.$broadcast('user-event', user);
          }
        })
      });

      $http.get(config.url + config.api.channel, {
        params: {
          userId: $scope.rootData.user._id
        }
      }).then(function (response) {
        $scope.rootData.channels = response.data;
        socket.syncUpdates('channel', function (event, channel) {
          getChanelSocket(event, channel);
        })
      });


      socket.socket.on('connect', function () {
        $http.put(config.url + config.api.users + $scope.rootData.user._id, {
          socketId: socket.socket.connect().id,
          online: true
        });
      });

      peerConnectionConfig.iceServers = localStorageService.get('iceServers');
      $http.get(config.url + config.api.users).then(function (response) {
        peerConnectionConfig.iceServers = response.data;
        localStorageService.set('iceServers', response.data)
      })

      document.addEventListener("deviceready", function () {
        console.log('device ready')

        $timeout(function () {
          window.plugins.OneSignal.getIds(function (ids) {
            var token = ids.pushToken;
            var userPush = ids.userId;
            console.log(ids.userId, userPush)
            if (userPush != $scope.rootData.user.userPush) {
              $http.put(config.url + config.api.users + $scope.rootData.user._id, {
                pushToken: token,
                userPush: userPush
              }).then(function (response) {
                $scope.rootData.user.pushToken = response.data.pushToken;
                $scope.rootData.user.userPush = response.data.userPush;
                localStorageService.set('wohoo-user', $scope.rootData.user);
              })
            }
          });
        }, 2000)

      })


    };

    _init();
  })

  .controller('ContactCtrl', function ($scope, $ionicScrollDelegate, $state, localStorageService, $timeout, $http, $ionicLoading, config) {
    $scope.data = {
      contacts: []
    }

    $scope.scrollToTop = function () {
      $ionicScrollDelegate.scrollTop();
    };

    $scope.goToContactDetail = function (item, $index) {
      // localStorageService.set('wohoo-contact', item)
      // $state.go('tab.contactDetail', {id: $index})
      if (!item.user) return false;
      console.log(item);
      var channel = {
        users: [
          {
            user: $scope.rootData.user._id,
            isRead: true
          },
          {
            user: item.user._id
          }
        ],
        from: $scope.rootData.user._id,
        to: item.user._id
      };

      $ionicLoading.show();

      $http.post(config.url + config.api.channel, channel).then(function (response) {
        $ionicLoading.hide();
        $state.go('tab.chatDetail', {id: response.data._id})
      })
    };

    var _init = function () {
      $scope.data.contacts = localStorageService.get('wohoo-user').contacts;
    };
    $timeout(function () {
      _init();
    }, 0)
  })

  .controller('AccountCtrl', function ($scope) {

    document.addEventListener("deviceready", function () {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
    });

    $scope.$on('$destroy', function () {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    })
  })

  .controller('ContactDetailCtrl', function ($scope, localStorageService, $http, config, $ionicLoading, $state) {
    $scope.dataModal = {
      contact: localStorageService.get('wohoo-contact')
    };


    console.log($scope.dataModal.contact)

    $scope.createPrivateChat = function (contact) {
      var channel = {
        users: [
          {
            user: $scope.rootData.user._id,
            isRead: true
          },
          {
            user: contact.user._id
          }
        ],
        from: $scope.rootData.user._id,
        to: contact.user._id
      };

      $ionicLoading.show()

      $http.post(config.url + config.api.channel, channel).then(function (response) {
        $ionicLoading.hide();
        $state.go('tab.chatDetail', {id: response.data._id})
        $scope.modalProfile.hide();
      })
    };

  })

  .controller('ChatCtrl', function ($scope, $ionicModal, $ionicLoading, $http, config, $state, localStorageService) {

    $scope.data = {};

    $scope.goChatDetail = function (item) {
      localStorageService.set('chatDetail', item);
      $state.go('tab.chatDetail', {id: item._id});
    };
  })

  .controller('ChatDetailCtrl', function ($interval, $scope, localStorageService, $http, config, $stateParams, $timeout, $ionicPlatform, $ionicActionSheet, $ionicScrollDelegate, $state, $ionicPopup, socket, $ionicLoading, codeService, unixString, $ionicModal) {
    $scope.data = {
      channel: localStorageService.get('chatDetail'),
      messages: [],
      message: {},
      typing: [],
      count: 0
    };

    var stop;
    $scope.fightCount = function() {
      $scope.data.count = 0;
      // Don't start a new fight if we are already fighting
      if ( angular.isDefined(stop) ) return;

      stop = $interval(function() {
        $scope.data.count += 1
      }, 1000);
    };

    $scope.stopFight = function() {
      if (angular.isDefined(stop)) {
        $interval.cancel(stop);
        stop = undefined;
      }
    };

    $scope.seconds2time = function (seconds) {
      var hours   = Math.floor(seconds / 3600);
      var minutes = Math.floor((seconds - (hours * 3600)) / 60);
      var seconds = seconds - (hours * 3600) - (minutes * 60);
      var time = "";

      if (hours != 0) {
        time = hours+":";
      }
      if (minutes != 0 || time !== "") {
        minutes = (minutes < 10 && time !== "") ? "0"+minutes : String(minutes);
        time += minutes+":";
      }
      if (time === "") {
        time = seconds+"s";
      }
      else {
        time += (seconds < 10) ? "0"+seconds : String(seconds);
      }
      return time;
    }

    $ionicModal.fromTemplateUrl('./templates/modals/profile.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modalProfile = modal;
    });

    $scope.openModalProfile = function (item) {
      console.log(localStorageService.get('wohoo-contact'))
      $scope.modalProfile.show();
    };

    $scope.hideModalProfile= function () {
      $scope.modalProfile.hide();
    };


    var txtInput;
    $timeout(function () {
      txtInput = angular.element(document.body.querySelector('#chat-input'));
    }, 1000);

    function keepKeyboardOpen() {
      txtInput.one('blur', function () {
        txtInput[0].focus();
      });
    }

    $scope.data.heightFooter = 0;
    $scope.data.heightScroll = 100;
    window.addEventListener('native.keyboardshow', keyboardShowHandler);

    if ($ionicPlatform.is('ios')) {
      window.addEventListener('native.keyboardhide', keyboardHideHandler);
    }

    function keyboardShowHandler(e) {
      $timeout(function () {
        $ionicScrollDelegate.scrollBottom(true);
        if ($ionicPlatform.is('ios')) {
          $scope.data.heightFooter = e.keyboardHeight;
          $scope.data.heightScroll = e.keyboardHeight + 120;
        }
      }, 100)
    }

    function keyboardHideHandler(e) {

      $timeout(function () {
        $scope.data.heightFooter = 0;
        $scope.data.heightScroll = 100;
        $scope.$apply();
      }, 100)
    }

    $scope.showActionBar = function () {

      // Show the action sheet
      var hideSheet = $ionicActionSheet.show({
        buttons: [
          {text: 'Sticker'},
          {text: 'Share contact'},
          {text: 'Share location'}
        ],
        cancelText: 'Cancel',
        cancel: function () {
          // add cancel code..
        },
        buttonClicked: function (index) {
          if (index == 0) {
            $scope.openSticker();

          }
          if (index == 1) {
            $scope.openShare();
          }
          if (index == 2) {
            $scope.getLocation();
          }
          return true;
        }
      });

    };


    var sendMessage = function () {
      var params = {
        channel: $stateParams.id,
        from: {
          userId: $scope.rootData.user._id,
          color: $scope.rootData.user.color,
          name: $scope.rootData.user.name,
          phone: $scope.rootData.user.phone,
          avatar: $scope.rootData.user.avatar
        }
      };

      params.updatedAt = new Date();

      if ($scope.data.message.image) {
        params.image = $scope.data.message.image;
      }

      if ($scope.data.message.text) {
        params.text = $scope.data.message.text;
      }

      if ($scope.data.message.location) {
        params.location = $scope.data.message.location;
      }

      if ($scope.data.message.contact) {
        params.contact = $scope.data.message.contact;
      }

      if ($scope.data.message.voiceMessage) {
        params.voiceMessage = $scope.data.message.voiceMessage;
      }

      if ($scope.data.message.sticker) {
        params.sticker = $scope.data.message.sticker;
      }

      if ($scope.data.message.admin) {
        params.admin = $scope.data.message.admin;
      }

      $scope.data.messages[$scope.data.messages.length - 1].chats.push(params);
      var index = $scope.data.messages[$scope.data.messages.length - 1].chats.length - 1;
      if ($scope.data.message.image) {
        $timeout(function () {
          $ionicScrollDelegate.scrollBottom(true);
        }, 1000)
      }
      $scope.data.message = {};
      $ionicScrollDelegate.resize();
      $ionicScrollDelegate.scrollBottom(true);
      $http.post(config.url + config.api.message, params).then(function (response) {
        $scope.data.messages[$scope.data.messages.length - 1].chats[index]._id = response.data._id
      })
    };

    $scope.sendMessage = function () {
      keepKeyboardOpen();
      if ($scope.data.message.text) sendMessage();
    };

    var urlRegEx = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/g;
    $scope.urlify = function (text) {
      return text.replace(urlRegEx, "<a ng-click=\"openLink('$1',\'_system\')\">$1</a>");
    };

    $scope.openLink = function (url) {
      cordova.InAppBrowser.open(url, '_blank', 'location=yes')
    };

    $scope.viewProfile = function (item) {
      var params = {
        active: true,
        color: item.color,
        name: item.name,
        phone: item.phone,
        user: item
      };
      $scope.dataModal = {
        contact: params
      };
      console.log($scope.dataModal)
      localStorageService.set('wohoo-contact', params)
      $scope.openModalProfile()
    };

    $scope.showConfirmDelte = function (id, index) {
      var confirmPopup = $ionicPopup.confirm({
        title: 'Eliminar mensaje',
        template: 'Deseas eliminar este mensaje?',
        cancelText: 'Cancelar',
        okText: 'Si'
      });

      confirmPopup.then(function (res) {
        if (res) {
          $scope.data.messages[$scope.data.messages.length - 1].chats.splice(index, 1);
          $http.delete(config.url + config.api.message + id);
          console.log('You are sure');
        } else {
          console.log('You are not sure');
        }
      });
    };

    $scope.clearChat = function () {
      var confirmPopup = $ionicPopup.confirm({
        title: '¿Desea limpiar el chat?',
        cancelText: 'Cancelar',
        okText: 'Si'
      });
      confirmPopup.then(function (res) {
        if (res) {
          $http.put(config.url + config.api.channel + 'delete/' + $scope.data.channel._id, {
            userId: $scope.rootData.user._id
          }).then(function (response) {
            $scope.data.messages = [
              {
                day: new Date(),
                chats: []
              }
            ];
          })
        } else {

        }
      });
    };

    $scope.uploadImage = function (file) {
      if (file) {
        $ionicLoading.show();

        AWS.config.update({
          accessKeyId: codeService.decode(config.accessKeyId),
          secretAccessKey: codeService.decode(config.secretKey)
        });
        AWS.config.region = 'us-east-1';
        var bucket = new AWS.S3({params: {Bucket: codeService.decode(config.bucket)}});
        var uniqueFileName = unixString.uniqueString() + '-' + file.name;
        var params1 = {Key: uniqueFileName, ContentType: file.type, Body: file, ServerSideEncryption: 'AES256'};
        bucket.putObject(params1, function (err, data) {
          if (err) {
            $ionicLoading.hide();
            return false;
          }
          else {
            // Upload Successfully Finished
            var urlFire = 'https://s3.amazonaws.com/viber-clone/' + uniqueFileName;
            $scope.data.message.image = urlFire;
            sendMessage();
            $ionicLoading.hide();
            // Reset The Progress Bar
            setTimeout(function () {
              $scope.$digest();
            }, 4000);
          }
        })
          .on('httpUploadProgress', function (progress) {
            $scope.$digest();
          });
      }
    };

    $ionicModal.fromTemplateUrl('./templates/modals/location.html', {
      scope: $scope,
      viewType: 'bottom-sheet',
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modalLocation = modal;
    });

    $scope.getLocation = function () {
      if (location.lat) {
        $scope.modalLocation.show();
        $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);

        new google.maps.Marker({
          map: $scope.map,
          position: location,
          icon: markerIcon
        });
      }

    };

    var location = {};
    var markerIcon, mapOptions;
    var _getLocation = function () {
      var onSuccess = function (position) {
        console.log('Latitude: ' + position.coords.latitude + '\n' +
          'Longitude: ' + position.coords.longitude + '\n' +
          'Altitude: ' + position.coords.altitude + '\n' +
          'Accuracy: ' + position.coords.accuracy + '\n' +
          'Altitude Accuracy: ' + position.coords.altitudeAccuracy + '\n' +
          'Heading: ' + position.coords.heading + '\n' +
          'Speed: ' + position.coords.speed + '\n' +
          'Timestamp: ' + position.timestamp + '\n');
        location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        markerIcon = {
          url: './img/icon-location-marker.png',
          scaledSize: new google.maps.Size(32, 32)
        };

        mapOptions = {
          center: location,
          zoom: 18
        };

      };

      // onError Callback receives a PositionError object
      //
      function onError(error) {
        console.log('code: ' + error.code + '\n' +
          'message: ' + error.message + '\n');
      }


      navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        maximumAge: 7000,
        timeout: 10000,
        enableHighAccuracy: true
      });
    };

    $scope.sendLocation = function () {
      if (location.lat) {
        $scope.data.message.location = location;
        $scope.modalLocation.hide();
        sendMessage();
      }
    };

    $scope.openSticker = function () {
      $ionicModal.fromTemplateUrl('./templates/modals/stickers.html', {
        scope: $scope,
        viewType: 'bottom-sheet',
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modalSticker = modal;
        $scope.modalSticker.show();
      });

    };

    $scope.selectStickerTab = function (tab) {
      $scope.data.sticker = tab;
    };

    $scope.addSticker = function (item) {
      $scope.data.message.sticker = item.url;
      $scope.modalSticker.hide();

      sendMessage();
    };

    $ionicModal.fromTemplateUrl('./templates/modals/share-contact.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modalShareContact = modal;
    });

    $scope.openShare = function () {
      $ionicScrollDelegate.$getByHandle('shareContactScroll').scrollTop();
      $scope.modalShareContact.show();
    };

    $scope.shareContact = function (user) {
      $scope.data.message.contact = user;
      $scope.modalShareContact.hide();
      sendMessage();
    };

    $scope.goToContactDetail = function (item, $index) {
      localStorageService.set('wohoo-contact', item)
      $state.go('tab.contactDetail', {id: $index})
    };

    $scope.sendVoiceMessage = function (voiceMessage) {
      var file = voiceMessage;
      $ionicLoading.show();

      AWS.config.update({
        accessKeyId: codeService.decode(config.accessKeyId),
        secretAccessKey: codeService.decode(config.secretKey)
      });
      AWS.config.region = 'us-east-1';
      var bucket = new AWS.S3({params: {Bucket: codeService.decode(config.bucket)}});
      var uniqueFileName = unixString.uniqueString() + '.wav';
      file.name = uniqueFileName;
      var params1 = {
        Key: uniqueFileName,
        ContentType: 'audio/wav',
        Body: file,
        ServerSideEncryption: 'AES256'
      };
      bucket.putObject(params1, function (err, data) {
        if (err) {
          $ionicLoading.hide();
          return false;
        }
        else {
          // Upload Successfully Finished
          var urlFire = 'https://s3.amazonaws.com/viber-clone/' + uniqueFileName;
          $scope.data.message.voiceMessage = urlFire;
          $ionicLoading.hide();
          sendMessage();
          // Reset The Progress Bar
          setTimeout(function () {
            $scope.$digest();
          }, 4000);
        }
      })
        .on('httpUploadProgress', function (progress) {
          $scope.$digest();
        });
    };

    $scope.updateRecording = function (boolean) {
      $scope.data.recordingStatus = boolean;
    };

    $ionicModal.fromTemplateUrl('./templates/modals/add-user.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modalAddUser = modal;
    });

    $scope.openAddUser = function () {
      $scope.data.contacts = [];
      $scope.data.contacts = angular.copy($scope.rootData.user.contacts);
      $scope.modalAddUser.show();
    };

    $scope.checkIsUser = function (user) {
      if ($scope.data.channel && $scope.data.channel.users) {
        for (var i = 0; i < $scope.data.channel.users.length; i++) {
          if (user.user._id == $scope.data.channel.users[i].user._id) {
            return true;
          }
        }
        return false;
      }
    };

    $scope.selectedUser = function (item) {
      item.selected = !item.selected
    };

    $scope.updateUser = function () {
      var users = [];
      var name = '';
      angular.forEach($scope.rootData.user.contacts, function (value) {
        var check;
        if (value.selected) {
          console.log(value)
          check = true;
          $scope.data.channel.users.push({
            user: {
              _id: value.user._id,
              name: value.user.name,
              color: value.user.color,
              avatar: value.user.avatar
            },
            read: 0
          });

          name += value.user.name + ', ';
        }

        if (check) {
          var params = [];
          angular.forEach($scope.data.channel.users, function (value) {
            params.push({
              read: value.read,
              user: value.user._id,
              deletedAt: value.deletedAt
            })
          })
          console.log(params)
          $ionicLoading.show();
          $http.put(config.url + config.api.channel + $scope.data.channel._id, {
            users: params
          }).then(function (response) {
            $scope.data.message.text = 'Added ' + name + 'to the group';
            sendMessage();
            $scope.modalAddUser.hide();
            $ionicLoading.hide();
          })
        }
      });
    };

    $ionicModal.fromTemplateUrl('./templates/modals/edit-channel.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modalEdit = modal;
    });

    $scope.showModalChanel = function () {
      $scope.data.channelEditting = angular.copy($scope.data.channel);
      $scope.modalEdit.show();
    };

    $scope.deleteGroup = function () {
      $ionicLoading.show();
      $http.delete(config.url + config.api.channel + $scope.data.channel._id).then(function (response) {
        $state.go('tab.chat');
        $ionicLoading.hide();
        $scope.modalEdit.hide();
      })
    };

    $scope.removeUsers = function (index, check) {
      console.log($scope.data.channelEditting.from, $scope.rootData.user)
      if (!check && $scope.data.channelEditting.from == $scope.data.channelEditting.users[index]._id) {
        return
      }
      var name = $scope.data.channelEditting.users[index].user.name;
      console.log($scope.data.channelEditting.users[index]);
      $scope.data.channelEditting.users.splice(index, 1);

      var params = [];
      angular.forEach($scope.data.channelEditting.users, function (value) {
        params.push({
          read: value.read,
          user: value.user._id,
          deletedAt: value.deletedAt
        })
      });
      $ionicLoading.show();
      $http.put(config.url + config.api.channel + $scope.data.channel._id, {
        users: params
      }).then(function (response) {
        $scope.data.channel.users = $scope.data.channelEditting.users;
        $scope.modalEdit.hide();
        if (check) {
          $state.go('tab.chat');
          $scope.data.message.admin = true;
          $scope.data.message.text = $scope.rootData.user.name + ' has left group';
          sendMessage();
        } else {
          $scope.data.message.admin = true;
          $scope.data.message.text = $scope.rootData.user.name + ' kicked ' + name + ' in group';
          sendMessage();
        }
        $ionicLoading.hide();
      })
    };

    $scope.leaveGroup = function () {
      for (var i = 0; i < $scope.data.channelEditting.users.length; i++) {
        if ($scope.data.channelEditting.users[i].user._id == $scope.rootData.user._id) {
          $scope.removeUsers(index, true)
          break;
        }
      }
    };

    $scope.editGroup = function () {
      if ($scope.data.channelEditting.name) {
        $ionicLoading.show();
        $http.put(config.url + config.api.channel + $scope.data.channel._id, {
          name: $scope.data.channelEditting.name
        }).then(function (response) {
          $scope.data.channel.name = $scope.data.channelEditting.name;
          $scope.modalEdit.hide();
          $ionicLoading.hide();
        })
      }
    };

    var getMessages = function () {
      var params = {
        channel: $stateParams.id,
        userId: $scope.rootData.user._id
      };

      for (var i = 0; i < $scope.data.channel.users.length; i++) {
        if ($scope.data.channel.users[i].user._id == $scope.rootData.user._id && $scope.data.channel.users[i].deletedAt) {
          params.deletedAt = $scope.data.channel.users[i].deletedAt;
          break;
        }
      }
      $scope.data.messages = [];
      $http.get(config.url + config.api.message, {
        params: params
      }).then(function (response) {
        //$scope.data.messages = response.data;
        var groups = _.groupBy(response.data, function (item) {
          return moment(item.createdAt).startOf('day').format();
        });
        $scope.data.messages = _.map(groups, function(group, day){
          return {
            day: day,
            chats: group
          }
        });

        if ($scope.data.messages.length && new Date($scope.data.messages[$scope.data.messages.length - 1].day).getDate() != new Date().getDate()) {
          $scope.data.messages.push({
            day: new Date(),
            chats: []
          })
        }

        if (!$scope.data.messages.length) {
          $scope.data.messages.push({
            day: new Date(),
            chats: []
          })
        }
        $scope.indexMessage = $scope.data.messages.length;

        $ionicScrollDelegate.scrollBottom(true);

        $timeout(function () {
          $ionicScrollDelegate.resize();
          $ionicScrollDelegate.scrollBottom(true);
        }, 1500)
        socket.syncUpdates('message', function (event, message) {
          if (event == 'deleted' && message.channel == $scope.data.channel._id) {
            for (var i = 0; i < $scope.data.messages[$scope.data.messages.length - 1].chats.length; i++) {
              if ($scope.data.messages[$scope.data.messages.length - 1].chats[i]._id = message._id) {
                $scope.data.messages[$scope.data.messages.length - 1].chats.splice(i, 1)
              }
            }
          }

          if (event == 'created' && message.channel == $scope.data.channel._id && message.from.userId != $scope.rootData.user._id) {
            $scope.data.messages[$scope.data.messages.length - 1].chats.push(message)
          }
        })
      });
    };

    $scope.typing = function () {
      if (!$scope.data.isTyping) {
        $scope.data.isTyping = true;
        $http.post(config.url + config.api.typing, {
          name: $scope.rootData.user.name,
          _id: $scope.rootData.user._id,
          channel: $scope.data.channel._id
        })

        $timeout(function () {
          $scope.data.isTyping = false;
        }, 10000)
      }
    };

    $scope.showFullSizeImage = function (image, index) {
      var items = [];

      items.push({
        src: image,
        w: -1,
        h: -1,
        title: ''
      })
      var pswpElement = document.querySelectorAll('.pswp')[0];
      var options = {
        history: false,
        focus: false,
        showAnimationDuration: 0,
        hideAnimationDuration: 0,
        index: index,
        pinchToClose : false,
        closeOnScroll: false,
        closeOnVerticalDrag: true,
        tapToClose: false,
      };

      var gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);

      gallery.listen('imageLoadComplete', function(index, item) {
        if (item.w < 1 || item.h < 1) {
          var img = new Image();
          img.src = item.src;
          img.onload = function() {
            item.w = this.width;
            item.h = this.height;
            gallery.invalidateCurrItems();
            gallery.updateSize(true);

          }
        }
      });

      gallery.init();
    };

    var _init = function () {
      $http.get(config.url + config.api.channel + $stateParams.id).then(function (response) {
        localStorageService.set('chatDetail', response.data);
        $scope.data.channel = response.data;
        getNotify($scope.data.channel);
        getMessages();

        $scope.$on('channel-event', function (event, args) {
          if ($scope.data.channel._id == args._id) {
            $scope.data.channel = args;
          }
          getNotify();
          $scope.data.channel.readAll = false;
          for (var i = 0; i < $scope.data.channel.users.length; i++) {
            if (!$scope.data.channel.users[i].read && $scope.data.channel.users[i].user._id != $scope.rootData.user._id) {
              $scope.data.channel.readAll = true;
              break
            }
          }
        });

        $scope.$on('user-event', function (event, args) {

          for (var i = 0; i < $scope.data.channel.users.length; i++) {
            if (args._id == $scope.data.channel.users[i].user._id) {
              $scope.data.channel.users[i].user.lastConnection = args.lastConnection;
              $scope.data.channel.users[i].user.online = args.online;
              break;
            }
          }
        });

        socket.syncUpdates('typing', function (event, user) {
          if (user._id != $scope.rootData.user._id && user.channel == $scope.data.channel._id) {
            var check;
            var setTime = function (user) {
              $timeout(function () {
                for (var j = 0; j < $scope.data.typing.length; j++) {
                  if (user._id == $scope.data.typing[j]._id) {
                    $scope.data.typing.splice(j, 1);
                    break;
                  }
                }
              }, 10000)
            };
            for (var i = 0; i < $scope.data.typing.length; i++) {
              if (user._id == $scope.data.typing[i]._id) {
                check = true;
                setTime(user)
                break;
              }
            }
            if (!check) {
              $scope.data.typing.push(user)
              setTime(user)
            }
          }
        })
      });

      $http.get('./js/json/sticker.json').then(function (response) {
        $scope.data.stickers = response.data;
        $scope.selectStickerTab($scope.data.stickers[0]);
      });

      if (localStorageService.get('backgroundSelected')) {
        $scope.data.background = localStorageService.get('backgroundSelected');
      }

      document.addEventListener("deviceready", function () {
        _getLocation();
      }, false);
    };

    var getNotify = function () {
      var number = 0;
      angular.forEach($scope.rootData.channels, function (value) {
        angular.forEach(value.users, function (value) {
          if (value.user._id == $scope.rootData.user._id) {
            number += value.read;
          }
        })
      });
      $scope.data.notify = number;
    };


    $scope.$on('$destroy', function () {
      if ($scope.modalSticker) {
        $scope.modalSticker.remove();
      }
      socket.unsyncUpdates('message')
      if ($ionicPlatform.is('ios') || $ionicPlatform.is('android')) {
        cordova.plugins.Keyboard.disableScroll(true);
        window.removeEventListener("native.keyboardshow");
      }

      if ($ionicPlatform.is('ios')) {
        window.removeEventListener("native.keyboardhide");
      }
    })

    _init();

  })

  .controller('BackgroundCtrl', function ($scope, $http, config, $ionicLoading, localStorageService, $ionicPopup, $state, codeService, unixString) {
    $scope.rootData.fileBg = null;
    if (localStorageService.get('backgrounds')) {
      $scope.rootData.backgrounds = localStorageService.get('backgrounds');
    } else {
      $scope.rootData.backgrounds = [
        {
          url: './img/background/1.jpg'
        },
        {
          url: './img/background/2.jpg'
        },
        {
          url: './img/background/3.jpg'
        }
      ];

      localStorageService.set('backgrounds', $scope.rootData.backgrounds)
    }

    $scope.addBackground = function (item) {
      var confirmPopup = $ionicPopup.confirm({
        title: 'Establecer fondo chat',
        template: '¿Añadir este fondo?',
        cancelText: 'Cancelar',
        okText: 'Si'
      });

      confirmPopup.then(function (res) {
        if (res) {
          localStorageService.set('backgroundSelected', item);
          $state.go('tab.account')
        } else {
          console.log('You are not sure');
        }
      });
    }


    $scope.uploadBg = function (file) {
      if (file && file != null) {
        $ionicLoading.show();
        AWS.config.update({
          accessKeyId: codeService.decode(config.accessKeyId),
          secretAccessKey: codeService.decode(config.secretKey)
        });
        AWS.config.region = 'us-east-1';
        var bucket = new AWS.S3({params: {Bucket: codeService.decode(config.bucket)}});
        var uniqueFileName = unixString.uniqueString() + '-' + file.name;
        var params1 = {Key: uniqueFileName, ContentType: file.type, Body: file, ServerSideEncryption: 'AES256'};
        bucket.putObject(params1, function (err, data) {
          if (err) {
            $ionicLoading.hide();
            return false;
          }
          else {
            // Upload Successfully Finished
            var urlFire = 'https://s3.amazonaws.com/viber-clone/' + uniqueFileName;
            $scope.rootData.backgrounds.push({
              url: urlFire
            })
            localStorageService.set('backgroundSelected', {
              url: urlFire
            });
            localStorageService.set('backgrounds', $scope.rootData.backgrounds);
            $ionicLoading.hide();
            // Reset The Progress Bar
            setTimeout(function () {
              $scope.$digest();
            }, 4000);
          }
        }).on('httpUploadProgress', function (progress) {
          $scope.$digest();
        });
      }
    };


    $scope.setDefault = function () {
      localStorageService.remove('backgroundSelected');
      $state.go('tab.account')
    }

  })

  .controller('PublicCtrl', function ($scope, $ionicModal, $ionicLoading, codeService, unixString, config, $http, $state, socket) {
    $scope.data = {
      public: {
        images: []
      }
    };

    $scope.uploadImageBanner = function (file) {
      if (file && file != null) {
        $ionicLoading.show();
        AWS.config.update({
          accessKeyId: codeService.decode(config.accessKeyId),
          secretAccessKey: codeService.decode(config.secretKey)
        });
        AWS.config.region = 'us-east-1';
        var bucket = new AWS.S3({params: {Bucket: codeService.decode(config.bucket)}});
        var uniqueFileName = unixString.uniqueString() + '-' + file.name;
        var params1 = {Key: uniqueFileName, ContentType: file.type, Body: file, ServerSideEncryption: 'AES256'};
        bucket.putObject(params1, function (err, data) {
          if (err) {
            $ionicLoading.hide();
            return false;
          }
          else {
            // Upload Successfully Finished
            $scope.data.public.avatar = 'https://s3.amazonaws.com/viber-clone/' + uniqueFileName;
            console.log($scope.data.public);
            $ionicLoading.hide();
            // Reset The Progress Bar
            setTimeout(function () {
              $scope.$digest();
            }, 4000);
          }
        }).on('httpUploadProgress', function (progress) {
          $scope.$digest();
        });
      }
    };

    $scope.uploadImagePublic = function (file) {
      if (file && file != null) {
        $ionicLoading.show();
        AWS.config.update({
          accessKeyId: codeService.decode(config.accessKeyId),
          secretAccessKey: codeService.decode(config.secretKey)
        });
        AWS.config.region = 'us-east-1';
        var bucket = new AWS.S3({params: {Bucket: codeService.decode(config.bucket)}});
        var uniqueFileName = unixString.uniqueString() + '-' + file.name;
        var params1 = {Key: uniqueFileName, ContentType: file.type, Body: file, ServerSideEncryption: 'AES256'};
        bucket.putObject(params1, function (err, data) {
          if (err) {
            $ionicLoading.hide();
            return false;
          }
          else {
            // Upload Successfully Finished
            $scope.data.public.images.push('https://s3.amazonaws.com/viber-clone/' + uniqueFileName);
            console.log($scope.data.public);
            $ionicLoading.hide();
            // Reset The Progress Bar
            setTimeout(function () {
              $scope.$digest();
            }, 4000);
          }
        }).on('httpUploadProgress', function (progress) {
          $scope.$digest();
        });
      }
    };

    $scope.removeImage = function (index) {
      $scope.data.public.images.splice(index, 1);
    };

    $scope.createPublic = function () {
      $scope.data.public.from = $scope.rootData.user._id;
      $ionicLoading.show();
      $http.post(config.url + config.api.public, $scope.data.public).then(function (response) {
        console.log(response);
        $ionicLoading.hide();
        $scope.modalPublic.hide();
        $scope.data.public = {
          images: []
        }
      })
    };

    $scope.goPublicDetail = function (id) {
      $state.go('tab.publicDetail', {id: id})
    };

    var _init = function () {
      $scope.data.publics = [];
      $http.get(config.url + config.api.public).then(function (response) {
        console.log(response);
        $scope.data.publics = response.data;

        socket.syncUpdates('publicChannel', function (event, item) {
          var oldItem = _.find($scope.data.publics, {_id: item._id});
          var index = $scope.data.publics.indexOf(oldItem);
          var event = 'created';

          // replace oldItem if it exists
          // otherwise just add item to the collection
          if (oldItem) {
            $scope.data.publics.splice(index, 1, item);
            event = 'updated';
          } else {
            $scope.data.publics.push(item)
          }

        })
      })
    };
    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('publicChannel')
    })

    _init();
  })

  .controller('PublicDetailCtrl', function ($scope, $ionicModal, $ionicLoading, codeService, unixString, config, $http, $state, $stateParams, $ionicScrollDelegate, $timeout) {
    $scope.data = {}

    $ionicModal.fromTemplateUrl('./templates/modals/public.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modalPublic = modal;
    });

    $scope.openModalPublic = function () {
      $scope.modalPublic.show();
    };

    $scope.closeModalPublic = function () {
      $scope.modalPublic.hide();
    };

    $scope.addMessage = function () {
      $state.go('tab.chatDetail', {id: $scope.data.public.channel})
    };

    $scope.openPublic = function () {
      if ($scope.data.public.from == $scope.rootData.user._id) {
        $scope.modalPublic.show();
      }
    };

    $scope.editPublic = function () {
      $ionicLoading.show();
      $http.put(config.url + config.api.public + $scope.data.public._id, $scope.data.public).then(function (response) {
        $scope.data.public = response.data;
        $ionicLoading.hide();
        $scope.modalPublic.hide();
      })
    };

    $scope.deletePublic = function () {
      $ionicLoading.show();
      $http.delete(config.url + config.api.public + $scope.data.public._id).then(function (response) {
        $ionicLoading.hide();
        $scope.modalPublic.hide();
        $state.go('tab.public');
      })
    }

    var _init = function () {
      $http.get(config.url + config.api.public + $stateParams.id).then(function (response) {
        console.log(response)
        $scope.data.public = response.data;
        var params = {
          channel: $scope.data.public.channel,
          userId: $scope.rootData.user._id
        };
        $http.get(config.url + config.api.message, {
          params: params
        }).then(function (response) {
          $scope.data.messages = response.data;
          console.log(response.data)
          $ionicScrollDelegate.scrollBottom(true);

          $timeout(function () {
            $ionicScrollDelegate.resize();
            $ionicScrollDelegate.scrollBottom(true);
          }, 1500)

        });
      })
    };

    _init();
  })
