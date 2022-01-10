/*
 * Copyright (c) 2021 SAP SE or an SAP affiliate company and XSK contributors
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Apache License, v2.0
 * which accompanies this distribution, and is available at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * SPDX-FileCopyrightText: 2021 SAP SE or an SAP affiliate company and XSK contributors
 * SPDX-License-Identifier: Apache-2.0
 */
const TransformerFactory = Java.type("javax.xml.transform.TransformerFactory");
const StreamSource = Java.type("javax.xml.transform.stream.StreamSource");
const StreamResult = Java.type("javax.xml.transform.stream.StreamResult");
const StringReader = Java.type("java.io.StringReader");
const ByteArrayOutputStream = Java.type("java.io.ByteArrayOutputStream");
const ByteArrayInputStream = Java.type("java.io.ByteArrayInputStream");

class CalculationViewModifierService {


  removeTypeArtifact(calculationViewXmlBytes) {

    const removeTypeArtifactUriXslt = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:exsl="http://exslt.org/common">
 <xsl:variable name="remove">
    </xsl:variable>
    <xsl:template match="DataSource/@type">
        <xsl:if test="not(exsl:node-set($remove))">
            <xsl:copy/>
        </xsl:if>
    </xsl:template>

<xsl:template match="@*|node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()"/>
        </xsl:copy>
    </xsl:template>
</xsl:stylesheet>`;

    const factory = TransformerFactory.newInstance();
    const source = new StreamSource(new StringReader(removeTypeArtifactUriXslt));
    const transformer = factory.newTransformer(source);
    const text = new StreamSource(new ByteArrayInputStream(calculationViewXmlBytes));
    const bout = new ByteArrayOutputStream();
    transformer.transform(text, new StreamResult(bout));
    return bout.toByteArray();
  }
}

module.exports = CalculationViewModifierService;


