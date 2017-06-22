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

  .controller('MainCtrl', function ($scope, $http, config, $ionicLoading, $state, localStorageService) {

    $scope.rootData = {};
    var colors = ['616161', '26a69a', 'C73e87', '4caf50', '26a69a', '4032e6', 'E5734c', 'Fc000', '888888', 'a46251']

    var getRandomColor = function () {
      var color = '#' + colors[Math.floor(Math.random() * 10)];
      return color;
    };

    var _init = function () {
      $scope.rootData.user = localStorageService.get('wohoo-user');
      $http.get(config.url + config.api.users + $scope.rootData.user._id).then(function (response) {
        angular.forEach(response.data.contacts, function (value) {
          value.color = getRandomColor();
        });
        $scope.rootData.user = response.data;
        console.log($scope.rootData.user)
      })
    };

    _init();
  })

  .controller('ContactCtrl', function ($scope, $ionicScrollDelegate) {
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
  })
