angular.module('starter')

  .constant('config', {
    url: 'http://192.168.13.103:8080/', //34.248.86.156
    bucket: 'dmliZXItY2xvbmU=',
    accessKeyId: 'QUtJQUkzSFlDRUw2SUUySVJYWFE=',
    secretKey: 'NWJCSmtRYUh3bDM2VHhQL1ExQ3dXR3NSZzZ5alFzTmpkNDMrdm0xQw==',
    api: {
      login: 'auth/phone',
      verify: 'auth/verify',
      users: 'api/users/',
      profile: 'api/users/profile/',
      chat: 'api/chats/',
      chatUpload: 'api/chats/upload/',
      channel: 'api/channels/',
      getChanel: 'api/chanels/getChanel/',
      privateChanel: 'api/chanels/private',
      upload: 'api/uploads',
      webrtc: 'api/webrtcs/',
      call: 'api/calls/',
      info: 'api/users/phone',
      history: 'api/histories/',
      typing: 'api/typing/',
      clear: 'api/clear/',
      message: 'api/messages/',
      turn: 'api/users/turn/',
    }
  });
