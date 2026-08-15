import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const localeDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/i18n/locales",
);

function unwrapExpression(expression) {
  let current = expression;
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function propertyName(property, sourceFile) {
  const name = property.name;
  if (ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  if (ts.isIdentifier(name)) return name.text;
  const line = sourceFile.getLineAndCharacterOfPosition(name.pos).line + 1;
  throw new Error(`Unsupported translation key at line ${line}`);
}

function readLocale(fileName, variableName) {
  const filePath = path.join(localeDirectory, fileName);
  const source = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  let object;
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === variableName
      ) {
        object = unwrapExpression(declaration.initializer);
      }
    }
  }
  if (!object || !ts.isObjectLiteralExpression(object)) {
    throw new Error(`${fileName} must export a static ${variableName} object`);
  }

  const entries = new Map();
  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property)) {
      throw new Error(
        `${fileName} contains an unsupported property declaration`,
      );
    }
    const key = propertyName(property, sourceFile);
    const value = unwrapExpression(property.initializer);
    if (
      !ts.isStringLiteral(value) &&
      !ts.isNoSubstitutionTemplateLiteral(value)
    ) {
      throw new Error(`${fileName} translation ${key} must be a static string`);
    }
    if (entries.has(key))
      throw new Error(`${fileName} contains duplicate key ${key}`);
    entries.set(key, value.text);
  }
  return entries;
}

const en = readLocale("en.ts", "en");
const zhCN = readLocale("zh-CN.ts", "zhCN");
const placeholderPattern = /\{([A-Za-z][A-Za-z0-9_]*)\}/g;
const placeholders = (value) =>
  [...value.matchAll(placeholderPattern)].map((match) => match[1]).sort();
const errors = [];

for (const [key, enValue] of en) {
  if (!zhCN.has(key)) {
    errors.push(`zh-CN missing key: ${key}`);
    continue;
  }
  const zhValue = zhCN.get(key);
  if (!enValue.trim()) errors.push(`en has empty value: ${key}`);
  if (!zhValue.trim()) errors.push(`zh-CN has empty value: ${key}`);
  if (placeholders(enValue).join(",") !== placeholders(zhValue).join(",")) {
    errors.push(`placeholder mismatch: ${key}`);
  }
}

for (const key of zhCN.keys()) {
  if (!en.has(key)) errors.push(`zh-CN has extra key: ${key}`);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`i18n check passed: ${en.size} keys in en and zh-CN`);
