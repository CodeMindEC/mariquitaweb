const fs = require("fs");
const path = require("path");

function fixImports(dir) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            fixImports(filePath);
        } else if (file.endsWith(".js")) {
            let content = fs.readFileSync(filePath, "utf8");

            // Fix imports
            content = content.replace(/from\s+['"](\.[^'"]+)['"]/g, (match, importPath) => {
                const fullPath = path.resolve(path.dirname(filePath), importPath);
                let relativePath = path.relative(path.dirname(filePath), fullPath).replace(/\\/g, "/");

                if (!relativePath.startsWith(".")) {
                    relativePath = "./" + relativePath;
                }

                if (fs.existsSync(fullPath + ".js")) {
                    return `from '${relativePath}.js'`;
                } else if (fs.existsSync(path.join(fullPath, "index.js"))) {
                    return `from '${relativePath}/index.js'`;
                }
                return match;
            });

            // Fix exports
            content = content.replace(/export\s+.*from\s+['"](\.[^'"]+)['"]/g, (match, exportPath) => {
                const fullPath = path.resolve(path.dirname(filePath), exportPath);
                let relativePath = path.relative(path.dirname(filePath), fullPath).replace(/\\/g, "/");

                if (!relativePath.startsWith(".")) {
                    relativePath = "./" + relativePath;
                }

                if (fs.existsSync(fullPath + ".js")) {
                    return match.replace(exportPath, relativePath + ".js");
                } else if (fs.existsSync(path.join(fullPath, "index.js"))) {
                    return match.replace(exportPath, relativePath + "/index.js");
                }
                return match;
            });

            fs.writeFileSync(filePath, content);
        }
    });
}

const esmDir = path.join(__dirname, "..", "..", "node_modules", "@medusajs", "js-sdk", "dist", "esm");
fixImports(esmDir);
console.log("Fixed ESM imports and exports for @medusajs/js-sdk");
