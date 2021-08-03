var RepositoryRequest = require('xsk-ide-migration/server/migration/repository/repository-request');
var RepositoryResponse = require('xsk-ide-migration/server/migration/repository/repository-response');
var RepositoryObject = require('xsk-ide-migration/server/migration/repository/repository-object');
var RepositoryPackage = require('xsk-ide-migration/server/migration/repository/repository-package');

var packageFilter = require('xsk-ide-migration/server/migration/repository/package-filter');
var ObjectTypeFilter = require('xsk-ide-migration/server/migration/repository/object-type-filter');
const utf8 = org.eclipse.dirigible.api.v3.utils.UTF8Facade;
const Utils = require('xsk-ide-migration/server/migration/utils');
const bytesUtils = require("io/v4/bytes");

class HanaRepository{
    
    constructor(hdbClient){
        this.hdbClient = hdbClient;
    }

    getAllDeliveryUnits(callback) {

        var requestMethod = {
            "action": "get",
            "what": "allDeliveryUnits"
        };

        var repositoryRequest = requestMethod;

        var processResponse = function(error, response){
            if(error){
                return callback(error);
            }
            return callback(null, response.content.deliveryUnits);
        };

        this._executeRequest(repositoryRequest, processResponse);
    }

    _getAllPackagesForDu(deliveryUnit, callback){
        var hanaRepositoryInstance = this;

        hanaRepositoryInstance._listPackages(deliveryUnit, function(error, packages){
            if(error){
                return callback(error);
            }
            
            var flatPackages = [].concat.apply([], packages);
            hanaRepositoryInstance._convertPackagesToRepositoryPackages(flatPackages, callback);
        });

    }

    _listPackages(du, callback){

        var requestMethod = {
            action: 'list',
            what: 'packages',
            delivery_unit: du.name
        };

        // var repositoryRequest = new RepositoryRequest(1, requestMethod);
        var repositoryRequest = requestMethod;

        var processResponse = function(error, response) {
            if(error){
                return callback(error);
            }
            callback(null, response.content.packages);
        };

        this._executeRequest(repositoryRequest, processResponse);
    }

    _convertPackagesToRepositoryPackages(packages, callback){
        //This needs to be done because the repo-api names the package-name as "package" while halm refers to it as "packageName"
        var repositoryPackages = [];

        for(let i = 0; i < packages.length; i++) {
            let pkg = packages[i];
            var repositoryPackage = new RepositoryPackage(pkg);
            repositoryPackages.push(repositoryPackage);
        }
        callback(null, repositoryPackages);

    }

    _getAllObjectsForPackages(packages, callback){
        var hanaRepositoryInstance = this;

        let done = 0;
        let result = [];
        for(let i = 0; i < packages.length; i++) {
            const pkg = packages[i];
            hanaRepositoryInstance._listObjects(pkg, function(error, objects){
                // if(error){
                //     return processingFinished(error);
                // }
                
                done++;
                result = result.concat(objects)
                if (done === packages.length) {
                    
                    return callback(null, packages, result);
                }
            });

        }

    }

    _listObjects(pkg, callback){
        var requestMethod = {
            action: 'list',
            what: 'objects',
            'package': pkg.packageName
        };

        // console.trace('Starting List objects for package: ' + pkg.packageName);

        var repositoryRequest = requestMethod;
        var hanaRepositoryInstance = this;

        var processResponse = function(error, response) {
            //console.trace('List objects finished for package: ' + pkg.packageName + ' #objects: ' + response.content.objects.length);
            if(error){
                return callback(error);
            }
            
            hanaRepositoryInstance._convertObjectsToRepositoryObjects(response.content.objects, callback);

        };

        this._executeRequest(repositoryRequest, processResponse);
    }

    _convertObjectsToRepositoryObjects(objects, callback){

        var hanaRepositoryInstance = this;

        let repositoryObjects = [];
        for(let i = 0; i < objects.length; i++) {
            const object = objects[i];
            var repositoryObject = new RepositoryObject(object.name, object.package, object.suffix);
            
            hanaRepositoryInstance._addLanguageAndContent(repositoryObject, (err, result) => {
                
                repositoryObjects.push(result);
                
                if (repositoryObjects.length === objects.length) {
                    return callback(null, repositoryObjects);
                }
            });
        }

    }

    _addLanguageAndContent(repositoryObject, callback){
        var hanaRepositoryInstance = this;

        //logUtil.trace('Loading language and content for: ' + repositoryObject.fullName);
        
        hanaRepositoryInstance._getOriginalLanguage(repositoryObject.PackageName.packageName, originalLanguage => {
            hanaRepositoryInstance._getFileContent(repositoryObject, (err, content) => {
                repositoryObject.originalLanguage = originalLanguage;
                repositoryObject.content = content;
                return callback(null, repositoryObject);
            });
        });

    }

