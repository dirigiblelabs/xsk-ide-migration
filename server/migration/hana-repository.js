var RepositoryRequest = require('migration/repository-request');
var RepositoryResponse = require('migration/repository-response');
var RepositoryObject = require('migration/repository-object');
var RepositoryPackage = require('migration/repository-package');

var packageFilter = require('migration/package-filter');
var ObjectTypeFilter = require('migration/object-type-filter');
const utf8 = org.eclipse.dirigible.api.v3.utils.UTF8Facade;
const Utils = require('migration/utils');
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
