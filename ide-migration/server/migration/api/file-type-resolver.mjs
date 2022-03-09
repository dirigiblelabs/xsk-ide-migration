export function isCalculationView(filePath) {
    return filePath.endsWith(".hdbcalculationview") || filePath.endsWith(".calculationview");
}


export function isTableFunction(filePath) {
    return filePath.endsWith(".hdbtablefunction")
        || filePath.endsWith(".tablefunction")
        || filePath.endsWith(".tablefunction")
        || filePath.endsWith(".hdbscalarfunction")
        || filePath.endsWith(".scalarfunction");
}

export function isHdbSynonym(filePath) {
    return filePath.endsWith(".hdbpublicsynonym") 
    || filePath.endsWith(".hdbsynonym");
}