    _getOriginalLanguage(packageName, callback){

        var requestMethod = {
            action: 'read',
            what: 'package',
            'package': packageName
        };

        var repositoryRequest = requestMethod;

        var processResponse = function(error, response) {
            if(error){
                return callback(error);
            }
            callback(null, response.content.orig_lang);
        };

        this._executeRequest(repositoryRequest, processResponse);

    }


    _getFileContent(repositoryObject, callback){
        var requestMethod = {
            action: "read",
            what: "object",
            object: {
                'package': repositoryObject.PackageName.packageName,
                name: repositoryObject.simpleName,
                suffix: repositoryObject.suffix
            }
        };

        var repositoryRequest = requestMethod;

        var processResponse = function(error, response) {
            if(error){
                return callback(error);
            }
            var fileContent;

            if(response.attachments[0].length == 0 && response.attachments[1].length > 0){
                fileContent = response.attachments[1];
            } else {
                fileContent = response.attachments[0];
            }

            callback(null, fileContent);
        };

        this._executeRequest(repositoryRequest, processResponse);

    }

    _packagesCollected(packages, fileList, outerCallback) {
        let deduped = new Map();

        fileList.forEach(function (file) {
            deduped.set(file._packageName + '::' + file._name + '::' + file._suffix, file);
        });

        let dedupedList = Array.from(deduped.values());
        // let filteredList = ObjectTypeFilter.filterObjects(globalContext.includedObjectTypes, globalContext.excludedObjectTypes, dedupedList);
        outerCallback(null, dedupedList, packages)
    }

    getAllFilesForDu(globalContext, deliveryUnit, callback){

        var hanaRepositoryInstance = this;

        this._getAllPackagesForDu(deliveryUnit, (err, packages) => {
   
            var filteredPackages = packageFilter.filterPackages(globalContext, packages) || [];
     
            hanaRepositoryInstance._getAllObjectsForPackages(filteredPackages, (err, packages, fileList) => {

                
                return this._packagesCollected(packages, fileList, callback);
            });
        });
    }

    _executeRequest(repositoryRequest, outerCallback){
    
        var statement = this.hdbClient.prepareCall("CALL SYS.REPOSITORY_REST(?, ?)");
        let bytes = this._encode(JSON.stringify(repositoryRequest), []);
        statement.setBytes(1, bytesUtils.toJavaBytes(bytes));
        statement.execute();
        let result = bytesUtils.toJavaScriptBytes(statement.getBytes(2), [])

        let response = new RepositoryResponse(result);
        statement.close();
        let error = null;

        if (error === null) {
            if(response.content['error-code'] && response.content['error-code'] != 0){
                return outerCallback('' + response.content['error-code'] + ' ' + response.content['error-msg'] + ' ' + response.content['error-arg']);
            }
            return outerCallback(null, response);
        } else {
            return outerCallback(error);
        }

    }

    _encode(json, files) {
        let finalByteArray = [];
        let byteJSONArray = utf8.encode(json);
        let bytesPointer = 0;
        let repositoryProtocol = utf8.encode("repoV2");
        finalByteArray.push(repositoryProtocol);
        bytesPointer += repositoryProtocol.length;
        let binaryDataLength = null;
        let attachmentSize = 1 + (files.length * 2);
        let byteAttachmentCount = Utils.intToByteArray(attachmentSize);
        finalByteArray.push(byteAttachmentCount);
        bytesPointer += byteAttachmentCount.length;
        let bArrJSONLength = Utils.intToByteArray(byteJSONArray.length);
        finalByteArray.push(bArrJSONLength);
        bytesPointer += bArrJSONLength.length;
        finalByteArray.push(byteJSONArray);
        bytesPointer += byteJSONArray.length;

        // for file in files... {}
        let finalRequestArray = [];
        let byteCount = 0;

        for (let i = 0; i < finalByteArray.length; i++) {
            let byteArray = finalByteArray[i];
            for (let u = 0; u < byteArray.length; u++) {
                finalRequestArray.push(byteArray[u]);
                byteCount += 1;
            }
        }
        return finalRequestArray;

  }

  _decode(respAsByteArr, attachments) {
      
        let json = "";
        let bArrAttachmentCount = [];
        Utils.arrayCopy(respAsByteArr, 6, bArrAttachmentCount, 0, 4);
          
        let attachmentCount = Utils.byteArrayToInt(bArrAttachmentCount);
        
        let bArrJSONLength = [];
        Utils.arrayCopy(respAsByteArr, 10, bArrJSONLength, 0, 4);
        jsonLength = Utils.byteArrayToInt(bArrJSONLength);
        let pointer = 14;

        json = utf8.bytesToString(respAsByteArr, pointer, jsonLength);

        return json;

    }

}

module.exports = HanaRepository;
