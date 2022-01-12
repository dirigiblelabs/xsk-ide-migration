export class RepositoryPackage {

    constructor(private readonly pkg) {
    }

    get packageName() {
        return this.pkg.package;
    }

    get packageFile() {
        let path = this.packageName.replace(/\./g, '/');

        return '/' + path;
    }

}