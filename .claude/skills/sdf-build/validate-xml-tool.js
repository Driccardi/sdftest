#!/usr/bin/env node

/**
 * validate-sdf-xml.js
 * Validates NetSuite SDF XML files against their corresponding XSD schemas.
 * 
 * Usage:
 *   node validate-sdf-xml.js <xml-file> [--xsd <xsd-file>]
 * 
 * Examples:
 *   node validate-sdf-xml.js ./sdf/myproject/src/Objects/custentity_ns_acme_vendor_memo.xml
 *   node validate-sdf-xml.js ./myfield.xml --xsd entitycustomfield.xsd
 * 
 * If --xsd is not provided, the tool will attempt to auto-detect the schema
 * based on the root element of the XML file.
 */

const fs = require('fs');
const path = require('path');
const libxmljs = require('libxmljs2');

// Resolve references directory relative to this script's location
const SCRIPT_DIR = __dirname;
const REFERENCES_DIR = path.join(SCRIPT_DIR, 'reference');

function getAvailableSchemas() {
  try {
    return fs.readdirSync(REFERENCES_DIR)
      .filter(f => f.endsWith('.xsd'))
      .map(f => f.replace('.xsd', ''));
  } catch (err) {
    console.error(`Error reading references directory: ${REFERENCES_DIR}`);
    console.error(err.message);
    process.exit(1);
  }
}

function detectSchemaFromXml(xmlContent) {
  try {
    const doc = libxmljs.parseXml(xmlContent);
    const root = doc.root();
    if (root) {
      return root.name();
    }
  } catch (err) {
    // Will be caught later during full validation
  }
  return null;
}

function validateXml(xmlPath, xsdName) {
  // Read XML file
  let xmlContent;
  try {
    xmlContent = fs.readFileSync(xmlPath, 'utf8');
  } catch (err) {
    return {
      success: false,
      error: `Failed to read XML file: ${err.message}`,
      errors: []
    };
  }

  // Auto-detect schema if not provided
  if (!xsdName) {
    xsdName = detectSchemaFromXml(xmlContent);
    if (!xsdName) {
      return {
        success: false,
        error: 'Could not detect schema type from XML root element. Use --xsd to specify.',
        errors: []
      };
    }
  }

  // Remove .xsd extension if provided
  xsdName = xsdName.replace(/\.xsd$/, '');

  // Check if schema exists
  const availableSchemas = getAvailableSchemas();
  if (!availableSchemas.includes(xsdName)) {
    return {
      success: false,
      error: `Schema '${xsdName}.xsd' not found in ${REFERENCES_DIR}`,
      availableSchemas,
      errors: []
    };
  }

  // Read XSD file
  const xsdPath = path.join(REFERENCES_DIR, `${xsdName}.xsd`);
  let xsdContent;
  try {
    xsdContent = fs.readFileSync(xsdPath, 'utf8');
  } catch (err) {
    return {
      success: false,
      error: `Failed to read XSD file: ${err.message}`,
      errors: []
    };
  }

  // Parse and validate
  try {
    const xsdDoc = libxmljs.parseXml(xsdContent);
    const xmlDoc = libxmljs.parseXml(xmlContent);
    
    const isValid = xmlDoc.validate(xsdDoc);
    
    if (isValid) {
      return {
        success: true,
        schema: xsdName,
        message: `XML is valid against ${xsdName}.xsd`
      };
    } else {
      return {
        success: false,
        schema: xsdName,
        error: 'XML validation failed',
        errors: xmlDoc.validationErrors.map(err => ({
          message: err.message,
          line: err.line,
          column: err.column
        }))
      };
    }
  } catch (err) {
    return {
      success: false,
      error: `XML parsing error: ${err.message}`,
      errors: []
    };
  }
}

function printUsage() {
  console.log(`
Usage: node validate-sdf-xml.js <xml-file> [--xsd <schema-name>]

Options:
  --xsd <name>    Specify the XSD schema to validate against (without .xsd extension)
  --list          List available schemas
  --help          Show this help message

Examples:
  node validate-sdf-xml.js ./src/Objects/myfield.xml
  node validate-sdf-xml.js ./myfield.xml --xsd entitycustomfield
  node validate-sdf-xml.js --list
`);
}

// CLI handling
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    printUsage();
    process.exit(0);
  }

  if (args.includes('--list')) {
    const schemas = getAvailableSchemas();
    console.log('Available schemas:');
    schemas.forEach(s => console.log(`  - ${s}`));
    process.exit(0);
  }

  // Parse arguments
  let xmlPath = null;
  let xsdName = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--xsd' && args[i + 1]) {
      xsdName = args[i + 1];
      i++;
    } else if (!args[i].startsWith('--')) {
      xmlPath = args[i];
    }
  }

  if (!xmlPath) {
    console.error('Error: No XML file specified');
    printUsage();
    process.exit(1);
  }

  // Run validation
  const result = validateXml(xmlPath, xsdName);

  // Output result as JSON for programmatic use
  console.log(JSON.stringify(result, null, 2));

  process.exit(result.success ? 0 : 1);
}

// Export for programmatic use
module.exports = { validateXml, getAvailableSchemas, detectSchemaFromXml };

// Run CLI if executed directly
if (require.main === module) {
  main();
}
