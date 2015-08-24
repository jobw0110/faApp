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

.factory("$fileFactory", function($q, $cordovaFile, $state, $filter, $ionicHistory) {

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

          var path = cordova.file.externalRootDirectory + "StwFixed";
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
                  Alert("New Inventory file was created.");
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

          $cordovaFile.checkDir(cordova.file.externalRootDirectory, "StwFixed")
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

            $cordovaFile.createDir(cordova.file.externalRootDirectory, "StwFixed", false)
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
          $cordovaFile.checkFile(cordova.file.externalRootDirectory + "StwFixed", "fa_data.csv")
            .then(function (success) {
              // success
              console.log("file: fa_data.csv exists");
            }, function (error) 
            {
              // error
              console.log("checkFile error: " + error.message);

              $cordovaFile.createFile(cordova.file.externalRootDirectory + "StwFixed", "fa_data.csv", false)
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
          $cordovaFile.writeExistingFile(cordova.file.externalRootDirectory + "StwFixed", "fa_data.csv", csv, {'append':true})
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

.controller('AppCtrl', function($scope, $state, $stateParams, $ionicHistory, $ionicPopup, $cordovaFile, $fileFactory) {

  document.addEventListener("deviceready", function() {

    if(window.cordova) {

      //alert(cordova.file.dataDirectory);
      //alert(cordova.file.externalRootDirectory);

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
 $cordovaSQLite, $ionicHistory, $cordovaFile, $filter, $ionicPopup) {

  //alert('Continue Ctrl');

  $scope.asset = null;

  $scope.bluetooth = true;
  $scope.inputBarcode = false;
  
  
  //$scope.editScan = false;
  $scope.editScan = true;

  //if bluetooth device is selected goto input view
  if($scope.bluetooth)
  {
    $scope.inputBarcode = true;
  }

  //--------------------------All scope functions--------------------------------------
  $scope.reset = function() {
    $scope.barcode = null;
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
        console.log('popup success');
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
      
      $scope.asset = {"id": barcode, "location":"desk", "comment":"", "date":"08/18/2015", "user":"jwilliams"};
      $scope.addAsset($scope.asset);

    }
    
  } // end of submit scan

  $scope.addAsset = function(asset) {
    //add asset to inventory file
    var query = "INSERT INTO fa_data (asset_id, location, comment, date, user) " + 
              "VALUES (?, ?, ?, ?, ?)";

    console.log("date : " + asset.date);

    var date = new Date(asset.date);
    
    date = $filter('date')(date, "MM/dd/yyyy");
    console.log("date : " + date);

    //date = date.substring(0,10);
    //date = date.replace("-","/");
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
    
          $cordovaFile.writeExistingFile(cordova.file.externalRootDirectory + "StwFixed", "fa_data.csv", csv, {'append':true})
            .then(function (success) {
              // success
              console.log("file write sucessful");

              $scope.asset = asset;
              console.log("write successfull scope asset set value: ");
              angular.forEach($scope.asset, function(value, index) {
                console.log(index + ":" + value);
              });

              $scope.showAlert($scope.asset);
              
              $ionicHistory.nextViewOptions({
                disableBack: true
              });
              console.log('going home');
              $state.go("app.home");
              

            }, function (error) {
              // error
              console.log("writeExistingFile error: " + error.message);
            });

        }
        
      }, function(error){
        console.log("insert error message : " + error.message);
      });
  } //end of addAsset

})

.controller('AddCtrl', function($scope, $state, $stateParams, $cordovaSQLite, $ionicHistory, 
  $filter, $cordovaFile, $ionicPopup, $fileFactory) {
  
  $scope.barcode = $stateParams.id;
  $scope.asset = null;

  $scope.submitAsset = function(barcode, location, comment, date, user){
    
    $scope.asset = {"id": barcode, "location":location, "comment":comment, "date":date, "user":user};

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

    console.log("date : " + asset.date);

    var date = new Date(asset.date);
    
    date = $filter('date')(date, "MM/dd/yyyy");
    console.log("date : " + date);

    //date = date.substring(0,10);
    //date = date.replace("-","/");
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

.controller('SendCtrl', function($scope, $state, $stateParams, $cordovaEmailComposer) {
  
  $scope.email = {destination:"", subject:"", body:""};

  $scope.cancel = function() {

    $ionicHistory.nextViewOptions({
      disableBack: true
    });

    $state.go("app.home");

  }

  $scope.sendEmail = function(email)
  {
    console.log(email);
    alert(cordova.file.externalRootDirectory + "StwFixed/fa_data.csv");
    var file = cordova.file.externalRootDirectory + "StwFixed/fa_data.csv";
    var email = {
      to: 'cbarber@stwinc.net',
      cc: 'jwilliams@gmail.com',
      bcc: null,
      attachments: [
        file
      ],
      subject: 'Stw Fixed Asset Inventory',
      body: "File created with the STW Fixed Asset Mobile App'",
      isHtml: true
    };

    $cordovaEmailComposer.open(email).then(null, function () {
       // user cancelled email
    });
  }

}) //end of SendCtrl
.controller('BrowseCtrl', function($scope, $state, $stateParams, $ionicHistory, $ionicPopup, $cordovaFile,
  $ionicPlatform, $fileFactory, $ionicActionSheet, $timeout) {

  alert("BrowseCtrl");
  
  var fs = new $fileFactory();

  $ionicPlatform.ready(function() {

    var path = cordova.file.externalRootDirectory + "StwFixed";

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
       //send clicked

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

    var path = cordova.file.externalRootDirectory;

    var relativePath = "StwFixed/" + file;

    fs.removeFile(path, relativePath).then(function(result){
      console.log("remove file result" + result);
      $state.go("app.browse");
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

})

.controller('SettingsCtrl', function($scope, $state, $stateParams, $ionicHistory, $ionicPopup, $cordovaFile,
  $ionicPlatform, $ionicActionSheet, $timeout) {

});