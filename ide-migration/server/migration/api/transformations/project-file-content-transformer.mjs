import { bytes } from "@dirigible/io";
import { HanaVisitor } from "./hana-visitor.mjs";

const TransformerFactory = Java.type("javax.xml.transform.TransformerFactory");
const StreamSource = Java.type("javax.xml.transform.stream.StreamSource");
const StreamResult = Java.type("javax.xml.transform.stream.StreamResult");
const StringReader = Java.type("java.io.StringReader");
const ByteArrayInputStream = Java.type("java.io.ByteArrayInputStream");
const ByteArrayOutputStream = Java.type("java.io.ByteArrayOutputStream");
const XSKProjectMigrationInterceptor = Java.type("com.sap.xsk.modificators.XSKProjectMigrationInterceptor");


export class ProjectFileContentTransformer {

    xskModificator = new XSKProjectMigrationInterceptor();

    removeSchemasAndTransformViewReferencesInTableFunction(tableFunctionContentBytes) {
        const tableFunctionContent = bytes.byteArrayToText(tableFunctionContentBytes);
        let visitor = new HanaVisitor(tableFunctionContent);

        visitor.visit();
        visitor.removeSchemaRefs();
        visitor.removeViewRefs();
        
        return bytes.textToByteArray(visitor.content);
    }

    transformCalculationView(calculationViewXmlBytes) {
        try {
            const columnObjectToResourceUriXslt = `<?xml version="1.0" encoding="UTF8"?>
            <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

                <xsl:template match="node()|@*">
                    <xsl:copy>
                        <xsl:apply-templates select="node()|@*"/>
                    </xsl:copy>
                </xsl:template>

                <xsl:template match="DataSource[@type='DATA_BASE_TABLE']/columnObject[@columnObjectName]">
                    <xsl:element name="resourceUri">
                        <xsl:value-of select="@columnObjectName"/>
                    </xsl:element>
                </xsl:template>
            </xsl:stylesheet>
        `;

            const factory = TransformerFactory.newInstance();
            const source = new StreamSource(new StringReader(columnObjectToResourceUriXslt));
            const transformer = factory.newTransformer(source);

            const text = new StreamSource(new ByteArrayInputStream(calculationViewXmlBytes));
            const bout = new ByteArrayOutputStream();

            transformer.transform(text, new StreamResult(bout));
            const bytes = bout.toByteArray();

            const modifiedContent = this.xskModificator.modify(bytes);

            return modifiedContent;
        } catch (e) {
            console.log("Error json: " + JSON.stringify(e));
        }
    }

    performExternalModifications(workspace, localFiles) {
        for (const localFile of localFiles) {
            const projectName = localFile.projectName;
            xskModificator.interceptXSKProject(workspace, projectName);
        }
    }
}