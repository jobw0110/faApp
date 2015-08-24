angular.module('fixedApp.controllers', [])

.directive('showFocus', function($timeout) {
  return function(scope, element, attrs) {
    scope.$watch(attrs.showFocus, 
      function (newValue) { 
        $timeout(function() {
            newValue && element[0].focus();
        });
      },true);
  };    
})

.factory('$localStorage', ['$window', function($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    setObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
      return JSON.parse($window.localStorage[key] || '{}');
    }
  }
}])

.factory("$fileFactory", function($q, $cordovaFile, $state, $filter, $ionicHistory, $cordovaSQLite) {

    var File = function() { };

    File.prototype = {

        getEntries: function(path) {
            var deferred = $q.defer();
            window.resolveLocalFileSystemURL(path, function(fileSystem) {
                var directoryReader = fileSystem.createReader();
                directoryReader.readEntries(function(entries) {
                    deferred.resolve(entries);
                }, function(error) {
                    deferred.reject(error);
                });
            }, function(error) {
                deferred.reject(error);
            });
            return deferred.promise;
        },

        removeFile: function(path, relativePath) {
          var deferred = $q.defer();
          //to test errors
          //relativePath = relativePath + "k";
          window.resolveLocalFileSystemURL(path, function(fileSystem) {
            fileSystem.getFile(relativePath, {create:false}, function(fileEntry){
              fileEntry.remove(function(file){
                  console.log("File removed!");
                  deferred.resolve(file);
              },function(error){
                  console.log("error deleting the file " + error.code);
                  deferred.reject(error);
              });
            },function(error){
                  console.log("file does not exist");
                  deferred.reject(error);
            });
          },function(error){
              console.log(error.message);
              deferred.reject(error);
          });
          return deferred.promise;
        },

        createNewFile: function() {

          var path = cordova.file.dataDirectory + "StwFixed";
          var file = "fa_data.csv";
          var date = new Date();
          var fileDate = $filter('date')(date, "yyyyMMdd_HHmmss");
          
          var newFile = "fa_data_" + fileDate + ".csv";

          //alert(newFile); 

          //rename file
          $cordovaFile.moveFile(path, "fa_data.csv", path, newFile)
            .then(function (success) {
              // success
              console.log("moveFile successful");

              $cordovaFile.createFile(path, "fa_data.csv", false)
                .then(function (success) {
                  // success
                  console.log("file: fa_data.csv created");
                  alert("New Inventory file was created.");

                  query = "DELETE * FROM TABLE fa_assets";
                  
                  /*$cordovaSQLite.execute(db, query)
                    .then(function(result){
                      console.log('empty table fa_assets success');
                      angular.forEach(result, function(value, index) {
                        console.log(index + ":" + value);
                      });
                    }, function(error){
                      console.log("empty fa_assets table error: " + error.message);
                    });*/

                  $ionicHistory.nextViewOptions({
                    disableBack: true
                  });
                  $state.go("app.continue");
                }, function (error) {
                  // error
                  console.log("createFile error: " + error.message);
                });

            }, function (error) {
              // error
              console.log("moveFile error: " + error.message);
            });

        }, //end of createNewFile

        checkDataFile: function() {

          $cordovaFile.checkDir(cordova.file.dataDirectory, "StwFixed")
          .then(function (success) 
          {
            // success
            angular.forEach(success, function(value, index) {
              console.log(index + ":" + value);
            });
            
            console.log('the directory exists');

          }, function (error) {
            // error
            console.log("checkDir error: " + error.message);
            console.log('directory does not exist');

            $cordovaFile.createDir(cordova.file.dataDirectory, "StwFixed", false)
              .then(function (success) 
              {
                // success
                angular.forEach(success, function(value, index) {
                  console.log(index + ":" + value);
                });

                console.log("createDir success");
              }, function (error) 
              {
                // error
                console.log("createDir error: " + error.message);
              });
          }); //end of checkDir

          //Create Inventory File
          $cordovaFile.checkFile(cordova.file.dataDirectory + "StwFixed", "fa_data.csv")
            .then(function (success) {
              // success
              console.log("file: fa_data.csv exists");
            }, function (error) 
            {
              // error
              console.log("checkFile error: " + error.message);

              $cordovaFile.createFile(cordova.file.dataDirectory + "StwFixed", "fa_data.csv", false)
                .then(function (success) {
                  // success
                  console.log("file: fa_data.csv created");
                }, function (error) {
                  // error
                  console.log("createFile error: " + error.message);
                });

            });

        }, //end of checkDataFile

        insertLine: function(csv) {

          var deferred = $q.defer();
          $cordovaFile.writeExistingFile(cordova.file.dataDirectory + "StwFixed", "fa_data.csv", csv, {'append':true})
            .then(function (success) {
              // success
              console.log("file write sucessful");
              deferred.resolve('success');

            }, function (error) {
              // error
              console.log("writeExistingFile error: " + error.message);
              deferred.reject = error;
            });
            return deferred.promise;
        }

    }

    return File;

})

