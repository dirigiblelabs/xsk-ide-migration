export class RepositoryRequest {
    constructor(requestMethod) {
        this.requestMethod = requestMethod;
    }
    get contentLength() {
        return Buffer.from(JSON.stringify(this.requestMethod)).length;
    }
}
