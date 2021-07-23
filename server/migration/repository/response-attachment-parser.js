const Utils = require('migration/utils');

class ResponseAttachmentParser {

    static parse(responseAttachmentBuffer, numberOfAttachments) {
        var attachments = [];
        var lengthStart = 0;
        var lengthEnd = 4;

        for(let i = 1; i <= numberOfAttachments; i++) {
            let lengthBuffer = responseAttachmentBuffer.slice(lengthStart, lengthEnd);
            let length = Utils.byteArrayToInt(lengthBuffer);

            let contentStart = lengthEnd;
            let contentEnd = contentStart + length;
            let contentBuffer = responseAttachmentBuffer.slice(contentStart, contentEnd);

            attachments.push(contentBuffer);

            lengthStart = contentEnd;
            lengthEnd = lengthStart + 4;
        }
        return attachments;
    }

}

module.exports = ResponseAttachmentParser;