.controller('AppCtrl', function($scope, $state, $stateParams, $ionicHistory, $ionicPopup, 
  $cordovaFile, $localStorage, $fileFactory) {

  $scope.settings = $localStorage.getObject('settings');

  console.log("AppCtrl settings initialization : ");
  angular.forEach($scope.settings, function(value, index){
    console.log(index + ":" + value);
  });


  document.addEventListener("deviceready", function() {

    if(window.cordova) {

      //alert(cordova.file.dataDirectory);
      //alert(cordova.file.dataDirectory);

      var fs = new $fileFactory;

      fs.checkDataFile();
      

    } // end of if window.cordova

  }); //end of DeviceReady

  $scope.routeTo = function(route){
    
    // it will clear the history stack and sets next view as root of the history stack.
    $ionicHistory.nextViewOptions({
      disableBack: true
    });

    $state.go(route);
  }

  $scope.showConfirm = function() {
    var confirmPopup = $ionicPopup.confirm({
      title: 'New File',
      template: 'Do you want to create a new inventory file?'
    });

    confirmPopup.then(function(res) {
      if(res) {

        console.log('You are sure');

        var fs = new $fileFactory

        fs.createNewFile();

      } else {
        console.log('You are not sure');
      }
    });
  }

  $scope.updateSettings = function(setting, settingValue){
    var settings = $localStorage.getObject('settings');

    /*angular.forEach(settings, function(value, index){
      console.log(index + ":" + value);
    });

    alert('setting : ' + setting);
    alert('setting value :' + settingValue);
    */

    settings[setting] = settingValue;

    $localStorage.setObject('settings', settings);

    console.log('updated settings :');
    angular.forEach($localStorage.getObject('settings'), function(value, index){
      console.log(index + ":" + value);
    });
  }

})

.controller('HomeCtrl', function($scope, $state, $stateParams, $ionicHistory, $ionicPopup, $cordovaFile, $fileFactory) {

  $scope.routeTo = function(route){
    
    // it will clear the history stack and sets next view as root of the history stack.
    $ionicHistory.nextViewOptions({
      disableBack: true
    });

    $state.go(route);
  }

  $scope.showConfirm = function() {
    var confirmPopup = $ionicPopup.confirm({
      title: 'New File',
      template: 'Do you want to create a new inventory file?'
    });

    confirmPopup.then(function(res) {
      if(res) {

        console.log('You are sure');

        var fs = new $fileFactory();

        fs.createNewFile();

      } else {
        console.log('You are not sure');
      }
    });
  }

})

