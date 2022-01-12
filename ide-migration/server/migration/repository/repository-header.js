import { Utils } from "../utils";
export class RepositoryHeader {
    constructor(attachmentCount, contentLength) {
        this.attachmentCount = attachmentCount;
        this.contentLength = contentLength;
        this._protocol = "repoV2";
    }
    get protocol() {
        return this._protocol;
    }
    static fromBuffer(buffer) {
        let attachmentCountBuffer = buffer.slice(6, 10);
        let attachmentCount = Utils.byteArrayToInt(attachmentCountBuffer);
        let contentLengthBuffer = buffer.slice(10, 14);
        let contentLength = Utils.byteArrayToInt(contentLengthBuffer);
        let actualAttachmentCount = Math.round((attachmentCount) / 2);
        return new RepositoryHeader(actualAttachmentCount, contentLength);
    }
}
