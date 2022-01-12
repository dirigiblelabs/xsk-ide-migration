export class RepositoryRequest {

    constructor(private readonly requestMethod) {
    }

    get contentLength() {
        return Buffer.from(JSON.stringify(this.requestMethod)).length;
    }

}