.controller('ContinueCtrl', function($scope, $cordovaBarcodeScanner, $state, $stateParams,
 $cordovaSQLite, $ionicHistory, $cordovaFile, $filter, $ionicPopup, $localStorage, $fileFactory) {

  //alert('Continue Ctrl');

  $scope.settings = $localStorage.getObject('settings');

  $scope.asset = {};

  $scope.bluetooth = $scope.settings.use_bluetooth;
  
  //if bluetooth device is selected goto input view
  $scope.inputBarcode = $scope.bluetooth;
  
  $scope.editScan = $scope.settings.edit_after_scan;

  //--------------------------All scope functions--------------------------------------

  $scope.showAlert = function(asset) {
      var alertPopup = $ionicPopup.alert({
         title: 'Asset Added',
         template: '<div"><p>Asset Id: ' + asset.id + '</p>' +
          '<p>Date: ' + asset.date + '</p>' + 
          '<p>Location: ' + asset.location +'</p>' +
          '<p>Comment: ' + asset.comment + '</p>' +
          '<p>User: ' + asset.user + '</p></div>'
      });
     
      alertPopup.then(function(res) {
        console.log('popup success');
        $ionicHistory.nextViewOptions({
          disableBack: true
        });

        $state.go("app.continue", {asset:null});
      });
   };

  $scope.scanBarcode = function() {

    $cordovaBarcodeScanner
      .scan()
      .then(function(barcodeData) {
        // Success! Barcode data is here
        console.log(barcodeData);
      }, function(error) {
        // An error occurred
      })
  }

  $scope.submitScan = function(barcode) {
    
    if(barcode == undefined)
    {
      alert('please scan a barcode to continue');
      return;
    }


    if($scope.editScan)
    {
      // it will clear the history stack and sets next view as root of the history stack.
      $ionicHistory.nextViewOptions({
        disableBack: true
      });

      $state.go("app.add", {"id": barcode});
    }
    else
    {
      
      var date = new Date();
    
      date = $filter('date')(date, "MM/dd/yyyy");

      $scope.asset = {"id": barcode, "location":$scope.settings.location, "comment":"", "date":date, "user":$scope.settings.user};
      $scope.addAsset($scope.asset);

    }
    
  } // end of submit scan

  $scope.addAsset = function(asset) {
    //add asset to inventory file
    var query = "INSERT INTO fa_data (asset_id, location, comment, date, user) " + 
              "VALUES (?, ?, ?, ?, ?)";

    date = asset.date;

    console.log("date : " + asset.date);

    if(date.trim() == "")
      var date = new Date();
    else
      var date = new Date(asset.date);

    console.log("date : " + date);
    
    date = $filter('date')(date, "MM/dd/yyyy");
    console.log("date : " + date);

    asset.date = date;


    console.log("asset:");
    angular.forEach(asset, function(value, index) {
          console.log(index + ":" + value);
    });

    $cordovaSQLite.execute(db, query, [asset.id, asset.location, asset.comment, asset.date, asset.user])
      .then(function(result)
      {
        
        console.log("insert result: ");
        console.log(result);
        angular.forEach(result, function(value, index) {
          console.log(index + ":" + value);
        });

        var csv = asset.date + "," + asset.location + "," + asset.user + "," + asset.id + "," + asset.comment + "\n";

        console.log("csv text: " + csv);

        if(window.cordova) {

          var fs = new $fileFactory();

          fs.insertLine(csv).then(function(result){

            //alert('insert promise');
            //$scope.asset = asset;
            console.log("asset value: ");
            angular.forEach(asset, function(value, index) {
              console.log(index + ":" + value);
            });

            $scope.showAlert(asset);

          });
        }
        
      }, function(error){
        console.log("insert error message : " + error.message);
      });
  } //end of addAsset

})

.controller('AddCtrl', function($scope, $state, $stateParams, $cordovaSQLite, $ionicHistory, 
  $filter, $cordovaFile, $ionicPopup, $fileFactory, $localStorage) {

  $scope.settings = $localStorage.getObject('settings');
  
  $scope.asset = {
    id:$stateParams.id,
    date:"",
    location:"",
    user:"",
    comment:""
  }

  if($scope.settings.use_defaults)
  {
    $scope.asset.location = $scope.settings.location;
    $scope.asset.user = $scope.settings.user;
  }

  $scope.submitAsset = function(){

    //alert(date);
    console.log("AddCtrl insert data: ");
    angular.forEach($scope.asset, function(value, index) {
      console.log(index + ":" + value);
    });

    $scope.addAsset($scope.asset);
          
    
  }

  $scope.cancel = function() {
    // it will clear the history stack and sets next view as root of the history stack.
    $ionicHistory.nextViewOptions({
      disableBack: true,
    });

    $state.go("app.continue");
    //$state.go("app.continue", {},  { reload: true });
  }

  $scope.showAlert = function(asset) {
      var alertPopup = $ionicPopup.alert({
         title: 'Asset Added',
         template: '<div"><p>Asset Id: ' + asset.id + '</p>' +
          '<p>Date: ' + asset.date + '</p>' + 
          '<p>Location: ' + asset.location +'</p>' +
          '<p>Comment: ' + asset.comment + '</p>' +
          '<p>User: ' + asset.user + '</p></div>'
      });
     
      alertPopup.then(function(res) {
        console.log('add success');
        $ionicHistory.nextViewOptions({
          disableBack: true
        });

        $state.go("app.continue", {asset:null});
        //$state.go("app.continue", {asset:null},  { reload: true });
      });
   };

   $scope.addAsset = function(asset) {
    //add asset to inventory file
    var query = "INSERT INTO fa_data (asset_id, location, comment, date, user) " + 
              "VALUES (?, ?, ?, ?, ?)";

    date = asset.date;

    console.log("date : " + asset.date);

    if(date.trim() == "")
      var date = new Date();
    else
      var date = new Date(asset.date);

    console.log("date : " + date);
    
    date = $filter('date')(date, "MM/dd/yyyy");
    console.log("date : " + date);

    asset.date = date;


    $cordovaSQLite.execute(db, query, [asset.id, asset.location, asset.comment, asset.date, asset.user])
      .then(function(result)
      {
        
        console.log("insert result: ");
        angular.forEach(result, function(value, index) {
          console.log(index + ":" + value);
        });

        console.log("date : " + asset.date);

        var csv = asset.date + "," + asset.location + "," + asset.user + "," + asset.id + "," + asset.comment + "\n";

        console.log("csv text: " + csv);

        if(window.cordova) {
    
          var fs = new $fileFactory();

          fs.insertLine(csv).then(function(result){

            //alert('insert promise');
            //$scope.asset = asset;
            console.log("asset value: ");
            angular.forEach(asset, function(value, index) {
              console.log(index + ":" + value);
            });

            $scope.showAlert(asset);

          });

        }
        
      }, function(error){
        console.log("insert error message : " + error.message);
      });
  } //end of addAsset

})

