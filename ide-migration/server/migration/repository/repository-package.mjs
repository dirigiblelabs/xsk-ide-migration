export class RepositoryPackage {
    constructor(pkg) {
        this.pkg = pkg;
    }
    get packageName() {
        return this.pkg.package;
    }
    get packageFile() {
        let path = this.packageName.replace(/\./g, '/');
        return '/' + path;
    }
}
