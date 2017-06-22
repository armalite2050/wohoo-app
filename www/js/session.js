'use strict';

/**
 * @ngdoc service
 * @name starter.session
 * @description
 * # session
 * Service in the restTabApp.
 */
angular.module('starter')
  .service('SessionService', function (localStorageService) {

    var session = {};

    session.isToken = function () {
      var isLoggedIn = false;
      if (localStorageService.get('wohoo-user')) {
        var user = localStorageService.get('wohoo-user');
        if (user._id) {
          isLoggedIn = true;
        }
      }
      return {
        isLoggedIn: isLoggedIn
      };
    };

    return session;
  });