.controller('SendCtrl', function($scope, $state, $stateParams, $cordovaEmailComposer, $ionicHistory) {
  
  $scope.email = {
    destination:"", 
    subject:"Stw Fixed Assets Inventory", 
    body:"attached: fa_data.csv"
  };

  $scope.cancel = function() {

    $ionicHistory.nextViewOptions({
      disableBack: true
    });

    $state.go("home.home");

  }

  $scope.sendEmail = function(email)
  {
    console.log(email);
    alert(cordova.file.dataDirectory + "StwFixed/fa_data.csv");

    if($stateParams.file == null )
      var file = cordova.file.dataDirectory + "StwFixed/fa_data.csv";
    else
      var file = cordova.file.dataDirectory + "StwFixed/" + stateParams.file;


    var email = {
      //to: email.destination,
      to: 'jwilliams@gmail.com',
      cc: 'jwilliams@gmail.com',
      bcc: null,
      attachments: [
        file
      ],
      subject: email.subject,
      body: email.body,
      isHtml: true
    };

    $cordovaEmailComposer.open(email).then(null, function () {
       // user cancelled email
    });
  }

}) //end of SendCtrl
.controller('BrowseCtrl', function($scope, $state, $stateParams, $ionicHistory, $ionicPopup, $cordovaFile,
  $ionicPlatform, $fileFactory, $ionicActionSheet, $timeout) {

  //alert("BrowseCtrl");

  $ionicPlatform.ready(function() {

    var fs = new $fileFactory();

    if(window.cordova)
    {
      var path = cordova.file.dataDirectory + "StwFixed";

      $scope.browse = path.replace("file:///", "")

      console.log("browse folder revised: " + $scope.browse);
        
      fs.getEntries(path).then(function(result) {
          $scope.files = result;

          console.log('files: ');
          angular.forEach($scope.files, function(value, index) {
            console.log(index + ":" + value.name);
            angular.forEach(value, function(val, ind) {
              console.log(ind + ":" + val);
            });
          });
      });
    }
      
  });

  // Triggered on a button click, or some other target
  $scope.show = function(fileName) {

   // Show the action sheet
   var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: '<i class="icon ion-ios-email positive"></i> Send' },
     ],
     destructiveText: '<i class="icon ion-ios-trash assertive"></i> Delete',
     titleText: '<h4>Manage File</h4>',
     cancelText: 'Cancel',
     cancel: function() {
          // add cancel code..
        },
     buttonClicked: function(index) {
       console.log("index :" + index);
       $ionicHistory.nextViewOptions({
        disableBack: true
      });
      $state.go("app.send", {file:fileName});

     }, 
     destructiveButtonClicked: function() {
       $scope.showConfirm(fileName);
      }
   });

   // For example's sake, hide the sheet after two seconds
   $timeout(function() {
     hideSheet();
   }, 2000);

  };

  $scope.remove = function(file) {
    
    alert(file);

    var fs = new $fileFactory();

    var path = cordova.file.dataDirectory;

    var relativePath = "StwFixed/" + file;

    fs.removeFile(path, relativePath).then(function(result){
      console.log("remove file result" + result);
      alert('file removed');
      $ionicHistory.nextViewOptions({
        disableBack: true
      });
      $state.go("home.home");
    });
  }; //end of function remove

  $scope.showConfirm = function(file) {
    var confirmPopup = $ionicPopup.confirm({
      title: file,
      template: 'Are you sure you want to delete this file?'
    });

     confirmPopup.then(function(res) {
      if(res) {
         console.log('Continue delete');
         $scope.remove(file);

      } else {
        console.log('Cancel delete');
      }
    });
  }; //end of showConfirm

});