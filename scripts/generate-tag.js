#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const packageFile = path.join(__dirname, "..", "package.json");

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function getVersionParts(version) {
  return version.split(".").map(Number);
}

function setVersion(parts) {
  return parts.join(".");
}

function updateVersion(type) {
  const pkg = readJSON(packageFile);
  let [major, minor, patch] = getVersionParts(pkg.version);
  if (type === "minor") {
    minor++;
    patch = 0;
  } else if (type === "patch") {
    patch++;
  }
  pkg.version = setVersion([major, minor, patch]);
  writeJSON(packageFile, pkg);
  return pkg.version;
}

function detectChangeType(prev, curr) {
  const prevMap = new Map(prev.map((b) => [b.titulo, b]));
  const currMap = new Map(curr.map((b) => [b.titulo, b]));
  let added = false;
  let changed = false;
  for (const [titulo] of currMap) {
    if (!prevMap.has(titulo)) added = true;
  }
  for (const [titulo, classificado] of currMap) {
    
    const prevClassificado = prevMap.get(titulo);
    if (prevClassificado) {
      const a = { ...classificado };
      const b = { ...prevClassificado };
      delete a.ultimaAtualizacao;
      delete b.ultimaAtualizacao;
      if (JSON.stringify(a) !== JSON.stringify(b)) changed = true;
    }
  }
  if (added) return "minor";
  if (changed) return "patch";
  return null;
}

function getPreviousFromGit() {
  try {
    const prevContent = execSync("git show origin/main:classificados.json").toString();
    return JSON.parse(prevContent);
  } catch (e) {
    return null;
  }
}

function getCurrentFromGit() {
  try {
    const currContent = execSync("git show HEAD:classificados.json").toString();
    return JSON.parse(currContent);
  } catch (e) {
    return null;
  }
}

function main() {
  const prev = getPreviousFromGit();
  const curr = getCurrentFromGit();
  if (!prev || !curr) {
    console.log("Não foi possível obter classificados.json dos commits.");
    return;
  }
  const type = detectChangeType(prev, curr);
  if (!type) {
    console.log("Nenhuma mudança relevante detectada.");
    return;
  }
  const newVersion = updateVersion(type);
  execSync(`git add package.json`);
  execSync(`git commit -m "chore: bump version to v${newVersion} [skip ci]"`);
  execSync(`git tag v${newVersion}`);
  execSync(`git push origin main --tags`);
  console.log(`Versão ${newVersion} gerada e tag criada (${type}).`);
}

if (require.main === module) {
  main();
}
