const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const descriptors = require('../../plugins.json');

// Проверяем прямые регистрации в entry встроенных плагинов, не исполняя их код.
// Импорты и значения переменных этот контроль не разрешает.
function extractDocumentTypes(entryPath) {
    const source = ts.createSourceFile(
        entryPath, fs.readFileSync(entryPath, 'utf8'), ts.ScriptTarget.Latest, false, ts.ScriptKind.JS
    );
    const documents = new Set();
    const visit = (node) => {
        if (ts.isCallExpression(node)) {
            const register = node.expression;
            if (ts.isPropertyAccessExpression(register)
                && register.name.text === 'register'
                && ts.isPropertyAccessExpression(register.expression)
                && register.expression.name.text === 'documents'
                && ts.isIdentifier(register.expression.expression)
                && register.expression.expression.text === 'DocHub') {
                const type = node.arguments[0];
                if (type && ts.isStringLiteral(type)) documents.add(type.text);
            }
        }
        ts.forEachChild(node, visit);
    };
    visit(source);
    return [...documents].sort();
}

test.each(descriptors.filter((plugin) => plugin.source.type === 'local'))(
    '$id: documents совпадают с регистрациями в entry', (plugin) => {
        const directory = path.resolve(__dirname, '../..', plugin.source.location);
        const { main = 'index.js' } = require(path.join(directory, 'package.json'));

        expect(extractDocumentTypes(path.resolve(directory, main))).toEqual([...plugin.documents].sort());
    }
);
