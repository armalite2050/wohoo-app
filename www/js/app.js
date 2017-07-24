// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'LocalStorageModule', 'ngFileUpload', 'angular-img-cropper', 'btford.socket-io', 'angularMoment', 'monospaced.elastic'])

  .run(function ($ionicPlatform, $rootScope, SessionService, $state) {
    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);

      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }

      if (window.cordova) {

        var notificationOpenedCallback = function (jsonData) {
          console.log('notificationOpenedCallback: ' + JSON.stringify(jsonData));
          if (jsonData.notification.payload.additionalData.channel) {
            $state.go('tab.chatDetail', {id: jsonData.notification.payload.additionalData.channel})
          }
        };

        window.plugins.OneSignal
          .startInit("9bb36e2d-49d3-43da-803d-c628153c228f")
          .inFocusDisplaying(window.plugins.OneSignal.OSInFocusDisplayOption.Notification)
          .handleNotificationOpened(notificationOpenedCallback)
          .endInit()

        if ($ionicPlatform.is('IOS')) {
          cordova.plugins.iosrtc.registerGlobals();
        } else {
          var checkPermissionCallback = function (status) {
            if(!status.hasPermission) {
              var errorCallback = function() {
                console.warn('Camera permission is not turned on');
              }

              permissions.requestPermission(
                permissions.CAMERA,
                function(status) {
                  if(!status.hasPermission) errorCallback();
                },
                errorCallback);
            }
          }
          var permissions = cordova.plugins.permissions;
          permissions.hasPermission(permissions.CAMERA, checkPermissionCallback, null);
          console.log('permissions', permissions)
        }
      }
    });

    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState) {

      $rootScope.stateName = toState.name;
      console.log('current state', $rootScope.stateName)

      var shouldLogin = toState.data !== undefined
        && toState.data.requireLogin
        && !SessionService.isToken().isLoggedIn;

      // NOT authenticated - wants any private stuff
      if (shouldLogin) {
        $state.go('intro');
        event.preventDefault();
        return;
      }
      // authenticated (previously) comming not to root main
      if (SessionService.isToken().isLoggedIn) {
        var shouldGoToMain = fromState.name === ''
          && toState.name !== 'tab.contacts';
        return;
      }


    });
  })

  .config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

      .state('intro', {
        url: '/intro',
        templateUrl: 'templates/intro.html'
      })

      .state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'LoginCtrl'
      })

      .state('verify', {
        url: '/verify',
        templateUrl: 'templates/verify.html',
        controller: 'VerifyCtrl'
      })

      // setup an abstract state for the tabs directive
      .state('tab', {
        url: '/tab',
        abstract: true,
        templateUrl: 'templates/tabs.html',
        controller: 'MainCtrl',
        data: {requireLogin: true}
      })

      // Each tab has its own nav history stack:

      .state('tab.contacts', {
        url: '/contacts',
        views: {
          'tab-contacts': {
            templateUrl: 'templates/tab-contacts.html',
            controller: 'ContactCtrl'
          }
        }
      })

      .state('tab.contactDetail', {
        url: '/contacts/:id',
        views: {
          'tab-contacts': {
            templateUrl: 'templates/tab-contact-detail.html',
            controller: 'ContactDetailCtrl'
          }
        }
      })

      .state('tab.account', {
        url: '/account',
        views: {
          'tab-account': {
            templateUrl: 'templates/tab-account.html',
            controller: 'AccountCtrl'
          }
        }
      })

      .state('tab.chat', {
        url: '/chat',
        views: {
          'tab-chat': {
            templateUrl: 'templates/tab-chat.html',
            controller: 'ChatCtrl'
          }
        }
      })

      .state('tab.chatDetail', {
        url: '/chat/:id',
        views: {
          'tab-chat': {
            templateUrl: 'templates/tab-chat-detail.html',
            controller: 'ChatDetailCtrl'
          }
        }
      })

      .state('tab.background', {
        url: '/account/background',
        views: {
          'tab-account': {
            templateUrl: 'templates/tab-background.html',
            controller: 'BackgroundCtrl'
          }
        }
      })

      .state('tab.public', {
        url: '/public',
        views: {
          'tab-public': {
            templateUrl: 'templates/tab-public.html',
            controller: 'PublicCtrl'
          }
        }
      })

      .state('tab.publicDetail', {
        url: '/public/:id',
        views: {
          'tab-public': {
            templateUrl: 'templates/tab-public-detail.html',
            controller: 'PublicDetailCtrl'
          }
        }
      })
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/tab/contacts');

    $urlRouterProvider.otherwise(function ($injector) {
      var $localStorageService = $injector.get('localStorageService');
      if ($localStorageService.get('wohoo-user')) return '/tab/contacts';
      return '/intro';
    });

    $ionicConfigProvider.views.maxCache(0);
    $ionicConfigProvider.tabs.position('bottom');
    $ionicConfigProvider.views.transition('none');

  })

  .filter("trustUrl", ['$sce', function ($sce) {
    return function (recordingUrl) {
      return $sce.trustAsResourceUrl(recordingUrl);
    };
  }])
