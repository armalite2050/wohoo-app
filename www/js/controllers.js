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
        console.log(user)
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
          $state.go('tab.contacts');
        } else {
          $scope.data.err = true;
        }
        $ionicLoading.hide();
      }, function errorCallback(response) {
        $ionicLoading.hide();
      });
    };
  })

  .controller('MainCtrl', function ($scope, $http, config, $ionicLoading, $state, localStorageService, $ionicModal, socket) {

    $scope.rootData = {
      fonts: ['Pequeña' , 'normal' , 'Grande']
    };
    $scope.cropper = {};
    $scope.cropper.sourceImage = null;
    $scope.cropper.croppedImage   = null;
    var colors = ['616161', '26a69a', 'C73e87', '4caf50', '26a69a', '4032e6', 'E5734c', 'Fc000', '888888', 'a46251'];

    $ionicModal.fromTemplateUrl('./templates/modals/crop-image.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modalCrop = modal;
    });

    $scope.openModalCropImage = function() {
      $scope.modalCrop.show();
    };

    $scope.hideModalCropImage = function() {
      $scope.modalCrop.hide();
    };

    $scope.getImageCrop = function () {
      console.log($scope.cropper.croppedImage)
      $ionicLoading.show();
      $http.put(config.url + config.api.users + $scope.rootData.user._id,  {
        avatar: $scope.cropper.croppedImage
      }).then(function (response) {
        $scope.rootData.user.avatar = response.data.avatar;
        localStorageService.set('wohoo-user', $scope.rootData.user)
        $ionicLoading.hide();
        $scope.modalCrop.hide();
      });
    };

    $scope.saveName = function () {
      $ionicLoading.show();

      $http.put(config.url + config.api.users + $scope.rootData.user._id,  {
        name: $scope.rootData.user.name
      }).then(function (response) {
        localStorageService.set('userInfo', $scope.rootData.user)
        $ionicLoading.hide();
      });
    };

    $scope.saveStatus = function () {
      $ionicLoading.show();

      $http.put(config.url + config.api.users + $scope.rootData.user._id,  {
        status: $scope.rootData.user.status
      }).then(function (response) {
        localStorageService.set('userInfo', $scope.rootData.user)
        $ionicLoading.hide();
      });
    };

    $scope.saveColor = function () {
      $ionicLoading.show();

      $http.put(config.url + config.api.users + $scope.rootData.user._id,  {
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

      $http.put(config.url + config.api.users + $scope.rootData.user._id,  {
        notification: $scope.rootData.user.notification || false
      }).then(function (response) {
        localStorageService.set('userInfo', $scope.rootData.user)
        $ionicLoading.hide();
      });
    };

    $scope.changeInformation = function () {

      $http.put(config.url + config.api.users + $scope.rootData.user._id,  {
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
        console.log($scope.rootData.user)
      });

      socket.socket.on('connect', function () {
        $http.put(config.url + config.api.users + $scope.rootData.user._id,  {
          socketId: socket.socket.connect().id,
          online: true
        })
        console.log(socket.socket.connect().id)
      });
    };

    _init();
  })

  .controller('ContactCtrl', function ($scope, $ionicScrollDelegate, $state, localStorageService) {
    $scope.scrollToTop = function () {
      $ionicScrollDelegate.scrollTop();
    };

    $scope.sendSms = function(number, event) {
      event.stopPropagation()
      var message = 'Únase a mí en TamTam, una aplicación gratuita y sorprendente para llamadas y mensajes! www.tamtam.website';
      console.log("number=" + number + ", message= " + message);

      //CONFIGURATION
      var options = {
        replaceLineBreaks: false, // true to replace \n by a new line, false by default
        android: {
          intent: 'INTENT'  // send SMS with the native android SMS messaging
          //intent: '' // send SMS without open any other app
        }
      };

      var success = function () { };
      var error = function (e) {  };
      sms.send(number, message, options, success, error);
    };

    $scope.goToContactDetail = function (item, $index) {
      localStorageService.set('wohoo-contact', item)
      $state.go('tab.contactDetail', {id: $index})
    };
  })

  .controller('AccountCtrl', function ($scope) {

    document.addEventListener("deviceready", function () {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
    });

    $scope.$on('$destroy', function () {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    })
  })

  .controller('ContactDetailCtrl', function ($scope, localStorageService) {
    $scope.data = {
      contact: localStorageService.get('wohoo-contact')
    }

    console.log($scope.data.contact);
  })

