var RepositoryHeader = require('xsk-ide-migration/server/migration/repository/repository-header');
var ResponseAttachmentParser = require('xsk-ide-migration/server/migration/repository/response-attachment-parser');

let utf8 = org.eclipse.dirigible.api.v3.utils.UTF8Facade;
var bytesUtils = require("io/v4/bytes");

class RepositoryResponse {
    
    constructor(responseBuffer){
       
        var headerBuffer = responseBuffer.slice(0,14);
        this._header = RepositoryHeader.fromBuffer(headerBuffer);
        var contentEnd = 14 + this._header.contentLength;
        this._contentBuffer = responseBuffer.slice(14, contentEnd);
        
        this._attachments = [];
        if(this._header.attachmentCount > 1){
            let attachmentBuffer = responseBuffer.slice(contentEnd, responseBuffer.length);
            this._attachments = ResponseAttachmentParser.parse(attachmentBuffer, this._header.attachmentCount);
        }
        
        
    }
       
    get header() {
        return this._header;
    }
    
    
    get content() {
        var contentString = utf8.decode(this._contentBuffer);
        return JSON.parse(contentString);
    }
    
    
    get attachments() {
        return this._attachments;
    }
    
    
}

module.exports = RepositoryResponse;