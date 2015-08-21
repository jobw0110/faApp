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

.factory("$fileFactory", function($q) {

    var File = function() { };

    File.prototype = {

        getEntries: function(path) {
            var deferred = $q.defer();
            window.resolveLocalFileSystemURI(path, function(fileSystem) {
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
        }

    };

    return File;

})

.controller('IndexCtrl', function($scope, $state, $stateParams, $ionicHistory, $ionicPopup, $cordovaFile) {

  document.addEventListener("deviceready", function() {

    if(window.cordova) {

      //alert(cordova.file.dataDirectory);
      //alert(cordova.file.externalRootDirectory);

      // CHECK
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

        $scope.routeTo("app.continue");

      } else {
        console.log('You are not sure');
      }
    });
  }

})

.controller('HomeCtrl', function($scope, $state, $stateParams, $ionicHistory, $ionicPopup, $cordovaFile, $filter) {

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

        var path = cordova.file.externalRootDirectory + "StwFixed";
        var file = "fa_data.csv";
        var date = new Date();
        var fileDate = $filter('date')(date, "yyyyMMdd_HHmm");
        
        var newFile = "fa_data_" + fileDate + ".csv";

        alert(newFile); 

        //rename file
        $cordovaFile.moveFile(path, "fa_data.csv", path, newFile)
          .then(function (success) {
            // success
            console.log("moveFile successful");

            $cordovaFile.createFile(path, "fa_data.csv", false)
              .then(function (success) {
                // success
                console.log("file: fa_data.csv created");
                $scope.routeTo("app.continue");
              }, function (error) {
                // error
                console.log("createFile error: " + error.message);
              });

          }, function (error) {
            // error
            console.log("moveFile error: " + error.message);
          });

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
  $filter, $cordovaFile, $ionicPopup) {
  
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

        //$state.go("app.continue");
        $state.go("app.continue", {asset:null},  { reload: true });
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
  $scope.show = function() {

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
     }
   });

   // For example's sake, hide the sheet after two seconds
   $timeout(function() {
     hideSheet();
   }, 2000);

  };

});