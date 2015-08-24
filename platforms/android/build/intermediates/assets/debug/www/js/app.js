var db = null;

angular.module('fixedApp', ['ionic', 'ngCordova', 'fixedApp.controllers'])

.run(function($ionicPlatform, $cordovaSQLite, $cordovaFile, $localStorage) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    //db = $cordovaSQLite.openDB({ name: "my.db" });

    if(window.cordova) {
      // App syntax
      db = $cordovaSQLite.openDB({ name: "my.db" });
    } else {
      // Ionic serve syntax
      db = window.openDatabase("my.db", "1.0", "My db", -1);
    }

    /*
    query = "DROP TABLE IF EXISTS fa_assets";
    $cordovaSQLite.execute(db, query)
      .then(function(result){
        console.log('drop table fa_data success');
        angular.forEach(result, function(value, index) {
          console.log(index + ":" + value);
        });
      }, function(error){
        console.log("drop table fa_data error: " + error.message);
      });

    query = "DROP TABLE IF EXISTS fa_data";
    $cordovaSQLite.execute(db, query)
      .then(function(result){
        console.log('drop table fa_data success');
        angular.forEach(result, function(value, index) {
          console.log(index + ":" + value);
        });
      }, function(error){
        console.log("drop table fa_data error: " + error.message);
      });
    */
    query = "CREATE TABLE IF NOT EXISTS fa_assets (asset_id interger primary key, " +
                "location text)";
    $cordovaSQLite.execute(db, query)
      .then(function(result){
        console.log('create table fa_assets success');
        angular.forEach(result, function(value, index) {
          console.log(index + ":" + value);
        });
      }, function(error){
        console.log(error);
      });
  

    query = "CREATE TABLE IF NOT EXISTS fa_data (asset_id interger, " +
                "location text, comment text, date text, user text)";
    $cordovaSQLite.execute(db, query)
      .then(function(result){
        console.log('create table fa_data success');
        angular.forEach(result, function(value, index) {
          console.log(index + ":" + value);
        });
      }, function(error){
        console.log("create table fa_data error: " + error.message);
      });

    //Re-set Settings
    localStorage.removeItem("settings")

    // Default Settings
    if(localStorage.getItem("settings") == null)
    {
      var settings = {
        "use_defaults": false,
        "username": "",
        "location": "",
        "use_bluetooth": false,
        "edit_after_scan": false
      }

      $localStorage.setObject("settings", settings);
    }

   console.log( "settings = " + localStorage.getItem("settings"));

    settings = $localStorage.getObject("settings");

    console.log("Settings : ");
    angular.forEach(settings, function(value, index) {
          console.log(index + ":" + value);
    });

  });
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
  $stateProvider

    .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'app/app.html',
    controller: 'AppCtrl'
  })

  .state('app.home', {
    url: '/home',
    views: {
      'mainContent': {
        templateUrl: 'app/home.html',
        controller: 'HomeCtrl'
      }
    }
  })

  .state('app.continue', {
    url: '/continue',
    params: {asset:null},
    views: {
      'mainContent': {
        templateUrl: 'app/continue.html',
        controller: 'ContinueCtrl'
      }
    }
  })
  
  .state('app.browse', {
      url: '/browse',
      views: {
        'mainContent': {
          templateUrl: 'app/browse.html',
          controller: 'BrowseCtrl'
        }
      }
    })

  .state('app.send', {
    url: '/send',
    views: {
      'mainContent': {
        templateUrl: 'app/send.html',
        controller: 'SendCtrl'
      }
    }
  })

  .state('app.add', {
    url: '/add/:id',
    views: {
      'mainContent': {
        templateUrl: 'app/add.html',
        controller: 'AddCtrl'
      }
    }
  })

  .state('app.settings', {
    url: '/settings',
    views: {
      'mainContent': {
        templateUrl: 'app/settings.html',
        controller: 'SettingsCtrl'
      }
    }
  });

  $ionicConfigProvider.tabs.position('bottom'); // other values: top
  $ionicConfigProvider.views.maxCache(0);

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/home');
  //$urlRouterProvider.otherwise('/add');
});
