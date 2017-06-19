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

      return contactsResult;
    }

    this.searchContact = function (contact) {
      var users = localStorageService.get('userInfo').contacts;
      if (contact.phoneNumbers && contact.phoneNumbers.length) {
        for (var i = 0; i < users.length; i++) {
          for (var j = 0; j < users[i].users.length; j++) {
            if (users[i].users[j].phoneNumbers && users[i].users[j].phoneNumbers.length && users[i].users[j].phoneNumbers[0].value == contact.phoneNumbers[0].value) {
              console.log(users[i].users[j]);
              return users[i].users[j]
            }
          }
        }
      }
      return contact;
    }
  })
